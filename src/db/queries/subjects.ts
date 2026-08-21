import { getDatabase } from '../client';
import { Prerequisite, Corequisite } from '@/types/database';

export interface ProgramSubjectDetail {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  units: number;
  yearLevel: number;
  term: number;
}

export async function getProgramSubjects(programId: number): Promise<ProgramSubjectDetail[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    subject_id: number;
    subject_code: string;
    subject_name: string;
    units: number;
    year_level: number;
    term: number;
  }>(
    `SELECT ps.subject_id, s.subject_code, s.subject_name, s.units, ps.year_level, ps.term
     FROM program_subjects ps
     INNER JOIN subjects s ON s.id = ps.subject_id
     WHERE ps.program_id = ?
     ORDER BY ps.year_level, ps.term, s.subject_code;`,
    [programId]
  );

  return rows.map((r) => ({
    subjectId: r.subject_id,
    subjectCode: r.subject_code,
    subjectName: r.subject_name,
    units: r.units,
    yearLevel: r.year_level,
    term: r.term,
  }));
}

export async function getPrerequisitesForProgram(programId: number): Promise<Prerequisite[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    program_id: number;
    subject_id: number;
    prerequisite_subject_id: number;
  }>(
    `SELECT id, program_id, subject_id, prerequisite_subject_id
     FROM prerequisites
     WHERE program_id = ?;`,
    [programId]
  );

  return rows.map((r) => ({
    id: r.id,
    programId: r.program_id,
    subjectId: r.subject_id,
    prerequisiteSubjectId: r.prerequisite_subject_id,
  }));
}

export async function getCorequisitesForProgram(programId: number): Promise<Corequisite[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    program_id: number;
    subject_id: number;
    corequisite_subject_id: number;
  }>(
    `SELECT id, program_id, subject_id, corequisite_subject_id
     FROM corequisites
     WHERE program_id = ?;`,
    [programId]
  );

  return rows.map((r) => ({
    id: r.id,
    programId: r.program_id,
    subjectId: r.subject_id,
    corequisiteSubjectId: r.corequisite_subject_id,
  }));
}
