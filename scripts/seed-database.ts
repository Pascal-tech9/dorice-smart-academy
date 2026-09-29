import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        if (!process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
} catch (e) {
  // Ignore error
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('🌱 Populating complete live Supabase database for Dorice Smart Academy...');

  // 1. Settings
  console.log('1. Settings...');
  await supabase.from('settings').upsert([
    { key: 'school_name', value: { name: 'Dorice Smart Academy' } },
    { key: 'school_paybill', value: { paybill: '400222', account_format: '369369#StudentName,Grade' } },
    { key: 'school_contact', value: { phone: '+254 700 123 456', email: 'admin@doricesmartacademy.sc.ke', location: 'Kipkaren River, Kenya' } },
  ], { onConflict: 'key' });

  // 2. Academic Year & Terms
  console.log('2. Academic Year & Terms...');
  let { data: academicYear } = await supabase.from('academic_years').select('*').eq('name', '2026').maybeSingle();
  if (!academicYear) {
    const { data: newYear } = await supabase.from('academic_years').insert({
      name: '2026',
      start_date: '2026-01-05',
      end_date: '2026-11-20',
      is_current: true,
    }).select().single();
    academicYear = newYear;
  }

  if (academicYear) {
    const terms = [
      { academic_year_id: academicYear.id, name: 'Term 1', start_date: '2026-01-05', end_date: '2026-04-03', is_current: true },
      { academic_year_id: academicYear.id, name: 'Term 2', start_date: '2026-05-04', end_date: '2026-08-07', is_current: false },
      { academic_year_id: academicYear.id, name: 'Term 3', start_date: '2026-09-01', end_date: '2026-11-20', is_current: false },
    ];
    for (const t of terms) {
      await supabase.from('terms').upsert(t, { onConflict: 'academic_year_id,name' });
    }
  }

  const { data: activeTerm } = await supabase.from('terms').select('*').eq('name', 'Term 1').maybeSingle();

  // 3. Grade Levels
  console.log('3. Grade Levels...');
  const gradeLevels = [
    { name: 'Playgroup', category: 'Pre-Primary', order_index: 1, is_active: true },
    { name: 'PP1', category: 'Pre-Primary', order_index: 2, is_active: true },
    { name: 'PP2', category: 'Pre-Primary', order_index: 3, is_active: true },
    { name: 'Grade 1', category: 'Lower Primary', order_index: 4, is_active: true },
    { name: 'Grade 2', category: 'Lower Primary', order_index: 5, is_active: true },
    { name: 'Grade 3', category: 'Lower Primary', order_index: 6, is_active: true },
    { name: 'Grade 4', category: 'Upper Primary', order_index: 7, is_active: true },
    { name: 'Grade 5', category: 'Upper Primary', order_index: 8, is_active: true },
    { name: 'Grade 6', category: 'Upper Primary', order_index: 9, is_active: true },
    { name: 'Grade 7', category: 'Junior School', order_index: 10, is_active: true },
    { name: 'Grade 8', category: 'Junior School', order_index: 11, is_active: true },
  ];

  for (const g of gradeLevels) {
    await supabase.from('grade_levels').upsert(g, { onConflict: 'name' });
  }

  const { data: allGrades } = await supabase.from('grade_levels').select('*');
  const gradeMap = new Map((allGrades || []).map((g) => [g.name, g.id]));

  // 4. Demo Auth Accounts & Profiles
  console.log('4. Auth Users & Profiles...');
  const demoUsers = [
    { email: 'admin@doricesmartacademy.sc.ke', password: 'DemoPass2026!', full_name: 'Head Teacher / Administrator', role: 'admin', phone: '+254700000001' },
    { email: 'bursar@doricesmartacademy.sc.ke', password: 'DemoPass2026!', full_name: 'Accounts Office Bursar', role: 'bursar', phone: '+254700000002' },
    { email: 'teacher.kiptoo@doricesmartacademy.sc.ke', password: 'DemoPass2026!', full_name: 'Mr. John Kiptoo', role: 'teacher', phone: '+254700000003' },
    { email: 'parent.wanjiku@example.com', password: 'DemoPass2026!', full_name: 'Mary Wanjiku', role: 'guardian', phone: '+254712345678' },
    { email: 'david.kariuki@example.com', password: 'DemoPass2026!', full_name: 'David Kariuki', role: 'guardian', phone: '+254722334455' },
  ];

  const profileMap = new Map<string, string>();

  for (const u of demoUsers) {
    try {
      const { data: listData } = await supabase.auth.admin.listUsers();
      let user = listData?.users?.find((x) => x.email === u.email);

      if (!user) {
        const { data: created, error: cErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, role: u.role },
        });
        if (created?.user) user = created.user;
      }

      if (user) {
        profileMap.set(u.email, user.id);

        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: u.full_name,
          phone_number: u.phone,
        }, { onConflict: 'id' });

        await supabase.from('user_roles').upsert({
          user_id: user.id,
          role: u.role as any,
        }, { onConflict: 'user_id,role' });
      }
    } catch (err: any) {
      console.log(`User setup note for ${u.email}:`, err.message);
    }
  }

  // 5. Classes (linked with Teacher)
  console.log('5. Classes...');
  const teacherId = profileMap.get('teacher.kiptoo@doricesmartacademy.sc.ke');

  for (const [name, gradeId] of gradeMap.entries()) {
    await supabase.from('classes').upsert({
      name: `${name} Main`,
      grade_level_id: gradeId,
      stream: 'Main',
      class_teacher_id: (name === 'Grade 4' || name === 'Grade 7') ? (teacherId || null) : null,
    }, { onConflict: 'grade_level_id,stream' });
  }

  const { data: allClasses } = await supabase.from('classes').select('*');
  const classMap = new Map((allClasses || []).map((c) => [c.name, c.id]));

  // 6. Guardians linked to Profile
  console.log('6. Guardians...');
  const guardianProfileId = profileMap.get('parent.wanjiku@example.com');
  const guardianKariukiProfileId = profileMap.get('david.kariuki@example.com');

  const guardianMap = new Map<string, string>();

  if (guardianProfileId) {
    const { data: g1 } = await supabase.from('guardians').upsert({
      profile_id: guardianProfileId,
      primary_phone: '+254712345678',
      relationship_description: 'Mother of Brian Kiprono & Faith Wambui',
    }, { onConflict: 'profile_id' }).select().single();
    if (g1) guardianMap.set('+254712345678', g1.id);
  }

  if (guardianKariukiProfileId) {
    const { data: g2 } = await supabase.from('guardians').upsert({
      profile_id: guardianKariukiProfileId,
      primary_phone: '+254722334455',
      relationship_description: 'Father of Kevin Otieno',
    }, { onConflict: 'profile_id' }).select().single();
    if (g2) guardianMap.set('+254722334455', g2.id);
  }

  // 7. Students & Enrollments
  console.log('7. Students & Enrollments...');
  const sampleStudents = [
    { admission_number: 'DSA/2026/001', first_name: 'Brian', last_name: 'Kiprono', gender: 'Male', date_of_birth: '2016-03-12', nemis_upi: 'UPI-9821-DSA', grade: 'Grade 4', guardian_phone: '+254712345678' },
    { admission_number: 'DSA/2026/002', first_name: 'Faith', last_name: 'Wambui', gender: 'Female', date_of_birth: '2018-06-20', nemis_upi: 'UPI-7731-DSA', grade: 'Grade 2', guardian_phone: '+254712345678' },
    { admission_number: 'DSA/2026/003', first_name: 'Kevin', last_name: 'Otieno', gender: 'Male', date_of_birth: '2015-01-14', nemis_upi: 'UPI-6621-DSA', grade: 'Grade 5', guardian_phone: '+254722334455' },
    { admission_number: 'DSA/2026/004', first_name: 'Mercy', last_name: 'Cherotich', gender: 'Female', date_of_birth: '2013-09-08', nemis_upi: 'UPI-5511-DSA', grade: 'Grade 7', guardian_phone: '+254712345678' },
    { admission_number: 'DSA/2026/005', first_name: 'Samuel', last_name: 'Kamau', gender: 'Male', date_of_birth: '2017-11-25', nemis_upi: 'UPI-4401-DSA', grade: 'Grade 3', guardian_phone: '+254722334455' },
  ];

  for (const s of sampleStudents) {
    const classId = classMap.get(`${s.grade} Main`);
    const { data: stud } = await supabase.from('students').upsert({
      admission_number: s.admission_number,
      first_name: s.first_name,
      last_name: s.last_name,
      gender: s.gender,
      date_of_birth: s.date_of_birth,
      nemis_upi: s.nemis_upi,
      status: 'active',
    }, { onConflict: 'admission_number' }).select().single();

    if (stud) {
      if (classId && academicYear) {
        await supabase.from('enrollments').upsert({
          student_id: stud.id,
          class_id: classId,
          academic_year_id: academicYear.id,
          status: 'active',
        }, { onConflict: 'student_id,academic_year_id' });
      }

      const gId = guardianMap.get(s.guardian_phone);
      if (gId) {
        await supabase.from('student_guardians').upsert({
          student_id: stud.id,
          guardian_id: gId,
          relationship: s.gender === 'Female' ? 'mother' : 'guardian',
          is_primary: true,
          can_pay: true,
        }, { onConflict: 'student_id,guardian_id' });
      }

      // Generate invoice for Term 1
      if (activeTerm) {
        const invAmount = 18500;
        const paidAmount = s.admission_number === 'DSA/2026/001' ? 18500 : (s.admission_number === 'DSA/2026/002' ? 10000 : 0);
        const balanceDue = invAmount - paidAmount;
        const status = balanceDue === 0 ? 'paid' : (paidAmount > 0 ? 'partially_paid' : 'issued');

        const { data: inv, error: invErr } = await supabase.from('invoices').upsert({
          student_id: stud.id,
          academic_year_id: academicYear!.id,
          term_id: activeTerm.id,
          invoice_number: `INV-2026-${s.admission_number.replace(/[^0-9]/g, '').padStart(3, '0')}`,
          total_amount: invAmount,
          balance_due: balanceDue,
          status: status,
          due_date: '2026-02-15',
        }, { onConflict: 'student_id,academic_year_id,term_id' }).select().single();

        if (invErr) console.error('Invoice upsert error:', invErr);

        if (inv && paidAmount > 0) {
          const mpesaReceipt = `SDT${s.admission_number.replace(/[^0-9]/g, '')}928KL1`;
          await supabase.from('mpesa_transactions').upsert({
            mpesa_receipt_number: mpesaReceipt,
            transaction_type: 'c2b_paybill',
            phone_number: '254712345678',
            amount: paidAmount,
            account_reference: `369369#${s.first_name} ${s.last_name},${s.grade}`,
            student_id: stud.id,
            status: 'completed',
          }, { onConflict: 'mpesa_receipt_number' });

          const { data: pmt } = await supabase.from('payments').insert({
            student_id: stud.id,
            amount: paidAmount,
            payment_method: 'mpesa',
            reference_number: mpesaReceipt,
            paid_by: 'Mary Wanjiku',
          }).select().single();

          if (pmt) {
            await supabase.from('receipts').insert({
              payment_id: pmt.id,
              receipt_number: `RCT-2026-${s.admission_number.replace(/[^0-9]/g, '').padStart(4, '0')}`,
              amount: paidAmount,
              issued_to: 'Mary Wanjiku',
            });
          }
        }
      }
    }
  }

  console.log('✅ COMPLETE: Operational database is seeded and live!');
}

seed().catch(console.error);
