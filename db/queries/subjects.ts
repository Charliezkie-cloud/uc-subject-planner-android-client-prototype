import { getDatabase } from '../client';
import { Prerequisite, Corequisite, YearRangePrerequisite } from '@/types/database';

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

  return rows.map((subjectRow) => ({
    subjectId: subjectRow.subject_id,
    subjectCode: subjectRow.subject_code,
    subjectName: subjectRow.subject_name,
    units: subjectRow.units,
    yearLevel: subjectRow.year_level,
    term: subjectRow.term,
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

  return rows.map((prerequisiteRow) => ({
    id: prerequisiteRow.id,
    programId: prerequisiteRow.program_id,
    subjectId: prerequisiteRow.subject_id,
    prerequisiteSubjectId: prerequisiteRow.prerequisite_subject_id,
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

  return rows.map((corequisiteRow) => ({
    id: corequisiteRow.id,
    programId: corequisiteRow.program_id,
    subjectId: corequisiteRow.subject_id,
    corequisiteSubjectId: corequisiteRow.corequisite_subject_id,
  }));
}

export async function getYearRangePrerequisitesForProgram(
  programId: number
): Promise<YearRangePrerequisite[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    program_id: number;
    subject_id: number;
    through_year_level: number;
  }>(
    `SELECT id, program_id, subject_id, through_year_level
     FROM year_range_prerequisites
     WHERE program_id = ?;`,
    [programId]
  );

  return rows.map((row) => ({
    id: row.id,
    programId: row.program_id,
    subjectId: row.subject_id,
    throughYearLevel: row.through_year_level,
  }));
}
