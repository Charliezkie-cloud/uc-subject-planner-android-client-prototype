import { BUNDLED_CURRICULA } from '@/data/bundledCurricula';
import { importCurriculumPackage, ImportCurriculumResult } from './curriculumImport';
import { getAllPrograms } from './programs';
import { getDatabase } from '../client';

function getCurriculumKey(programCode: string, curriculumVersion: string): string {
  return `${programCode}::${curriculumVersion}`;
}

export interface SeedCurriculaResult {
  imported: ImportCurriculumResult[];
  skippedSourceFiles: string[];
}

/**
 * Ensures every bundled curriculum package exists in SQLite.
 * Idempotent: already-imported program_code + curriculum_version pairs are skipped
 * unless `forceReimport` is true (Settings re-import).
 */
export async function seedBundledCurricula(
  forceReimport = false
): Promise<SeedCurriculaResult> {
  const existingPrograms = await getAllPrograms();
  const existingKeys = new Set(
    existingPrograms.map(
      (program) => getCurriculumKey(program.programCode, program.curriculumVersion)
    )
  );

  const imported: ImportCurriculumResult[] = [];
  const skippedSourceFiles: string[] = [];

  for (const bundled of BUNDLED_CURRICULA) {
    const packageKey = getCurriculumKey(
      bundled.data.program_code,
      bundled.data.curriculum_version
    );
    if (!forceReimport && existingKeys.has(packageKey)) {
      skippedSourceFiles.push(bundled.sourceFile);
      continue;
    }

    const result = await importCurriculumPackage(bundled.data, bundled.sourceFile);
    imported.push(result);
    if (result.success) {
      existingKeys.add(packageKey);
    }
  }

  const bundledCurriculumKeys = new Set(
    BUNDLED_CURRICULA.map((bundled) =>
      getCurriculumKey(bundled.data.program_code, bundled.data.curriculum_version)
    )
  );
  const currentPrograms = await getAllPrograms();
  const programsToRemove = currentPrograms.filter(
    (program) => !bundledCurriculumKeys.has(getCurriculumKey(program.programCode, program.curriculumVersion))
  );

  if (programsToRemove.length > 0) {
    const replacementProgram = currentPrograms.find((program) =>
      bundledCurriculumKeys.has(getCurriculumKey(program.programCode, program.curriculumVersion))
    );
    const removedProgramIds = new Set(programsToRemove.map((program) => program.id));
    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      const profile = await db.getFirstAsync<{ program_id: number | null }>(
        'SELECT program_id FROM student_profile WHERE id = 1;'
      );

      if (profile && profile.program_id !== null && removedProgramIds.has(profile.program_id)) {
        await db.runAsync(
          'UPDATE student_profile SET program_id = ?, updated_at = datetime(\'now\') WHERE id = 1;',
          [replacementProgram?.id ?? null]
        );
      }

      for (const program of programsToRemove) {
        await db.runAsync('DELETE FROM programs WHERE id = ?;', [program.id]);
      }
    });
  }

  return { imported, skippedSourceFiles };
}
