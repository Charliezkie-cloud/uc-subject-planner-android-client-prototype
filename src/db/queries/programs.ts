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

  return rows.map((r) => ({
    id: r.id,
    programCode: r.program_code,
    programName: r.program_name,
    curriculumVersion: r.curriculum_version,
    sourceFile: r.source_file,
    importedAt: r.imported_at,
  }));
}

export async function getProgramById(id: number): Promise<Program | null> {
  const db = await getDatabase();
  const r = await db.getFirstAsync<{
    id: number;
    program_code: string;
    program_name: string;
    curriculum_version: string;
    source_file: string | null;
    imported_at: string;
  }>('SELECT * FROM programs WHERE id = ?;', [id]);

  if (!r) return null;
  return {
    id: r.id,
    programCode: r.program_code,
    programName: r.program_name,
    curriculumVersion: r.curriculum_version,
    sourceFile: r.source_file,
    importedAt: r.imported_at,
  };
}

export async function getStudentProfile(): Promise<StudentProfile | null> {
  const db = await getDatabase();
  const r = await db.getFirstAsync<{
    id: number;
    program_id: number | null;
    current_year_level: number | null;
    updated_at: string;
  }>('SELECT * FROM student_profile WHERE id = 1;');

  if (!r) return null;
  return {
    id: r.id,
    programId: r.program_id,
    currentYearLevel: r.current_year_level,
    updatedAt: r.updated_at,
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
