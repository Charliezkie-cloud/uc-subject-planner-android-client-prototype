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

  const fetchCompletedSubjects = useCallback(async () => {
    setLoading(true);
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
      }
    } catch (error) {
      console.error('Failed to fetch completed subjects', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedSubjects();
  }, [fetchCompletedSubjects]);

  const addAttempt = async (subjectAttempt: {
    subjectId: number;
    grade: number;
    schoolYear?: string | null;
    termTaken?: number | null;
  }) => {
    await recordSubjectAttempt(subjectAttempt);
    await fetchCompletedSubjects();
  };

  const removeAttempt = async (completedSubjectId: number) => {
    await deleteCompletedSubject(completedSubjectId);
    await fetchCompletedSubjects();
  };

  return {
    loading,
    completedSubjects,
    availableSubjects,
    activeProgram,
    refreshCompleted: fetchCompletedSubjects,
    addAttempt,
    removeAttempt,
  };
}


