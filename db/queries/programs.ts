import { getDatabase } from '../client';
import { Program, StudentProfile } from '@/types/database';

export async function getAllPrograms(): Promise<Program[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    program_code: string;
    program_name: string;
    curriculum_version: string;
    source_file: string | null;
    imported_at: string;
  }>('SELECT * FROM programs ORDER BY program_code, curriculum_version DESC;');

  return rows.map((programRow) => ({
    id: programRow.id,
    programCode: programRow.program_code,
    programName: programRow.program_name,
    curriculumVersion: programRow.curriculum_version,
    sourceFile: programRow.source_file,
    importedAt: programRow.imported_at,
  }));
}

export async function getProgramById(id: number): Promise<Program | null> {
  const db = await getDatabase();
  const programRow = await db.getFirstAsync<{
    id: number;
    program_code: string;
    program_name: string;
    curriculum_version: string;
    source_file: string | null;
    imported_at: string;
  }>('SELECT * FROM programs WHERE id = ?;', [id]);

  if (!programRow) return null;
  return {
    id: programRow.id,
    programCode: programRow.program_code,
    programName: programRow.program_name,
    curriculumVersion: programRow.curriculum_version,
    sourceFile: programRow.source_file,
    importedAt: programRow.imported_at,
  };
}

export async function getStudentProfile(): Promise<StudentProfile | null> {
  const db = await getDatabase();
  const profileRow = await db.getFirstAsync<{
    id: number;
    program_id: number | null;
    current_year_level: number | null;
    updated_at: string;
  }>('SELECT * FROM student_profile WHERE id = 1;');

  if (!profileRow) return null;
  return {
    id: profileRow.id,
    programId: profileRow.program_id,
    currentYearLevel: profileRow.current_year_level,
    updatedAt: profileRow.updated_at,
  };
}

export async function updateStudentProfile(
  programId: number | null,
  currentYearLevel: number | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO student_profile (id, program_id, current_year_level, updated_at)
     VALUES (1, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       program_id = excluded.program_id,
       current_year_level = excluded.current_year_level,
       updated_at = datetime('now');`,
    [programId, currentYearLevel]
  );
}
