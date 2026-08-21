import {
  CurriculumPackageDto,
  CurriculumPrerequisiteDto,
  CurriculumYearRangePrerequisiteDto,
} from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validatedPackage?: CurriculumPackageDto;
}

export function expandYearRangePrerequisites(
  subjects: CurriculumPackageDto['subjects'],
  yearRangePrerequisites: CurriculumYearRangePrerequisiteDto[] = []
): CurriculumPrerequisiteDto[] {
  return yearRangePrerequisites.flatMap((yearRangePrerequisite) =>
    subjects
      .filter((subject) => subject.year_level <= yearRangePrerequisite.through_year_level)
      .map((subject) => ({
        subject: yearRangePrerequisite.subject,
        requires: subject.code,
      }))
  );
}

export function validateCurriculumJson(json: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!json || typeof json !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'root', message: 'Curriculum data must be a valid JSON object.' }],
    };
  }

  const rawCurriculum = json as Record<string, unknown>;

  if (typeof rawCurriculum.program_code !== 'string' || !rawCurriculum.program_code.trim()) {
    errors.push({ field: 'program_code', message: 'Missing or invalid program_code.' });
  }

  if (typeof rawCurriculum.program_name !== 'string' || !rawCurriculum.program_name.trim()) {
    errors.push({ field: 'program_name', message: 'Missing or invalid program_name.' });
  }

  if (typeof rawCurriculum.curriculum_version !== 'string' || !rawCurriculum.curriculum_version.trim()) {
    errors.push({ field: 'curriculum_version', message: 'Missing or invalid curriculum_version.' });
  }

  if (!Array.isArray(rawCurriculum.subjects) || rawCurriculum.subjects.length === 0) {
    errors.push({ field: 'subjects', message: 'Curriculum must contain a non-empty subjects array.' });
  } else {
    const subjectEntries = rawCurriculum.subjects;
    const subjectCodes = new Set<string>();
    subjectEntries.forEach((subjectEntry, subjectIndex) => {
      if (!subjectEntry || typeof subjectEntry !== 'object') {
        errors.push({ field: `subjects[${subjectIndex}]`, message: 'Subject entry must be an object.' });
        return;
      }
      const subject = subjectEntry as Record<string, unknown>;
      if (typeof subject.code !== 'string' || !subject.code.trim()) {
        errors.push({ field: `subjects[${subjectIndex}].code`, message: 'Subject must have a non-empty string code.' });
      } else {
        if (subjectCodes.has(subject.code.trim().toUpperCase())) {
          errors.push({ field: `subjects[${subjectIndex}].code`, message: `Duplicate subject code "${subject.code}" in curriculum.` });
        }
        subjectCodes.add(subject.code.trim().toUpperCase());
      }
      if (typeof subject.name !== 'string' || !subject.name.trim()) {
        errors.push({ field: `subjects[${subjectIndex}].name`, message: 'Subject must have a valid name.' });
      }
      if (typeof subject.units !== 'number' || subject.units <= 0) {
        errors.push({ field: `subjects[${subjectIndex}].units`, message: 'Subject units must be a positive number.' });
      }
      if (typeof subject.year_level !== 'number' || subject.year_level < 1 || subject.year_level > 6) {
        errors.push({ field: `subjects[${subjectIndex}].year_level`, message: 'Subject year_level must be between 1 and 6.' });
      }
      if (typeof subject.term !== 'number' || subject.term < 1 || subject.term > 3) {
        errors.push({ field: `subjects[${subjectIndex}].term`, message: 'Subject term must be 1, 2, or 3.' });
      }
    });

    if (Array.isArray(rawCurriculum.prerequisites)) {
      rawCurriculum.prerequisites.forEach((prerequisiteEntry, prerequisiteIndex) => {
        if (!prerequisiteEntry || typeof prerequisiteEntry !== 'object') return;
        const prerequisite = prerequisiteEntry as Record<string, unknown>;
        if (typeof prerequisite.subject !== 'string' || typeof prerequisite.requires !== 'string') {
          errors.push({ field: `prerequisites[${prerequisiteIndex}]`, message: 'Prerequisite must have subject and requires codes.' });
        } else {
          if (!subjectCodes.has(prerequisite.subject.trim().toUpperCase())) {
            errors.push({ field: `prerequisites[${prerequisiteIndex}].subject`, message: `Subject "${prerequisite.subject}" not found in subjects list.` });
          }
          if (!subjectCodes.has(prerequisite.requires.trim().toUpperCase())) {
            errors.push({ field: `prerequisites[${prerequisiteIndex}].requires`, message: `Required subject "${prerequisite.requires}" not found in subjects list.` });
          }
          if (prerequisite.subject.trim().toUpperCase() === prerequisite.requires.trim().toUpperCase()) {
            errors.push({ field: `prerequisites[${prerequisiteIndex}]`, message: 'A subject cannot be a prerequisite of itself.' });
          }
        }
      });
    }

    if (Array.isArray(rawCurriculum.year_range_prerequisites)) {
      rawCurriculum.year_range_prerequisites.forEach((yearRangeEntry, yearRangeIndex) => {
        if (!yearRangeEntry || typeof yearRangeEntry !== 'object') return;
        const yearRangePrerequisite = yearRangeEntry as Record<string, unknown>;
        const subjectCode = yearRangePrerequisite.subject;
        const throughYearLevel = yearRangePrerequisite.through_year_level;

        if (typeof subjectCode !== 'string' || typeof throughYearLevel !== 'number') {
          errors.push({
            field: `year_range_prerequisites[${yearRangeIndex}]`,
            message: 'Year-range prerequisite must have a subject code and through_year_level.',
          });
          return;
        }

        const normalizedSubjectCode = subjectCode.trim().toUpperCase();
        const targetSubject = subjectEntries.find((subjectEntry) => {
          if (!subjectEntry || typeof subjectEntry !== 'object') return false;
          const subject = subjectEntry as Record<string, unknown>;
          return typeof subject.code === 'string' && subject.code.trim().toUpperCase() === normalizedSubjectCode;
        }) as Record<string, unknown> | undefined;

        if (!subjectCodes.has(normalizedSubjectCode)) {
          errors.push({
            field: `year_range_prerequisites[${yearRangeIndex}].subject`,
            message: `Subject "${subjectCode}" not found in subjects list.`,
          });
        }
        if (!Number.isInteger(throughYearLevel) || throughYearLevel < 1 || throughYearLevel > 5) {
          errors.push({
            field: `year_range_prerequisites[${yearRangeIndex}].through_year_level`,
            message: 'through_year_level must be a whole number between 1 and 5.',
          });
        } else if (targetSubject && typeof targetSubject.year_level === 'number' && targetSubject.year_level <= throughYearLevel) {
          errors.push({
            field: `year_range_prerequisites[${yearRangeIndex}]`,
            message: 'A year-range prerequisite cannot include the subject itself.',
          });
        }
      });
    }

    if (Array.isArray(rawCurriculum.corequisites)) {
      rawCurriculum.corequisites.forEach((corequisiteEntry, corequisiteIndex) => {
        if (!corequisiteEntry || typeof corequisiteEntry !== 'object') return;
        const corequisite = corequisiteEntry as Record<string, unknown>;
        if (typeof corequisite.subject !== 'string' || typeof corequisite.with !== 'string') {
          errors.push({ field: `corequisites[${corequisiteIndex}]`, message: 'Corequisite must have subject and with codes.' });
        } else {
          if (!subjectCodes.has(corequisite.subject.trim().toUpperCase())) {
            errors.push({ field: `corequisites[${corequisiteIndex}].subject`, message: `Subject "${corequisite.subject}" not found in subjects list.` });
          }
          if (!subjectCodes.has(corequisite.with.trim().toUpperCase())) {
            errors.push({ field: `corequisites[${corequisiteIndex}].with`, message: `Paired subject "${corequisite.with}" not found in subjects list.` });
          }
          if (corequisite.subject.trim().toUpperCase() === corequisite.with.trim().toUpperCase()) {
            errors.push({ field: `corequisites[${corequisiteIndex}]`, message: 'A subject cannot be a co-requisite of itself.' });
          }
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedPackage: errors.length === 0 ? (json as CurriculumPackageDto) : undefined,
  };
}
