import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useCompletedSubjects } from '@/hooks/useCompletedSubjects';
import { formatGrade } from '@/features/grades/gradeUtils';

export default function SubjectsScreen() {
  const { loading, completedSubjects } = useCompletedSubjects();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Completed Subjects & Grades</Text>
        <Text style={styles.subtitle}>
          Record of completed courses and academic history
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={completedSubjects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.rowCard}>
              <View style={styles.infoCol}>
                <Text style={styles.code}>{item.subjectCode}</Text>
                <Text style={styles.name}>{item.subjectName}</Text>
                <Text style={styles.attempt}>Attempt #{item.attemptNumber}</Text>
              </View>
              <View style={styles.gradeCol}>
                <Text
                  style={[
                    styles.grade,
                    item.status === 'passed' ? styles.gradePassed : styles.gradeFailed,
                  ]}>
                  {formatGrade(item.grade)}
                </Text>
                <Text
                  style={[
                    styles.statusTag,
                    item.status === 'passed' ? styles.statusPassed : styles.statusFailed,
                  ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No completed subjects recorded yet.</Text>
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
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoCol: {
    flex: 1,
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  name: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  attempt: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  gradeCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  grade: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gradePassed: {
    color: '#15803d',
  },
  gradeFailed: {
    color: '#b91c1c',
  },
  statusTag: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusPassed: {
    color: '#15803d',
  },
  statusFailed: {
    color: '#b91c1c',
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
