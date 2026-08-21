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

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getStudentProfile();
      if (!profile || !profile.programId) {
        setEligibilityMap(new Map());
        setSubjects([]);
        setActiveProgram(null);
        setSubjectStatuses([]);
        setAllPlannedSubjects([]);
        setLoading(false);
        return;
      }

      const programId = profile.programId;
      const [prog, progSubjects, prereqs, coreqs, statuses, planned] = await Promise.all([
        getProgramById(programId),
        getProgramSubjects(programId),
        getPrerequisitesForProgram(programId),
        getCorequisitesForProgram(programId),
        getSubjectStatuses(),
        getPlannedSubjects(),
      ]);

      setActiveProgram(prog);
      setSubjects(progSubjects);
      setSubjectStatuses(statuses);
      setAllPlannedSubjects(planned);

      const mappedSubjects = progSubjects.map((s) => ({
        id: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        units: s.units,
        yearLevel: s.yearLevel,
        term: s.term,
      }));

      const results = evaluateEligibility({
        subjects: mappedSubjects,
        prerequisites: prereqs,
        corequisites: coreqs,
        subjectStatuses: statuses,
        plannedSubjects: planned,
        targetPlanningTerm:
          plannedYear && plannedTermNumber !== undefined
            ? { plannedSchoolYear: plannedYear, plannedTerm: plannedTermNumber }
            : undefined,
      });

      setEligibilityMap(results);
    } catch (err) {
      console.error('Failed to calculate eligibility', err);
    } finally {
      setLoading(false);
    }
  }, [plannedYear, plannedTermNumber]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const subjectStatusesMap = useMemo(() => {
    const map = new Map<number, SubjectStatusView>();
    for (const st of subjectStatuses) {
      map.set(st.subjectId, st);
    }
    return map;
  }, [subjectStatuses]);

  const plannedSubjectIdsForTargetTerm = useMemo(() => {
    const set = new Set<number>();
    if (plannedYear && plannedTermNumber !== undefined) {
      for (const p of allPlannedSubjects) {
        if (p.plannedSchoolYear === plannedYear && p.plannedTerm === plannedTermNumber) {
          set.add(p.subjectId);
        }
      }
    }
    return set;
  }, [allPlannedSubjects, plannedYear, plannedTermNumber]);

  const planSubject = async (subjectId: number) => {
    if (!plannedYear || plannedTermNumber === undefined) return;
    await addPlannedSubject({
      subjectId,
      plannedSchoolYear: plannedYear,
      plannedTerm: plannedTermNumber,
    });
    await calculate();
  };

  const unplanSubject = async (subjectId: number) => {
    if (!plannedYear || plannedTermNumber === undefined) return;
    await removePlannedSubjectBySubjectAndTerm({
      subjectId,
      plannedSchoolYear: plannedYear,
      plannedTerm: plannedTermNumber,
    });
    await calculate();
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
    await calculate();
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
    await calculate();
  };

  return {
    loading,
    eligibilityMap,
    subjects,
    activeProgram,
    subjectStatusesMap,
    allPlannedSubjects,
    plannedSubjectIds: plannedSubjectIdsForTargetTerm,
    refreshEligibility: calculate,
    planSubject,
    unplanSubject,
    planAllEligible,
    recordGrade,
  };
}

