import { useState, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getProgramSubjects,
  getPrerequisitesForProgram,
  getCorequisitesForProgram,
  getYearRangePrerequisitesForProgram,
  ProgramSubjectDetail,
} from '@/db/queries/subjects';
import { getSubjectStatuses, recordSubjectAttempt } from '@/db/queries/completedSubjects';
import {
  getPlannedSubjects,
  addPlannedSubject,
  removePlannedSubjectBySubjectAndTerm,
  relocatePlannedSubjectToTerm,
  PlannedSubjectDetail,
} from '@/db/queries/plannedSubjects';
import { getStudentProfile, getProgramById } from '@/db/queries/programs';
import { evaluateEligibility } from '@/features/eligibility/eligibility';
import { SubjectEligibilityResult } from '@/features/eligibility/types';
import { Program, Prerequisite, Corequisite, YearRangePrerequisite, SubjectStatusView } from '@/types/database';

type RefreshMode = 'full' | 'soft';

export function useEligibility(targetTerm?: { plannedSchoolYear: string; plannedTerm: number }) {
  const [loading, setLoading] = useState(true);
  const [eligibilityMap, setEligibilityMap] = useState<Map<number, SubjectEligibilityResult>>(new Map());
  const [subjects, setSubjects] = useState<ProgramSubjectDetail[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [subjectStatuses, setSubjectStatuses] = useState<SubjectStatusView[]>([]);
  const [allPlannedSubjects, setAllPlannedSubjects] = useState<PlannedSubjectDetail[]>([]);

  // Cached curriculum graph — reused on soft refreshes so the subject list identity stays stable.
  const prerequisitesRef = useRef<Prerequisite[]>([]);
  const corequisitesRef = useRef<Corequisite[]>([]);
  const yearRangePrerequisitesRef = useRef<YearRangePrerequisite[]>([]);
  const subjectsRef = useRef<ProgramSubjectDetail[]>([]);
  const activeProgramIdRef = useRef<number | null>(null);

  const plannedYear = targetTerm?.plannedSchoolYear;
  const plannedTermNumber = targetTerm?.plannedTerm;

  const applyEligibilityEvaluation = useCallback(
    (
      programSubjects: ProgramSubjectDetail[],
      statuses: SubjectStatusView[],
      plannedList: PlannedSubjectDetail[]
    ) => {
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
        prerequisites: prerequisitesRef.current,
        corequisites: corequisitesRef.current,
        yearRangePrerequisites: yearRangePrerequisitesRef.current,
        subjectStatuses: statuses,
        plannedSubjects: plannedList,
        targetPlanningTerm:
          plannedYear && plannedTermNumber !== undefined
            ? { plannedSchoolYear: plannedYear, plannedTerm: plannedTermNumber }
            : undefined,
      });

      setEligibilityMap(evaluationResults);
    },
    [plannedYear, plannedTermNumber]
  );

  const calculateEligibility = useCallback(
    async (mode: RefreshMode = 'full') => {
      const studentProfile = await getStudentProfile();
      const currentProgramId = studentProfile?.programId ?? null;
      const hasProgramChanged = currentProgramId !== activeProgramIdRef.current;
      const isSoftRefresh = mode === 'soft' && !hasProgramChanged && subjectsRef.current.length > 0;

      if (!isSoftRefresh) {
        setLoading(true);
      }

      try {
        if (!currentProgramId) {
          activeProgramIdRef.current = null;
          setEligibilityMap(new Map());
          setSubjects([]);
          subjectsRef.current = [];
          setActiveProgram(null);
          setSubjectStatuses([]);
          setAllPlannedSubjects([]);
          prerequisitesRef.current = [];
          corequisitesRef.current = [];
          yearRangePrerequisitesRef.current = [];
          return;
        }

        if (isSoftRefresh) {
          const [statuses, plannedList] = await Promise.all([
            getSubjectStatuses(),
            getPlannedSubjects(),
          ]);

          setSubjectStatuses(statuses);
          setAllPlannedSubjects(plannedList);
          applyEligibilityEvaluation(subjectsRef.current, statuses, plannedList);
          return;
        }

        const [
          program,
          programSubjects,
          programPrerequisites,
          programCorequisites,
          programYearRangePrerequisites,
          statuses,
          plannedList,
        ] = await Promise.all([
          getProgramById(currentProgramId),
          getProgramSubjects(currentProgramId),
          getPrerequisitesForProgram(currentProgramId),
          getCorequisitesForProgram(currentProgramId),
          getYearRangePrerequisitesForProgram(currentProgramId),
          getSubjectStatuses(),
          getPlannedSubjects(),
        ]);

        activeProgramIdRef.current = currentProgramId;
        prerequisitesRef.current = programPrerequisites;
        corequisitesRef.current = programCorequisites;
        yearRangePrerequisitesRef.current = programYearRangePrerequisites;
        subjectsRef.current = programSubjects;

        setActiveProgram(program);
        setSubjects(programSubjects);
        setSubjectStatuses(statuses);
        setAllPlannedSubjects(plannedList);
        applyEligibilityEvaluation(programSubjects, statuses, plannedList);
      } catch (error) {
        console.error('Failed to calculate eligibility', error);
      } finally {
        if (!isSoftRefresh) {
          setLoading(false);
        }
      }
    },
    [applyEligibilityEvaluation]
  );

  // Soft-refresh on term change and whenever Plan regains focus (e.g. after Courses/Subjects edits).
  useFocusEffect(
    useCallback(() => {
      void calculateEligibility('soft');
    }, [calculateEligibility])
  );

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

  /** One plan placement per subject (latest row wins if duplicates exist). */
  const plannedTermBySubjectId = useMemo(() => {
    const locationMap = new Map<
      number,
      { plannedSchoolYear: string; plannedTerm: number }
    >();
    for (const plannedSubject of allPlannedSubjects) {
      locationMap.set(plannedSubject.subjectId, {
        plannedSchoolYear: plannedSubject.plannedSchoolYear,
        plannedTerm: plannedSubject.plannedTerm,
      });
    }
    return locationMap;
  }, [allPlannedSubjects]);

  const planSubject = async (subjectId: number) => {
    if (!plannedYear || plannedTermNumber === undefined) return;
    await addPlannedSubject({
      subjectId,
      plannedSchoolYear: plannedYear,
      plannedTerm: plannedTermNumber,
    });
    await calculateEligibility('soft');
  };

  const unplanSubject = async (subjectId: number) => {
    if (!plannedYear || plannedTermNumber === undefined) return;
    await removePlannedSubjectBySubjectAndTerm({
      subjectId,
      plannedSchoolYear: plannedYear,
      plannedTerm: plannedTermNumber,
    });
    await calculateEligibility('soft');
  };

  const movePlannedSubjectToTerm = async (
    subjectId: number,
    destination: { plannedSchoolYear: string; plannedTerm: number }
  ) => {
    await relocatePlannedSubjectToTerm({
      subjectId,
      toSchoolYear: destination.plannedSchoolYear,
      toTerm: destination.plannedTerm,
    });
    await calculateEligibility('soft');
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
    await calculateEligibility('soft');
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
    await calculateEligibility('soft');
  };

  return {
    loading,
    eligibilityMap,
    subjects,
    activeProgram,
    subjectStatusesMap,
    allPlannedSubjects,
    plannedSubjectIds: plannedSubjectIdsForTargetTerm,
    plannedTermBySubjectId,
    refreshEligibility: () => calculateEligibility('full'),
    planSubject,
    unplanSubject,
    movePlannedSubjectToTerm,
    planAllEligible,
    recordGrade,
  };
}
