import { evaluateEligibility } from './eligibility';
import { SubjectInput, PrerequisiteEdge, CorequisiteEdge } from './types';

describe('Eligibility Engine', () => {
  const sampleSubjects: SubjectInput[] = [
    { id: 1, subjectCode: 'CS101', subjectName: 'Intro to Programming', units: 3 },
    { id: 2, subjectCode: 'CS102', subjectName: 'Data Structures', units: 3 },
    { id: 3, subjectCode: 'CS102L', subjectName: 'Data Structures Lab', units: 1 },
    { id: 4, subjectCode: 'CS201', subjectName: 'Algorithms', units: 3 },
    { id: 5, subjectCode: 'GE101', subjectName: 'Understanding the Self', units: 3 },
  ];

  const samplePrerequisites: PrerequisiteEdge[] = [
    { subjectId: 2, prerequisiteSubjectId: 1 },
    { subjectId: 4, prerequisiteSubjectId: 2 },
  ];

  const sampleCorequisites: CorequisiteEdge[] = [
    { subjectId: 2, corequisiteSubjectId: 3 },
  ];

  it('marks subject with no prerequisites/co-requisites as eligible if not passed', () => {
    const evaluationResults = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites: samplePrerequisites,
      corequisites: sampleCorequisites,
      subjectStatuses: [],
      plannedSubjects: [],
    });

    const cs101Result = evaluationResults.get(1);
    const ge101Result = evaluationResults.get(5);

    expect(cs101Result?.status).toBe('eligible');
    expect(cs101Result?.isEligible).toBe(true);
    expect(ge101Result?.status).toBe('eligible');
    expect(ge101Result?.isEligible).toBe(true);
  });

  it('marks subject as passed and not eligible for enrollment if already passed', () => {
    const evaluationResults = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites: samplePrerequisites,
      corequisites: sampleCorequisites,
      subjectStatuses: [{ subjectId: 1, status: 'passed' }],
      plannedSubjects: [],
    });

    const cs101Result = evaluationResults.get(1);
    expect(cs101Result?.status).toBe('passed');
    expect(cs101Result?.isPassed).toBe(true);
    expect(cs101Result?.isEligible).toBe(false);
  });

  it('blocks subject when prerequisite has not been completed', () => {
    const evaluationResults = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites: samplePrerequisites,
      corequisites: sampleCorequisites,
      subjectStatuses: [],
      plannedSubjects: [],
    });

    const cs102Result = evaluationResults.get(2);
    expect(cs102Result?.status).toBe('not_eligible');
    expect(cs102Result?.isEligible).toBe(false);
    expect(cs102Result?.missingPrerequisites).toHaveLength(1);
    expect(cs102Result?.missingPrerequisites[0].subjectCode).toBe('CS101');
  });

  it('satisfies co-requisite if co-requisite is already passed', () => {
    const evaluationResults = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites: samplePrerequisites,
      corequisites: sampleCorequisites,
      subjectStatuses: [
        { subjectId: 1, status: 'passed' },
        { subjectId: 3, status: 'passed' },
      ],
      plannedSubjects: [],
      targetPlanningTerm: {
        plannedSchoolYear: '2025-2026',
        plannedTerm: 1,
      },
    });

    const cs102Result = evaluationResults.get(2);
    expect(cs102Result?.missingPrerequisites).toHaveLength(0);
    expect(cs102Result?.missingCorequisites).toHaveLength(0);
    expect(cs102Result?.status).toBe('eligible');
    expect(cs102Result?.isEligible).toBe(true);
  });

  it('satisfies co-requisite if co-requisite is planned in the same term', () => {
    const evaluationResults = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites: samplePrerequisites,
      corequisites: sampleCorequisites,
      subjectStatuses: [
        { subjectId: 1, status: 'passed' },
      ],
      plannedSubjects: [
        { subjectId: 3, plannedSchoolYear: '2025-2026', plannedTerm: 1 },
      ],
      targetPlanningTerm: {
        plannedSchoolYear: '2025-2026',
        plannedTerm: 1,
      },
    });

    const cs102Result = evaluationResults.get(2);
    expect(cs102Result?.status).toBe('eligible');
    expect(cs102Result?.isEligible).toBe(true);
    expect(cs102Result?.missingCorequisites).toHaveLength(0);
  });

  it('blocks co-requisite if planned in a different term', () => {
    const evaluationResults = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites: samplePrerequisites,
      corequisites: sampleCorequisites,
      subjectStatuses: [
        { subjectId: 1, status: 'passed' },
      ],
      plannedSubjects: [
        { subjectId: 3, plannedSchoolYear: '2025-2026', plannedTerm: 2 },
      ],
      targetPlanningTerm: {
        plannedSchoolYear: '2025-2026',
        plannedTerm: 1,
      },
    });

    const cs102Result = evaluationResults.get(2);
    expect(cs102Result?.status).toBe('not_eligible');
    expect(cs102Result?.isEligible).toBe(false);
    expect(cs102Result?.missingCorequisites).toHaveLength(1);
    expect(cs102Result?.missingCorequisites[0].subjectCode).toBe('CS102L');
  });

  it('handles retake with passed status correctly overriding failing attempt', () => {
    const evaluationResults = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites: samplePrerequisites,
      corequisites: sampleCorequisites,
      subjectStatuses: [
        { subjectId: 1, status: 'passed', attemptNumber: 2, grade: 2.0 },
      ],
      plannedSubjects: [
        { subjectId: 3, plannedSchoolYear: '2025-2026', plannedTerm: 1 },
      ],
      targetPlanningTerm: {
        plannedSchoolYear: '2025-2026',
        plannedTerm: 1,
      },
    });

    const cs102Result = evaluationResults.get(2);
    expect(cs102Result?.isEligible).toBe(true);
  });

  describe('Year-range prerequisites', () => {
    const curriculumSubjects: SubjectInput[] = [
      { id: 1, subjectCode: 'CS11', subjectName: 'Prog 1', units: 3, yearLevel: 1, term: 1 },
      { id: 2, subjectCode: 'CS12', subjectName: 'Prog 2', units: 3, yearLevel: 1, term: 2 },
      { id: 3, subjectCode: 'CS21', subjectName: 'Data Struct', units: 3, yearLevel: 2, term: 1 },
      { id: 4, subjectCode: 'CS22', subjectName: 'Web Dev', units: 3, yearLevel: 2, term: 2 },
      { id: 5, subjectCode: 'CS31', subjectName: 'Software Eng', units: 3, yearLevel: 3, term: 1 },
      { id: 6, subjectCode: 'CS41', subjectName: 'Practicum', units: 3, yearLevel: 4, term: 1 },
    ];

    it('blocks a subject when year-range prerequisites through a given year are not yet completed', () => {
      const evaluationResults = evaluateEligibility({
        subjects: curriculumSubjects,
        prerequisites: [],
        corequisites: [],
        yearRangePrerequisites: [
          { subjectId: 6, throughYearLevel: 2 }, // Practicum requires all year 1 and 2 subjects
        ],
        subjectStatuses: [
          { subjectId: 1, status: 'passed' },
          { subjectId: 2, status: 'passed' },
          { subjectId: 3, status: 'passed' },
          // CS22 (Year 2) is missing
        ],
        plannedSubjects: [],
      });

      const practicumResult = evaluationResults.get(6);
      expect(practicumResult?.status).toBe('not_eligible');
      expect(practicumResult?.isEligible).toBe(false);
      expect(practicumResult?.missingYearRangePrerequisites).toHaveLength(1);
      expect(practicumResult?.missingYearRangePrerequisites[0]).toMatchObject({
        type: 'year_range_prerequisite',
        throughYearLevel: 2,
        unmetSubjectCount: 1,
      });
    });

    it('marks a subject eligible when all subjects in the required year range are passed', () => {
      const evaluationResults = evaluateEligibility({
        subjects: curriculumSubjects,
        prerequisites: [],
        corequisites: [],
        yearRangePrerequisites: [
          { subjectId: 6, throughYearLevel: 2 },
        ],
        subjectStatuses: [
          { subjectId: 1, status: 'passed' },
          { subjectId: 2, status: 'passed' },
          { subjectId: 3, status: 'passed' },
          { subjectId: 4, status: 'passed' },
        ],
        plannedSubjects: [],
      });

      const practicumResult = evaluationResults.get(6);
      expect(practicumResult?.status).toBe('eligible');
      expect(practicumResult?.isEligible).toBe(true);
      expect(practicumResult?.missingYearRangePrerequisites).toHaveLength(0);
    });

    it('tracks direct prerequisite alongside year-range prerequisite without duplicating rules', () => {
      const evaluationResults = evaluateEligibility({
        subjects: curriculumSubjects,
        prerequisites: [
          { subjectId: 6, prerequisiteSubjectId: 4 }, // direct prerequisite CS22
        ],
        corequisites: [],
        yearRangePrerequisites: [
          { subjectId: 6, throughYearLevel: 2 }, // year range through Year 2
        ],
        subjectStatuses: [
          { subjectId: 1, status: 'passed' },
          { subjectId: 2, status: 'passed' },
          { subjectId: 3, status: 'passed' },
        ],
        plannedSubjects: [],
      });

      const practicumResult = evaluationResults.get(6);
      expect(practicumResult?.status).toBe('not_eligible');
      expect(practicumResult?.missingPrerequisites).toHaveLength(1);
      expect(practicumResult?.missingPrerequisites[0].subjectCode).toBe('CS22');
      expect(practicumResult?.missingYearRangePrerequisites).toHaveLength(1);
      expect(practicumResult?.missingYearRangePrerequisites[0].throughYearLevel).toBe(2);
    });
  });
});
