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
  data: unknown,
  sourceFileName?: string
): Promise<ImportCurriculumResult> {
  const validation = validateCurriculumJson(data);
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      errors: validation.errors.map((e) => `${e.field}: ${e.message}`),
    };
  }

  const pkg: CurriculumPackageDto = validation.data;
  const db = await getDatabase();

  try {
    let importedProgramId = 0;

    await db.withTransactionAsync(async () => {
      // 1. Upsert into programs
      await db.runAsync(
        `INSERT INTO programs (program_code, program_name, curriculum_version, source_file, imported_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(program_code, curriculum_version) DO UPDATE SET
           program_name = excluded.program_name,
           source_file = excluded.source_file,
           imported_at = datetime('now');`,
        [pkg.program_code, pkg.program_name, pkg.curriculum_version, sourceFileName ?? null]
      );

      const progRow = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM programs WHERE program_code = ? AND curriculum_version = ?;',
        [pkg.program_code, pkg.curriculum_version]
      );

      if (!progRow) {
        throw new Error('Failed to retrieve program ID after upsert.');
      }
      importedProgramId = progRow.id;

      // 2. Insert/upsert subjects and map to program_subjects
      const subjectCodeToIdMap = new Map<string, number>();

      for (const subj of pkg.subjects) {
        await db.runAsync(
          `INSERT INTO subjects (subject_code, subject_name, units)
           VALUES (?, ?, ?)
           ON CONFLICT(subject_code) DO UPDATE SET
             subject_name = excluded.subject_name,
             units = excluded.units;`,
          [subj.code, subj.name, subj.units]
        );

        const sRow = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM subjects WHERE subject_code = ?;',
          [subj.code]
        );

        if (!sRow) {
          throw new Error(`Failed to resolve subject ID for ${subj.code}`);
        }

        subjectCodeToIdMap.set(subj.code.toUpperCase(), sRow.id);

        await db.runAsync(
          `INSERT INTO program_subjects (program_id, subject_id, year_level, term)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(program_id, subject_id) DO UPDATE SET
             year_level = excluded.year_level,
             term = excluded.term;`,
          [importedProgramId, sRow.id, subj.year_level, subj.term]
        );
      }

      // 3. Clear existing program prerequisites & corequisites to ensure idempotent fresh state
      await db.runAsync('DELETE FROM prerequisites WHERE program_id = ?;', [importedProgramId]);
      await db.runAsync('DELETE FROM corequisites WHERE program_id = ?;', [importedProgramId]);

      // 4. Insert prerequisites
      if (pkg.prerequisites) {
        for (const prereq of pkg.prerequisites) {
          const subjectId = subjectCodeToIdMap.get(prereq.subject.toUpperCase());
          const prereqSubjectId = subjectCodeToIdMap.get(prereq.requires.toUpperCase());

          if (subjectId && prereqSubjectId) {
            await db.runAsync(
              `INSERT INTO prerequisites (program_id, subject_id, prerequisite_subject_id)
               VALUES (?, ?, ?)
               ON CONFLICT(program_id, subject_id, prerequisite_subject_id) DO NOTHING;`,
              [importedProgramId, subjectId, prereqSubjectId]
            );
          }
        }
      }

      // 5. Insert corequisites
      if (pkg.corequisites) {
        for (const coreq of pkg.corequisites) {
          const subjectId = subjectCodeToIdMap.get(coreq.subject.toUpperCase());
          const coreqSubjectId = subjectCodeToIdMap.get(coreq.with.toUpperCase());

          if (subjectId && coreqSubjectId) {
            await db.runAsync(
              `INSERT INTO corequisites (program_id, subject_id, corequisite_subject_id)
               VALUES (?, ?, ?)
               ON CONFLICT(program_id, subject_id, corequisite_subject_id) DO NOTHING;`,
              [importedProgramId, subjectId, coreqSubjectId]
            );
          }
        }
      }

      // 6. Set active student profile program_id if none is set yet
      const profile = await db.getFirstAsync<{ program_id: number | null }>(
        'SELECT program_id FROM student_profile WHERE id = 1;'
      );

      if (!profile || profile.program_id === null) {
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
      message: `Successfully imported ${pkg.program_code} (${pkg.curriculum_version}).`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return {
      success: false,
      errors: [message],
    };
  }
}
