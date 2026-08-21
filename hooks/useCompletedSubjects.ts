import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCompletedSubjects,
  recordSubjectAttempt,
  updateCompletedSubjectAttempt,
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
  const hasLoadedOnceRef = useRef(false);

  const fetchCompletedSubjects = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? !hasLoadedOnceRef.current;
    if (showLoading) {
      setLoading(true);
    }

    try {
      const [completedRecords, studentProfile] = await Promise.all([
        getCompletedSubjects(),
        getStudentProfile(),
      ]);
      setCompletedSubjects(completedRecords);

      if (studentProfile?.programId) {
        const [program, programSubjects] = await Promise.all([
          getProgramById(studentProfile.programId),
          getProgramSubjects(studentProfile.programId),
        ]);
        setActiveProgram(program);
        setAvailableSubjects(programSubjects);
      } else {
        setActiveProgram(null);
        setAvailableSubjects([]);
      }

      hasLoadedOnceRef.current = true;
    } catch (error) {
      console.error('Failed to fetch completed subjects', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Re-read when the tab gains focus so grades entered on Plan appear here.
  useFocusEffect(
    useCallback(() => {
      void fetchCompletedSubjects({ showLoading: !hasLoadedOnceRef.current });
    }, [fetchCompletedSubjects])
  );

  const addAttempt = async (subjectAttempt: {
    subjectId: number;
    grade: number;
    schoolYear?: string | null;
    termTaken?: number | null;
  }) => {
    await recordSubjectAttempt(subjectAttempt);
    await fetchCompletedSubjects({ showLoading: false });
  };

  const updateAttempt = async (
    completedSubjectId: number,
    updates: {
      grade: number;
      schoolYear?: string | null;
      termTaken?: number | null;
    }
  ) => {
    await updateCompletedSubjectAttempt(completedSubjectId, updates);
    await fetchCompletedSubjects({ showLoading: false });
  };

  const removeAttempt = async (completedSubjectId: number) => {
    await deleteCompletedSubject(completedSubjectId);
    await fetchCompletedSubjects({ showLoading: false });
  };

  return {
    loading,
    completedSubjects,
    availableSubjects,
    activeProgram,
    refreshCompleted: fetchCompletedSubjects,
    addAttempt,
    updateAttempt,
    removeAttempt,
  };
}
