import { getDatabase } from '../client';
import { PlannedSubject } from '@/types/database';

export interface PlannedSubjectDetail extends PlannedSubject {
  subjectCode: string;
  subjectName: string;
  units: number;
}

export async function getPlannedSubjects(): Promise<PlannedSubjectDetail[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    subject_id: number;
    planned_school_year: string;
    planned_term: number;
    subject_code: string;
    subject_name: string;
    units: number;
  }>(
    `SELECT ps.id, ps.subject_id, ps.planned_school_year, ps.planned_term,
            s.subject_code, s.subject_name, s.units
     FROM planned_subjects ps
     INNER JOIN subjects s ON s.id = ps.subject_id
     ORDER BY ps.planned_school_year, ps.planned_term, s.subject_code;`
  );

  return rows.map((plannedRow) => ({
    id: plannedRow.id,
    subjectId: plannedRow.subject_id,
    plannedSchoolYear: plannedRow.planned_school_year,
    plannedTerm: plannedRow.planned_term,
    subjectCode: plannedRow.subject_code,
    subjectName: plannedRow.subject_name,
    units: plannedRow.units,
  }));
}

export async function addPlannedSubject(plannedSubjectParams: {
  subjectId: number;
  plannedSchoolYear: string;
  plannedTerm: number;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO planned_subjects (subject_id, planned_school_year, planned_term)
     VALUES (?, ?, ?)
     ON CONFLICT(subject_id, planned_school_year, planned_term) DO NOTHING;`,
    [
      plannedSubjectParams.subjectId,
      plannedSubjectParams.plannedSchoolYear,
      plannedSubjectParams.plannedTerm,
    ]
  );
}

export async function removePlannedSubject(plannedSubjectId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM planned_subjects WHERE id = ?;', [plannedSubjectId]);
}

export async function removePlannedSubjectBySubjectAndTerm(plannedSubjectParams: {
  subjectId: number;
  plannedSchoolYear: string;
  plannedTerm: number;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM planned_subjects WHERE subject_id = ? AND planned_school_year = ? AND planned_term = ?;',
    [
      plannedSubjectParams.subjectId,
      plannedSubjectParams.plannedSchoolYear,
      plannedSubjectParams.plannedTerm,
    ]
  );
}

export async function clearPlannedSubjectsForTerm(plannedTermParams: {
  plannedSchoolYear: string;
  plannedTerm: number;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM planned_subjects WHERE planned_school_year = ? AND planned_term = ?;',
    [plannedTermParams.plannedSchoolYear, plannedTermParams.plannedTerm]
  );
}

export async function clearAllPlannedSubjects(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM planned_subjects;');
}


