import { z } from 'zod';

export const StudentCsvRowSchema = z.object({
  admission_number: z.string().min(3, 'Admission number is required'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  gender: z.enum(['Male', 'Female']),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  grade_level: z.string().min(2, 'Grade level is required'),
  guardian_name: z.string().min(2, 'Guardian name is required'),
  guardian_phone: z.string().min(9, 'Valid Kenya phone number required'),
  guardian_relationship: z.enum(['Father', 'Mother', 'Guardian', 'Sponsor']),
  nemis_upi: z.string().optional(),
});

export type StudentCsvRow = z.infer<typeof StudentCsvRowSchema>;

export interface ParseResult {
  valid: StudentCsvRow[];
  errors: { row: number; field: string; message: string }[];
  totalRows: number;
}

export function parseStudentCsv(csvText: string): ParseResult {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { valid: [], errors: [{ row: 0, field: 'csv', message: 'CSV file contains no data rows' }], totalRows: 0 };
  }

  const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const valid: StudentCsvRow[] = [];
  const errors: { row: number; field: string; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    if (rawValues.length < rawHeaders.length) {
      errors.push({ row: i + 1, field: 'line', message: 'Row has missing columns' });
      continue;
    }

    const rowObj: Record<string, string> = {};
    rawHeaders.forEach((header, index) => {
      rowObj[header] = rawValues[index] || '';
    });

    const parsed = StudentCsvRowSchema.safeParse(rowObj);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      parsed.error.issues.forEach((issue) => {
        errors.push({
          row: i + 1,
          field: String(issue.path[0] || 'general'),
          message: issue.message,
        });
      });
    }
  }

  return {
    valid,
    errors,
    totalRows: lines.length - 1,
  };
}
