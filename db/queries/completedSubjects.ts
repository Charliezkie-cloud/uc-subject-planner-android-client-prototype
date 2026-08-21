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

  return rows.map((completedSubjectRow) => ({
    id: completedSubjectRow.id,
    subjectId: completedSubjectRow.subject_id,
    grade: completedSubjectRow.grade,
    status: completedSubjectRow.status,
    attemptNumber: completedSubjectRow.attempt_number,
    schoolYear: completedSubjectRow.school_year,
    termTaken: completedSubjectRow.term_taken,
    createdAt: completedSubjectRow.created_at,
    subjectCode: completedSubjectRow.subject_code,
    subjectName: completedSubjectRow.subject_name,
    units: completedSubjectRow.units,
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

  return rows.map((statusRow) => ({
    subjectId: statusRow.subject_id,
    grade: statusRow.grade,
    status: statusRow.status,
    attemptNumber: statusRow.attempt_number,
  }));
}

export async function recordSubjectAttempt(subjectAttemptParams: {
  subjectId: number;
  grade: number;
  schoolYear?: string | null;
  termTaken?: number | null;
}): Promise<void> {
  const db = await getDatabase();

  const latestAttemptRow = await db.getFirstAsync<{ max_attempt: number | null }>(
    'SELECT MAX(attempt_number) AS max_attempt FROM completed_subjects WHERE subject_id = ?;',
    [subjectAttemptParams.subjectId]
  );
  const nextAttemptNumber = (latestAttemptRow?.max_attempt ?? 0) + 1;

  await db.runAsync(
    `INSERT INTO completed_subjects (subject_id, grade, attempt_number, school_year, term_taken, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'));`,
    [
      subjectAttemptParams.subjectId,
      subjectAttemptParams.grade,
      nextAttemptNumber,
      subjectAttemptParams.schoolYear ?? null,
      subjectAttemptParams.termTaken ?? null,
    ]
  );
}

export async function updateCompletedSubjectAttempt(
  completedSubjectId: number,
  updates: {
    grade: number;
    schoolYear?: string | null;
    termTaken?: number | null;
  }
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE completed_subjects
     SET grade = ?, school_year = ?, term_taken = ?
     WHERE id = ?;`,
    [
      updates.grade,
      updates.schoolYear ?? null,
      updates.termTaken ?? null,
      completedSubjectId,
    ]
  );
}

export async function deleteCompletedSubject(completedSubjectId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM completed_subjects WHERE id = ?;', [completedSubjectId]);
}

export async function clearAllCompletedSubjects(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM completed_subjects;');
}

