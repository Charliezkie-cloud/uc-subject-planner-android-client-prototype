import { getDatabase } from '../client';
import { CurriculumPackageDto } from '@/features/curriculum-import/types';
import { validateCurriculumJson } from '@/features/curriculum-import/importCurriculum';

export interface ImportCurriculumResult {
  success: boolean;
  programId?: number;
  message?: string;
  errors?: string[];
}

/**
 * Idempotently imports a validated curriculum package into the database inside a transaction.
 */
export async function importCurriculumPackage(
  rawCurriculumData: unknown,
  sourceFileName?: string
): Promise<ImportCurriculumResult> {
  const validation = validateCurriculumJson(rawCurriculumData);
  if (!validation.isValid || !validation.validatedPackage) {
    return {
      success: false,
      errors: validation.errors.map((error) => `${error.field}: ${error.message}`),
    };
  }

  const curriculumPackage: CurriculumPackageDto = validation.validatedPackage;
  const db = await getDatabase();

  try {
    let importedProgramId = 0;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO programs (program_code, program_name, curriculum_version, source_file, imported_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(program_code, curriculum_version) DO UPDATE SET
           program_name = excluded.program_name,
           source_file = excluded.source_file,
           imported_at = datetime('now');`,
        [
          curriculumPackage.program_code,
          curriculumPackage.program_name,
          curriculumPackage.curriculum_version,
          sourceFileName ?? null,
        ]
      );

      const programRow = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM programs WHERE program_code = ? AND curriculum_version = ?;',
        [curriculumPackage.program_code, curriculumPackage.curriculum_version]
      );

      if (!programRow) {
        throw new Error('Failed to retrieve program ID after upsert.');
      }
      importedProgramId = programRow.id;

      const subjectCodeToIdMap = new Map<string, number>();

      for (const subject of curriculumPackage.subjects) {
        await db.runAsync(
          `INSERT INTO subjects (subject_code, subject_name, units)
           VALUES (?, ?, ?)
           ON CONFLICT(subject_code) DO UPDATE SET
             subject_name = excluded.subject_name,
             units = excluded.units;`,
          [subject.code, subject.name, subject.units]
        );

        const subjectRow = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM subjects WHERE subject_code = ?;',
          [subject.code]
        );

        if (!subjectRow) {
          throw new Error(`Failed to resolve subject ID for ${subject.code}`);
        }

        subjectCodeToIdMap.set(subject.code.toUpperCase(), subjectRow.id);

        await db.runAsync(
          `INSERT INTO program_subjects (program_id, subject_id, year_level, term)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(program_id, subject_id) DO UPDATE SET
             year_level = excluded.year_level,
             term = excluded.term;`,
          [importedProgramId, subjectRow.id, subject.year_level, subject.term]
        );
      }

      await db.runAsync('DELETE FROM prerequisites WHERE program_id = ?;', [importedProgramId]);
      await db.runAsync('DELETE FROM corequisites WHERE program_id = ?;', [importedProgramId]);

      if (curriculumPackage.prerequisites) {
        for (const prerequisite of curriculumPackage.prerequisites) {
          const subjectId = subjectCodeToIdMap.get(prerequisite.subject.toUpperCase());
          const prerequisiteSubjectId = subjectCodeToIdMap.get(prerequisite.requires.toUpperCase());

          if (subjectId && prerequisiteSubjectId) {
            await db.runAsync(
              `INSERT INTO prerequisites (program_id, subject_id, prerequisite_subject_id)
               VALUES (?, ?, ?)
               ON CONFLICT(program_id, subject_id, prerequisite_subject_id) DO NOTHING;`,
              [importedProgramId, subjectId, prerequisiteSubjectId]
            );
          }
        }
      }

      if (curriculumPackage.corequisites) {
        for (const corequisite of curriculumPackage.corequisites) {
          const subjectId = subjectCodeToIdMap.get(corequisite.subject.toUpperCase());
          const corequisiteSubjectId = subjectCodeToIdMap.get(corequisite.with.toUpperCase());

          if (subjectId && corequisiteSubjectId) {
            await db.runAsync(
              `INSERT INTO corequisites (program_id, subject_id, corequisite_subject_id)
               VALUES (?, ?, ?)
               ON CONFLICT(program_id, subject_id, corequisite_subject_id) DO NOTHING;`,
              [importedProgramId, subjectId, corequisiteSubjectId]
            );
          }
        }
      }

      const currentProfile = await db.getFirstAsync<{ program_id: number | null }>(
        'SELECT program_id FROM student_profile WHERE id = 1;'
      );

      if (!currentProfile || currentProfile.program_id === null) {
        await db.runAsync(
          `INSERT INTO student_profile (id, program_id, current_year_level, updated_at)
           VALUES (1, ?, 1, datetime('now'))
           ON CONFLICT(id) DO UPDATE SET program_id = excluded.program_id WHERE program_id IS NULL;`,
          [importedProgramId]
        );
      }
    });

    return {
      success: true,
      programId: importedProgramId,
      message: `Successfully imported ${curriculumPackage.program_code} (${curriculumPackage.curriculum_version}).`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    return {
      success: false,
      errors: [message],
    };
  }
}
