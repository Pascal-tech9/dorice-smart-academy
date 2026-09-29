import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/resend';
import { renderResultsPublishedEmail } from '@/lib/email/templates/results-published';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * POST /api/notifications/results-published
 *
 * Called by the admin approve/publish action after a report card is published.
 * Sends email to all linked guardians of the student.
 */

const BodySchema = z.object({
  studentId: z.string().uuid(),
  termLabel: z.string(),  // e.g. 'Term 1 2026'
  grade: z.string(),      // e.g. 'Grade 5'
});

const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doricesmartacademy.sc.ke';
const SCHOOL_NAME = 'Dorice Smart Academy';
const INTERNAL_SECRET = process.env.INTERNAL_NOTIFICATION_SECRET ?? '';

export async function POST(req: NextRequest) {
  if (
    INTERNAL_SECRET &&
    req.headers.get('x-internal-secret') !== INTERNAL_SECRET
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { studentId, termLabel, grade } = parsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceRoleClient() as any;

  // Fetch student name
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name')
    .eq('id', studentId)
    .single();

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const studentName = `${student.first_name} ${student.last_name}`;

  // Fetch all linked guardians (who can view results)
  const { data: links } = await supabase
    .from('student_guardians')
    .select('guardian_id, profiles!guardian_id(full_name, email)')
    .eq('student_id', studentId);

  if (!links || links.length === 0) {
    return NextResponse.json({ status: 'no_guardians' });
  }

  const results: { email: string; status: string }[] = [];

  for (const link of links) {
    const profile = (link as any).profiles;
    if (!profile?.email) continue;

    try {
      const html = renderResultsPublishedEmail({
        guardianName: profile.full_name ?? 'Guardian',
        studentName,
        admissionNumber: '',
        grade,
        termLabel,
        portalUrl: PORTAL_URL,
        schoolName: SCHOOL_NAME,
      });

      await sendEmail({
        to: profile.email,
        subject: `${studentName}'s ${termLabel} Report Card is Ready – Dorice Smart Academy`,
        html,
      });

      results.push({ email: profile.email, status: 'sent' });
    } catch (err: any) {
      console.error('[results-published-notify] email error:', err.message);
      results.push({ email: profile.email, status: 'failed' });
    }
  }

  return NextResponse.json({ notified: results });
}
