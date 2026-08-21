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

  const prerequisites: PrerequisiteEdge[] = [
    { subjectId: 2, prerequisiteSubjectId: 1 }, // CS102 requires CS101
    { subjectId: 4, prerequisiteSubjectId: 2 }, // CS201 requires CS102
  ];

  const corequisites: CorequisiteEdge[] = [
    { subjectId: 2, corequisiteSubjectId: 3 }, // CS102 co-requisite CS102L
  ];

  it('marks subject with no prerequisites/co-requisites as eligible if not passed', () => {
    const results = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites,
      corequisites,
      subjectStatuses: [],
      plannedSubjects: [],
    });

    const cs101 = results.get(1);
    const ge101 = results.get(5);

    expect(cs101?.status).toBe('eligible');
    expect(cs101?.isEligible).toBe(true);
    expect(ge101?.status).toBe('eligible');
    expect(ge101?.isEligible).toBe(true);
  });

  it('marks subject as passed and not eligible for enrollment if already passed', () => {
    const results = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites,
      corequisites,
      subjectStatuses: [{ subjectId: 1, status: 'passed' }],
      plannedSubjects: [],
    });

    const cs101 = results.get(1);
    expect(cs101?.status).toBe('passed');
    expect(cs101?.isPassed).toBe(true);
    expect(cs101?.isEligible).toBe(false);
  });

  it('blocks subject when prerequisite has not been completed', () => {
    const results = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites,
      corequisites,
      subjectStatuses: [],
      plannedSubjects: [],
    });

    const cs102 = results.get(2);
    expect(cs102?.status).toBe('not_eligible');
    expect(cs102?.isEligible).toBe(false);
    expect(cs102?.missingPrerequisites).toHaveLength(1);
    expect(cs102?.missingPrerequisites[0].subjectCode).toBe('CS101');
  });

  it('satisfies co-requisite if co-requisite is already passed', () => {
    const results = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites,
      corequisites,
      subjectStatuses: [
        { subjectId: 1, status: 'passed' }, // CS101 passed
        { subjectId: 3, status: 'passed' }, // CS102L passed in advance
      ],
      plannedSubjects: [],
      targetPlanningTerm: {
        plannedSchoolYear: '2025-2026',
        plannedTerm: 1,
      },
    });

    const cs102 = results.get(2);
    expect(cs102?.missingPrerequisites).toHaveLength(0);
    expect(cs102?.missingCorequisites).toHaveLength(0);
    expect(cs102?.status).toBe('eligible');
    expect(cs102?.isEligible).toBe(true);
  });

  it('satisfies co-requisite if co-requisite is planned in the same term', () => {
    const results = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites,
      corequisites,
      subjectStatuses: [
        { subjectId: 1, status: 'passed' }, // CS101 passed
      ],
      plannedSubjects: [
        { subjectId: 3, plannedSchoolYear: '2025-2026', plannedTerm: 1 }, // CS102L planned in 2025-2026 Term 1
      ],
      targetPlanningTerm: {
        plannedSchoolYear: '2025-2026',
        plannedTerm: 1,
      },
    });

    const cs102 = results.get(2);
    expect(cs102?.status).toBe('eligible');
    expect(cs102?.isEligible).toBe(true);
    expect(cs102?.missingCorequisites).toHaveLength(0);
  });

  it('blocks co-requisite if planned in a different term', () => {
    const results = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites,
      corequisites,
      subjectStatuses: [
        { subjectId: 1, status: 'passed' }, // CS101 passed
      ],
      plannedSubjects: [
        { subjectId: 3, plannedSchoolYear: '2025-2026', plannedTerm: 2 }, // CS102L in term 2, but targeting term 1
      ],
      targetPlanningTerm: {
        plannedSchoolYear: '2025-2026',
        plannedTerm: 1,
      },
    });

    const cs102 = results.get(2);
    expect(cs102?.status).toBe('not_eligible');
    expect(cs102?.isEligible).toBe(false);
    expect(cs102?.missingCorequisites).toHaveLength(1);
    expect(cs102?.missingCorequisites[0].subjectCode).toBe('CS102L');
  });

  it('handles retake with passed status correctly overriding failing attempt', () => {
    // Subject_status view returns the latest attempt
    const results = evaluateEligibility({
      subjects: sampleSubjects,
      prerequisites,
      corequisites,
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

    const cs102 = results.get(2);
    expect(cs102?.isEligible).toBe(true);
  });
});
