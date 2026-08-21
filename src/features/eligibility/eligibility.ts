import {
  EvaluateEligibilityParams,
  SubjectEligibilityResult,
  MissingRequirement,
} from './types';

/**
 * Pure eligibility evaluation engine.
 * Computes eligibility for all subjects against prerequisite/co-requisite rules,
 * completed subject statuses, and planned subjects for the target term.
 */
export function evaluateEligibility(
  params: EvaluateEligibilityParams
): Map<number, SubjectEligibilityResult> {
  const {
    subjects,
    prerequisites,
    corequisites,
    subjectStatuses,
    plannedSubjects,
    targetPlanningTerm,
  } = params;

  // Map subjects by ID for fast lookup
  const subjectMap = new Map<number, { code: string; name: string }>();
  for (const s of subjects) {
    subjectMap.set(s.id, { code: s.subjectCode, name: s.subjectName });
  }

  // Map latest passed status by subject ID
  const passedSubjectIds = new Set<number>();
  for (const status of subjectStatuses) {
    if (status.status === 'passed') {
      passedSubjectIds.add(status.subjectId);
    }
  }

  // Pre-group prerequisites by subject ID: subjectId -> list of prereqSubjectIds
  const prereqMap = new Map<number, number[]>();
  for (const edge of prerequisites) {
    const list = prereqMap.get(edge.subjectId) || [];
    list.push(edge.prerequisiteSubjectId);
    prereqMap.set(edge.subjectId, list);
  }

  // Pre-group corequisites by subject ID: subjectId -> list of coreqSubjectIds
  const coreqMap = new Map<number, number[]>();
  for (const edge of corequisites) {
    const list = coreqMap.get(edge.subjectId) || [];
    list.push(edge.corequisiteSubjectId);
    coreqMap.set(edge.subjectId, list);
  }

  // Set of subjects planned in the target term
  const sameTermPlannedSubjectIds = new Set<number>();
  if (targetPlanningTerm) {
    for (const plan of plannedSubjects) {
      if (
        plan.plannedSchoolYear === targetPlanningTerm.plannedSchoolYear &&
        plan.plannedTerm === targetPlanningTerm.plannedTerm
      ) {
        sameTermPlannedSubjectIds.add(plan.subjectId);
      }
    }
  }

  const results = new Map<number, SubjectEligibilityResult>();

  for (const subject of subjects) {
    const isPassed = passedSubjectIds.has(subject.id);

    if (isPassed) {
      results.set(subject.id, {
        subjectId: subject.id,
        subjectCode: subject.subjectCode,
        status: 'passed',
        isEligible: false,
        isPassed: true,
        missingPrerequisites: [],
        missingCorequisites: [],
        unmetRequirementsCount: 0,
      });
      continue;
    }

    const missingPrerequisites: MissingRequirement[] = [];
    const missingCorequisites: MissingRequirement[] = [];

    // Check prerequisites
    const requiredPrereqs = prereqMap.get(subject.id) || [];
    for (const prereqId of requiredPrereqs) {
      const prereqPassed = passedSubjectIds.has(prereqId);
      if (!prereqPassed) {
        const prereqInfo = subjectMap.get(prereqId);
        missingPrerequisites.push({
          type: 'prerequisite',
          subjectId: prereqId,
          subjectCode: prereqInfo ? prereqInfo.code : `Subject #${prereqId}`,
          subjectName: prereqInfo?.name,
          reason: 'Prerequisite has not been passed yet.',
        });
      }
    }

    // Check co-requisites
    const requiredCoreqs = coreqMap.get(subject.id) || [];
    for (const coreqId of requiredCoreqs) {
      const coreqPassed = passedSubjectIds.has(coreqId);
      const coreqPlannedSameTerm = sameTermPlannedSubjectIds.has(coreqId);

      if (!coreqPassed && !coreqPlannedSameTerm) {
        const coreqInfo = subjectMap.get(coreqId);
        missingCorequisites.push({
          type: 'corequisite',
          subjectId: coreqId,
          subjectCode: coreqInfo ? coreqInfo.code : `Subject #${coreqId}`,
          subjectName: coreqInfo?.name,
          reason:
            'Co-requisite must be passed previously or planned in the same term.',
        });
      }
    }

    const unmetCount = missingPrerequisites.length + missingCorequisites.length;
    const isEligible = unmetCount === 0;

    results.set(subject.id, {
      subjectId: subject.id,
      subjectCode: subject.subjectCode,
      status: isEligible ? 'eligible' : 'not_eligible',
      isEligible,
      isPassed: false,
      missingPrerequisites,
      missingCorequisites,
      unmetRequirementsCount: unmetCount,
    });
  }

  return results;
}
