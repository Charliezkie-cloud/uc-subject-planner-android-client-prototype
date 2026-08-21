import { useState, useEffect, useCallback } from 'react';
import {
  getCompletedSubjects,
  recordSubjectAttempt,
  deleteCompletedSubject,
  CompletedSubjectDetail,
} from '@/db/queries/completedSubjects';
import { getProgramSubjects, ProgramSubjectDetail } from '@/db/queries/subjects';
import { getStudentProfile, getProgramById } from '@/db/queries/programs';
import { Program } from '@/types/database';

export function useCompletedSubjects() {
  const [loading, setLoading] = useState(true);
  const [completedSubjects, setCompletedSubjects] = useState<CompletedSubjectDetail[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<ProgramSubjectDetail[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    try {
      const [data, profile] = await Promise.all([
        getCompletedSubjects(),
        getStudentProfile(),
      ]);
      setCompletedSubjects(data);

      if (profile?.programId) {
        const [prog, subj] = await Promise.all([
          getProgramById(profile.programId),
          getProgramSubjects(profile.programId),
        ]);
        setActiveProgram(prog);
        setAvailableSubjects(subj);
      }
    } catch (err) {
      console.error('Failed to fetch completed subjects', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const addAttempt = async (params: {
    subjectId: number;
    grade: number;
    schoolYear?: string | null;
    termTaken?: number | null;
  }) => {
    await recordSubjectAttempt(params);
    await fetchCompleted();
  };

  const removeAttempt = async (id: number) => {
    await deleteCompletedSubject(id);
    await fetchCompleted();
  };

  return {
    loading,
    completedSubjects,
    availableSubjects,
    activeProgram,
    refreshCompleted: fetchCompleted,
    addAttempt,
    removeAttempt,
  };
}

