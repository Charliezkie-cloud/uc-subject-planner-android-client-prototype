import { useState, useEffect, useCallback } from 'react';
import {
  getCompletedSubjects,
  recordSubjectAttempt,
  deleteCompletedSubject,
  CompletedSubjectDetail,
} from '@/db/queries/completedSubjects';

export function useCompletedSubjects() {
  const [loading, setLoading] = useState(true);
  const [completedSubjects, setCompletedSubjects] = useState<CompletedSubjectDetail[]>([]);

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompletedSubjects();
      setCompletedSubjects(data);
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
    refreshCompleted: fetchCompleted,
    addAttempt,
    removeAttempt,
  };
}
