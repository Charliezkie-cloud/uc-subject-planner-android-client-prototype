

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

  return rows.map((r) => ({
    id: r.id,
    subjectId: r.subject_id,
    plannedSchoolYear: r.planned_school_year,
    plannedTerm: r.planned_term,
    subjectCode: r.subject_code,
    subjectName: r.subject_name,
    units: r.units,
  }));
}

export async function addPlannedSubject(params: {
  subjectId: number;
  plannedSchoolYear: string;
  plannedTerm: number;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO planned_subjects (subject_id, planned_school_year, planned_term)
     VALUES (?, ?, ?)
     ON CONFLICT(subject_id, planned_school_year, planned_term) DO NOTHING;`,
    [params.subjectId, params.plannedSchoolYear, params.plannedTerm]
  );
}

export async function removePlannedSubject(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM planned_subjects WHERE id = ?;', [id]);
}
