import { useState, useEffect, useCallback } from 'react';
import { getProgramSubjects, getPrerequisitesForProgram, getCorequisitesForProgram, ProgramSubjectDetail } from '@/db/queries/subjects';
import { getSubjectStatuses } from '@/db/queries/completedSubjects';
import { getPlannedSubjects } from '@/db/queries/plannedSubjects';
import { getStudentProfile } from '@/db/queries/programs';
import { evaluateEligibility } from '@/features/eligibility/eligibility';
import { SubjectEligibilityResult } from '@/features/eligibility/types';

export function useEligibility(targetTerm?: { plannedSchoolYear: string; plannedTerm: number }) {
  const [loading, setLoading] = useState(true);
  const [eligibilityMap, setEligibilityMap] = useState<Map<number, SubjectEligibilityResult>>(new Map());
  const [subjects, setSubjects] = useState<ProgramSubjectDetail[]>([]);

  const plannedYear = targetTerm?.plannedSchoolYear;
  const plannedTermNumber = targetTerm?.plannedTerm;

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getStudentProfile();
      if (!profile || !profile.programId) {
        setEligibilityMap(new Map());
        setSubjects([]);
        setLoading(false);
        return;
      }

      const programId = profile.programId;
      const [progSubjects, prereqs, coreqs, statuses, planned] = await Promise.all([
        getProgramSubjects(programId),
        getPrerequisitesForProgram(programId),
        getCorequisitesForProgram(programId),
        getSubjectStatuses(),
        getPlannedSubjects(),
      ]);

      setSubjects(progSubjects);

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

  return {
    loading,
    eligibilityMap,
    subjects,
    refreshEligibility: calculate,
  };
}
