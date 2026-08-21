import { getDatabase } from '../client';
import { CompletedSubject, SubjectStatusView } from '@/types/database';

export interface CompletedSubjectDetail extends CompletedSubject {
  subjectCode: string;
  subjectName: string;
  units: number;
}

export async function getCompletedSubjects(): Promise<CompletedSubjectDetail[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    subject_id: number;
    grade: number;
    status: 'passed' | 'failed';
    attempt_number: number;
    school_year: string | null;
    term_taken: number | null;
    created_at: string;
    subject_code: string;
    subject_name: string;
    units: number;
  }>(
    `SELECT cs.id, cs.subject_id, cs.grade, cs.status, cs.attempt_number,
            cs.school_year, cs.term_taken, cs.created_at,
            s.subject_code, s.subject_name, s.units
     FROM completed_subjects cs
     INNER JOIN subjects s ON s.id = cs.subject_id
     ORDER BY cs.created_at DESC;`
  );

  return rows.map((r) => ({
    id: r.id,
    subjectId: r.subject_id,
    grade: r.grade,
    status: r.status,
    attemptNumber: r.attempt_number,
    schoolYear: r.school_year,
    termTaken: r.term_taken,
    createdAt: r.created_at,
    subjectCode: r.subject_code,
    subjectName: r.subject_name,
    units: r.units,
  }));
}

export async function getSubjectStatuses(): Promise<SubjectStatusView[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    subject_id: number;
    grade: number;
    status: 'passed' | 'failed';
    attempt_number: number;
  }>('SELECT subject_id, grade, status, attempt_number FROM subject_status;');

  return rows.map((r) => ({
    subjectId: r.subject_id,
    grade: r.grade,
    status: r.status,
    attemptNumber: r.attempt_number,
  }));
}

export async function recordSubjectAttempt(params: {
  subjectId: number;
  grade: number;
  schoolYear?: string | null;
  termTaken?: number | null;
}): Promise<void> {
  const db = await getDatabase();

  // Find latest attempt number for this subject
  const latest = await db.getFirstAsync<{ max_attempt: number | null }>(
    'SELECT MAX(attempt_number) AS max_attempt FROM completed_subjects WHERE subject_id = ?;',
    [params.subjectId]
  );
  const nextAttemptNumber = (latest?.max_attempt ?? 0) + 1;

  await db.runAsync(
    `INSERT INTO completed_subjects (subject_id, grade, attempt_number, school_year, term_taken, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'));`,
    [
      params.subjectId,
      params.grade,
      nextAttemptNumber,
      params.schoolYear ?? null,
      params.termTaken ?? null,
    ]
  );
}

export async function deleteCompletedSubject(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM completed_subjects WHERE id = ?;', [id]);
}

export async function clearAllCompletedSubjects(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM completed_subjects;');
}

