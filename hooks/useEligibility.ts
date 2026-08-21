import { useState, useEffect, useCallback, useMemo } from 'react';
import { getProgramSubjects, getPrerequisitesForProgram, getCorequisitesForProgram, ProgramSubjectDetail } from '@/db/queries/subjects';
import { getSubjectStatuses, recordSubjectAttempt } from '@/db/queries/completedSubjects';
import { getPlannedSubjects, addPlannedSubject, removePlannedSubjectBySubjectAndTerm, PlannedSubjectDetail } from '@/db/queries/plannedSubjects';
import { getStudentProfile, getProgramById } from '@/db/queries/programs';
import { evaluateEligibility } from '@/features/eligibility/eligibility';
import { SubjectEligibilityResult } from '@/features/eligibility/types';
import { Program, SubjectStatusView } from '@/types/database';

export function useEligibility(targetTerm?: { plannedSchoolYear: string; plannedTerm: number }) {
  const [loading, setLoading] = useState(true);
  const [eligibilityMap, setEligibilityMap] = useState<Map<number, SubjectEligibilityResult>>(new Map());
  const [subjects, setSubjects] = useState<ProgramSubjectDetail[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [subjectStatuses, setSubjectStatuses] = useState<SubjectStatusView[]>([]);
  const [allPlannedSubjects, setAllPlannedSubjects] = useState<PlannedSubjectDetail[]>([]);

  const plannedYear = targetTerm?.plannedSchoolYear;
  const plannedTermNumber = targetTerm?.plannedTerm;

  const calculateEligibility = useCallback(async () => {
    setLoading(true);
    try {
      const studentProfile = await getStudentProfile();
      if (!studentProfile || !studentProfile.programId) {
        setEligibilityMap(new Map());
        setSubjects([]);
        setActiveProgram(null);
        setSubjectStatuses([]);
        setAllPlannedSubjects([]);
        setLoading(false);
        return;
      }

      const programId = studentProfile.programId;
      const [program, programSubjects, programPrerequisites, programCorequisites, statuses, plannedList] =
        await Promise.all([
          getProgramById(programId),
          getProgramSubjects(programId),
          getPrerequisitesForProgram(programId),
          getCorequisitesForProgram(programId),
          getSubjectStatuses(),
          getPlannedSubjects(),
        ]);

      setActiveProgram(program);
      setSubjects(programSubjects);
      setSubjectStatuses(statuses);
      setAllPlannedSubjects(plannedList);

      const mappedSubjects = programSubjects.map((subjectDetail) => ({
        id: subjectDetail.subjectId,
        subjectCode: subjectDetail.subjectCode,
        subjectName: subjectDetail.subjectName,
        units: subjectDetail.units,
        yearLevel: subjectDetail.yearLevel,
        term: subjectDetail.term,
      }));

      const evaluationResults = evaluateEligibility({
        subjects: mappedSubjects,
        prerequisites: programPrerequisites,
        corequisites: programCorequisites,
        subjectStatuses: statuses,
        plannedSubjects: plannedList,
        targetPlanningTerm:
          plannedYear && plannedTermNumber !== undefined
            ? { plannedSchoolYear: plannedYear, plannedTerm: plannedTermNumber }
            : undefined,
      });

      setEligibilityMap(evaluationResults);
    } catch (error) {
      console.error('Failed to calculate eligibility', error);
    } finally {
      setLoading(false);
    }
  }, [plannedYear, plannedTermNumber]);

  useEffect(() => {
    calculateEligibility();
  }, [calculateEligibility]);

  const subjectStatusesMap = useMemo(() => {
    const statusesMap = new Map<number, SubjectStatusView>();
    for (const statusView of subjectStatuses) {
      statusesMap.set(statusView.subjectId, statusView);
    }
    return statusesMap;
  }, [subjectStatuses]);

  const plannedSubjectIdsForTargetTerm = useMemo(() => {
    const plannedSet = new Set<number>();
    if (plannedYear && plannedTermNumber !== undefined) {
      for (const plannedSubject of allPlannedSubjects) {
        if (
          plannedSubject.plannedSchoolYear === plannedYear &&
          plannedSubject.plannedTerm === plannedTermNumber
        ) {
          plannedSet.add(plannedSubject.subjectId);
        }
      }
    }
    return plannedSet;
  }, [allPlannedSubjects, plannedYear, plannedTermNumber]);

  const planSubject = async (subjectId: number) => {
    if (!plannedYear || plannedTermNumber === undefined) return;
    await addPlannedSubject({
      subjectId,
      plannedSchoolYear: plannedYear,
      plannedTerm: plannedTermNumber,
    });
    await calculateEligibility();
  };

  const unplanSubject = async (subjectId: number) => {
    if (!plannedYear || plannedTermNumber === undefined) return;
    await removePlannedSubjectBySubjectAndTerm({
      subjectId,
      plannedSchoolYear: plannedYear,
      plannedTerm: plannedTermNumber,
    });
    await calculateEligibility();
  };

  const planAllEligible = async (subjectIds: number[]) => {
    if (!plannedYear || plannedTermNumber === undefined) return;
    for (const subjectId of subjectIds) {
      await addPlannedSubject({
        subjectId,
        plannedSchoolYear: plannedYear,
        plannedTerm: plannedTermNumber,
      });
    }
    await calculateEligibility();
  };

  const recordGrade = async (
    subjectId: number,
    grade: number,
    schoolYear?: string,
    term?: number
  ) => {
    await recordSubjectAttempt({
      subjectId,
      grade,
      schoolYear: schoolYear ?? plannedYear,
      termTaken: term ?? plannedTermNumber,
    });
    await calculateEligibility();
  };

  return {
    loading,
    eligibilityMap,
    subjects,
    activeProgram,
    subjectStatusesMap,
    allPlannedSubjects,
    plannedSubjectIds: plannedSubjectIdsForTargetTerm,
    refreshEligibility: calculateEligibility,
    planSubject,
    unplanSubject,
    planAllEligible,
    recordGrade,
  };
}

