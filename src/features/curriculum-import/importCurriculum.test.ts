import { validateCurriculumJson } from './importCurriculum';

describe('Curriculum Import Validator', () => {
  it('validates a correct curriculum package', () => {
    const validData = {
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

    const result = validateCurriculumJson(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('catches missing program metadata', () => {
    const invalidData = {
      program_code: '',
      program_name: 'BS Information Technology',
      curriculum_version: '2023',
      subjects: [
        { code: 'IT101', name: 'Intro to IT', units: 3, year_level: 1, term: 1 },
      ],
    };

    const result = validateCurriculumJson(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'program_code')).toBe(true);
  });

  it('catches nonexistent subject reference in prerequisites', () => {
    const invalidData = {
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

    const result = validateCurriculumJson(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field.includes('prerequisites'))).toBe(true);
  });

  it('catches self-referencing prerequisite', () => {
    const invalidData = {
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

    const result = validateCurriculumJson(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.message.includes('cannot be a prerequisite of itself'))).toBe(true);
  });
});
