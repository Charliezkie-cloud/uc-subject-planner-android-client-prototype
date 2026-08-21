import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getAllPrograms, getStudentProfile } from '@/db/queries/programs';
import { getProgramSubjects, ProgramSubjectDetail } from '@/db/queries/subjects';
import { Program } from '@/types/database';

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [curriculumSubjects, setCurriculumSubjects] = useState<ProgramSubjectDetail[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const allProgs = await getAllPrograms();
        const profile = await getStudentProfile();

        const currentProg =
          allProgs.find((p) => p.id === profile?.programId) || allProgs[0] || null;
        setActiveProgram(currentProg);

        if (currentProg) {
          const subjects = await getProgramSubjects(currentProg.id);
          setCurriculumSubjects(subjects);
        }
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Courses & Curriculum</Text>
        {activeProgram && (
          <Text style={styles.subtitle}>
            {activeProgram.programCode} ({activeProgram.curriculumVersion}) •{' '}
            {activeProgram.programName}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={curriculumSubjects}
          keyExtractor={(item) => item.subjectId.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.code}>{item.subjectCode}</Text>
                <Text style={styles.badge}>
                  Yr {item.yearLevel} - Term {item.term}
                </Text>
              </View>
              <Text style={styles.name}>{item.subjectName}</Text>
              <Text style={styles.units}>{item.units} Units</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No subjects found in curriculum.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  listContent: {
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  name: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  units: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
  },
});
