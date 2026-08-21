import { expandYearRangePrerequisites, validateCurriculumJson } from './importCurriculum';
import bsitCurriculum from '../../data/ITCS/BSIT-2024-2025.json';
import bscsCurriculum from '../../data/ITCS/BSCS-2024-2025.json';
import bscsaiCurriculum from '../../data/ITCS/BSCSAI-2024-2025.json';

describe('Curriculum Import Validator', () => {
  it('validates a correct curriculum package', () => {
    const validCurriculumPackage = {
      program_code: 'ITCS',
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
      program_code: 'ITCS',
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
      program_code: 'ITCS',
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

  it('expands a year-range prerequisite into every subject through the specified year', () => {
    const prerequisites = expandYearRangePrerequisites(
      [
        { code: 'IT101', name: 'Intro to IT', units: 3, year_level: 1, term: 1 },
        { code: 'IT201', name: 'Programming 1', units: 3, year_level: 2, term: 1 },
        { code: 'IT301', name: 'Capstone', units: 3, year_level: 3, term: 1 },
      ],
      [{ subject: 'IT301', through_year_level: 2 }]
    );

    expect(prerequisites).toEqual([
      { subject: 'IT301', requires: 'IT101' },
      { subject: 'IT301', requires: 'IT201' },
    ]);
  });

  it('rejects a year-range prerequisite that includes its own subject', () => {
    const invalidCurriculumPackage = {
      program_code: 'ITCS',
      program_name: 'BS Information Technology',
      curriculum_version: '2023',
      subjects: [
        { code: 'IT101', name: 'Intro to IT', units: 3, year_level: 1, term: 1 },
      ],
      year_range_prerequisites: [
        { subject: 'IT101', through_year_level: 1 },
      ],
    };

    const validationResult = validateCurriculumJson(invalidCurriculumPackage);
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.some((error) => error.message.includes('cannot include the subject itself'))).toBe(true);
  });

  it('validates the bundled curricula with year-range prerequisites', () => {
    expect(validateCurriculumJson(bsitCurriculum).isValid).toBe(true);
    expect(validateCurriculumJson(bscsCurriculum).isValid).toBe(true);
    expect(validateCurriculumJson(bscsaiCurriculum).isValid).toBe(true);
  });

  it('expands all year 1 to 3 subjects as prerequisites for BSIT Capstone Project 1', () => {
    const bsitPackage = bsitCurriculum as unknown as {
      subjects: Parameters<typeof expandYearRangePrerequisites>[0];
      year_range_prerequisites: Parameters<typeof expandYearRangePrerequisites>[1];
    };
    const expanded = expandYearRangePrerequisites(
      bsitPackage.subjects,
      bsitPackage.year_range_prerequisites
    );

    const capstonePrereqs = expanded.filter((prereq) => prereq.subject === 'IT-CPSTONE41');
    const year1to3Subjects = bsitPackage.subjects.filter((subject) => subject.year_level <= 3);

    expect(capstonePrereqs).toHaveLength(year1to3Subjects.length);
    expect(capstonePrereqs.some((prereq) => prereq.requires === 'CC-COMPROG11')).toBe(true);
    expect(capstonePrereqs.some((prereq) => prereq.requires === 'IT-SYSARCH32')).toBe(true);
  });
});
