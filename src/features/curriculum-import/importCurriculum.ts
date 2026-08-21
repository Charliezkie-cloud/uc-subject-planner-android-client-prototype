import { CurriculumPackageDto } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: CurriculumPackageDto;
}

/**
 * Pure function to validate raw JSON structure of a curriculum file.
 */
export function validateCurriculumJson(json: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!json || typeof json !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'root', message: 'Curriculum data must be a valid JSON object.' }],
    };
  }

  const data = json as Record<string, unknown>;

  if (typeof data.program_code !== 'string' || !data.program_code.trim()) {
    errors.push({ field: 'program_code', message: 'Missing or invalid program_code.' });
  }

  if (typeof data.program_name !== 'string' || !data.program_name.trim()) {
    errors.push({ field: 'program_name', message: 'Missing or invalid program_name.' });
  }

  if (typeof data.curriculum_version !== 'string' || !data.curriculum_version.trim()) {
    errors.push({ field: 'curriculum_version', message: 'Missing or invalid curriculum_version.' });
  }

  if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
    errors.push({ field: 'subjects', message: 'Curriculum must contain a non-empty subjects array.' });
  } else {
    const subjectCodes = new Set<string>();
    data.subjects.forEach((subj, idx) => {
      if (!subj || typeof subj !== 'object') {
        errors.push({ field: `subjects[${idx}]`, message: 'Subject entry must be an object.' });
        return;
      }
      const s = subj as Record<string, unknown>;
      if (typeof s.code !== 'string' || !s.code.trim()) {
        errors.push({ field: `subjects[${idx}].code`, message: 'Subject must have a non-empty string code.' });
      } else {
        if (subjectCodes.has(s.code.trim().toUpperCase())) {
          errors.push({ field: `subjects[${idx}].code`, message: `Duplicate subject code "${s.code}" in curriculum.` });
        }
        subjectCodes.add(s.code.trim().toUpperCase());
      }
      if (typeof s.name !== 'string' || !s.name.trim()) {
        errors.push({ field: `subjects[${idx}].name`, message: 'Subject must have a valid name.' });
      }
      if (typeof s.units !== 'number' || s.units <= 0) {
        errors.push({ field: `subjects[${idx}].units`, message: 'Subject units must be a positive number.' });
      }
      if (typeof s.year_level !== 'number' || s.year_level < 1 || s.year_level > 6) {
        errors.push({ field: `subjects[${idx}].year_level`, message: 'Subject year_level must be between 1 and 6.' });
      }
      if (typeof s.term !== 'number' || s.term < 1 || s.term > 3) {
        errors.push({ field: `subjects[${idx}].term`, message: 'Subject term must be 1, 2, or 3.' });
      }
    });

    if (Array.isArray(data.prerequisites)) {
      data.prerequisites.forEach((prereq, idx) => {
        if (!prereq || typeof prereq !== 'object') return;
        const p = prereq as Record<string, unknown>;
        if (typeof p.subject !== 'string' || typeof p.requires !== 'string') {
          errors.push({ field: `prerequisites[${idx}]`, message: 'Prerequisite must have subject and requires codes.' });
        } else {
          if (!subjectCodes.has(p.subject.trim().toUpperCase())) {
            errors.push({ field: `prerequisites[${idx}].subject`, message: `Subject "${p.subject}" not found in subjects list.` });
          }
          if (!subjectCodes.has(p.requires.trim().toUpperCase())) {
            errors.push({ field: `prerequisites[${idx}].requires`, message: `Required subject "${p.requires}" not found in subjects list.` });
          }
          if (p.subject.trim().toUpperCase() === p.requires.trim().toUpperCase()) {
            errors.push({ field: `prerequisites[${idx}]`, message: 'A subject cannot be a prerequisite of itself.' });
          }
        }
      });
    }

    if (Array.isArray(data.corequisites)) {
      data.corequisites.forEach((coreq, idx) => {
        if (!coreq || typeof coreq !== 'object') return;
        const c = coreq as Record<string, unknown>;
        if (typeof c.subject !== 'string' || typeof c.with !== 'string') {
          errors.push({ field: `corequisites[${idx}]`, message: 'Corequisite must have subject and with codes.' });
        } else {
          if (!subjectCodes.has(c.subject.trim().toUpperCase())) {
            errors.push({ field: `corequisites[${idx}].subject`, message: `Subject "${c.subject}" not found in subjects list.` });
          }
          if (!subjectCodes.has(c.with.trim().toUpperCase())) {
            errors.push({ field: `corequisites[${idx}].with`, message: `Paired subject "${c.with}" not found in subjects list.` });
          }
          if (c.subject.trim().toUpperCase() === c.with.trim().toUpperCase()) {
            errors.push({ field: `corequisites[${idx}]`, message: 'A subject cannot be a co-requisite of itself.' });
          }
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (json as CurriculumPackageDto) : undefined,
  };
}
