import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getDatabase } from '@/db/client';
import { getAllPrograms, getStudentProfile, updateStudentProfile } from '@/db/queries/programs';
import { importCurriculumPackage } from '@/db/queries/curriculumImport';
import bsit2023Data from '../../data/curricula/bsit-2023.json';

interface DatabaseContextValue {
  isReady: boolean;
  error: Error | null;
  refreshDb: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isReady: false,
  error: null,
  refreshDb: async () => {},
});

export const useDatabase = () => useContext(DatabaseContext);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initDb = async () => {
    try {
      await getDatabase();
      const programs = await getAllPrograms();

      let currentPrograms = programs;
      // If database is empty, automatically seed the bundled BSIT 2023 curriculum
      if (currentPrograms.length === 0) {
        await importCurriculumPackage(bsit2023Data, 'bsit-2023.json');
        currentPrograms = await getAllPrograms();
      }

      const profile = await getStudentProfile();
      if (!profile && currentPrograms.length > 0) {
        await updateStudentProfile(currentPrograms[0].id, 1);
      }

      setIsReady(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Database initialization failed'));
    }
  };

  useEffect(() => {
    initDb();
  }, []);

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Database Initialization Error:</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Initializing Course Planner...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isReady, error, refreshDb: initDb }}>
      {children}
    </DatabaseContext.Provider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
