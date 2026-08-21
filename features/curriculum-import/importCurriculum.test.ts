import { validateCurriculumJson } from './importCurriculum';

describe('Curriculum Import Validator', () => {
  it('validates a correct curriculum package', () => {
    const validCurriculumPackage = {
      program_code: 'BSIT',
      program_name: 'BS Information Technology',
      curriculum_version: '2023',
      subjects: [
        { code: 'IT101', name: 'Intro to IT', units: 3, year_level: 1, term: 1 },
        { code: 'IT102', name: 'Programming 1', units: 3, year_level: 1, term: 1 },
        { code: 'IT103', name: 'Programming 2', units: 3, year_level: 1, term: 2 },
      ],
      prerequisites: [
        { subject: 'IT103', requires: 'IT102' },
      ],
      corequisites: [],
    };

    const validationResult = validateCurriculumJson(validCurriculumPackage);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
  });

  it('catches missing program metadata', () => {
    const invalidCurriculumPackage = {
      program_code: '',
      program_name: 'BS Information Technology',
      curriculum_version: '2023',
      subjects: [
        { code: 'IT101', name: 'Intro to IT', units: 3, year_level: 1, term: 1 },
      ],
    };

    const validationResult = validateCurriculumJson(invalidCurriculumPackage);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.some((error) => error.field === 'program_code')).toBe(true);
  });

  it('catches nonexistent subject reference in prerequisites', () => {
    const invalidCurriculumPackage = {
      program_code: 'BSIT',
      program_name: 'BS Information Technology',
      curriculum_version: '2023',
      subjects: [
        { code: 'IT101', name: 'Intro to IT', units: 3, year_level: 1, term: 1 },
      ],
      prerequisites: [
        { subject: 'IT101', requires: 'NONEXISTENT' },
      ],
    };

    const validationResult = validateCurriculumJson(invalidCurriculumPackage);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.some((error) => error.field.includes('prerequisites'))).toBe(true);
  });

  it('catches self-referencing prerequisite', () => {
    const invalidCurriculumPackage = {
      program_code: 'BSIT',
      program_name: 'BS Information Technology',
      curriculum_version: '2023',
      subjects: [
        { code: 'IT101', name: 'Intro to IT', units: 3, year_level: 1, term: 1 },
      ],
      prerequisites: [
        { subject: 'IT101', requires: 'IT101' },
      ],
    };

    const validationResult = validateCurriculumJson(invalidCurriculumPackage);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.some((error) => error.message.includes('cannot be a prerequisite of itself'))).toBe(true);
  });
});

