import { BUNDLED_CURRICULA } from '@/data/bundledCurricula';
import { importCurriculumPackage, ImportCurriculumResult } from './curriculumImport';
import { getAllPrograms } from './programs';

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
      (program) => `${program.programCode}::${program.curriculumVersion}`
    )
  );

  const imported: ImportCurriculumResult[] = [];
  const skippedSourceFiles: string[] = [];

  for (const bundled of BUNDLED_CURRICULA) {
    const packageKey = `${bundled.data.program_code}::${bundled.data.curriculum_version}`;
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

  return { imported, skippedSourceFiles };
}
