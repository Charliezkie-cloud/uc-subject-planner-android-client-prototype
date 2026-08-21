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

  const subjectMap = new Map<number, { code: string; name: string }>();
  for (const subject of subjects) {
    subjectMap.set(subject.id, { code: subject.subjectCode, name: subject.subjectName });
  }

  const passedSubjectIds = new Set<number>();
  for (const status of subjectStatuses) {
    if (status.status === 'passed') {
      passedSubjectIds.add(status.subjectId);
    }
  }

  const prerequisiteMap = new Map<number, number[]>();
  for (const prerequisiteEdge of prerequisites) {
    const prerequisiteList = prerequisiteMap.get(prerequisiteEdge.subjectId) || [];
    prerequisiteList.push(prerequisiteEdge.prerequisiteSubjectId);
    prerequisiteMap.set(prerequisiteEdge.subjectId, prerequisiteList);
  }

  const corequisiteMap = new Map<number, number[]>();
  for (const corequisiteEdge of corequisites) {
    const corequisiteList = corequisiteMap.get(corequisiteEdge.subjectId) || [];
    corequisiteList.push(corequisiteEdge.corequisiteSubjectId);
    corequisiteMap.set(corequisiteEdge.subjectId, corequisiteList);
  }

  const sameTermPlannedSubjectIds = new Set<number>();
  if (targetPlanningTerm) {
    for (const plannedSubject of plannedSubjects) {
      if (
        plannedSubject.plannedSchoolYear === targetPlanningTerm.plannedSchoolYear &&
        plannedSubject.plannedTerm === targetPlanningTerm.plannedTerm
      ) {
        sameTermPlannedSubjectIds.add(plannedSubject.subjectId);
      }
    }
  }

  const evaluationResults = new Map<number, SubjectEligibilityResult>();

  for (const subject of subjects) {
    const isPassed = passedSubjectIds.has(subject.id);

    if (isPassed) {
      evaluationResults.set(subject.id, {
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

    const requiredPrerequisites = prerequisiteMap.get(subject.id) || [];
    for (const prerequisiteId of requiredPrerequisites) {
      const prerequisitePassed = passedSubjectIds.has(prerequisiteId);
      if (!prerequisitePassed) {
        const prerequisiteInfo = subjectMap.get(prerequisiteId);
        missingPrerequisites.push({
          type: 'prerequisite',
          subjectId: prerequisiteId,
          subjectCode: prerequisiteInfo ? prerequisiteInfo.code : `Subject #${prerequisiteId}`,
          subjectName: prerequisiteInfo?.name,
          reason: 'Prerequisite has not been passed yet.',
        });
      }
    }

    const requiredCorequisites = corequisiteMap.get(subject.id) || [];
    for (const corequisiteId of requiredCorequisites) {
      const corequisitePassed = passedSubjectIds.has(corequisiteId);
      const corequisitePlannedSameTerm = sameTermPlannedSubjectIds.has(corequisiteId);

      if (!corequisitePassed && !corequisitePlannedSameTerm) {
        const corequisiteInfo = subjectMap.get(corequisiteId);
        missingCorequisites.push({
          type: 'corequisite',
          subjectId: corequisiteId,
          subjectCode: corequisiteInfo ? corequisiteInfo.code : `Subject #${corequisiteId}`,
          subjectName: corequisiteInfo?.name,
          reason:
            'Co-requisite must be passed previously or planned in the same term.',
        });
      }
    }

    const unmetCount = missingPrerequisites.length + missingCorequisites.length;
    const isEligible = unmetCount === 0;

    evaluationResults.set(subject.id, {
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

  return evaluationResults;
}
