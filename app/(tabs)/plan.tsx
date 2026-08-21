import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useEligibility } from '@/hooks/useEligibility';
import { SubjectCard } from '@/components/SubjectCard';

export default function PlanScreen() {
  const [selectedTerm] = useState({
    plannedSchoolYear: '2025-2026',
    plannedTerm: 1,
  });

  const { loading, subjects, eligibilityMap } = useEligibility(selectedTerm);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subject Planner</Text>
        <Text style={styles.subtitle}>
          Target: {selectedTerm.plannedSchoolYear} • Term {selectedTerm.plannedTerm}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.subjectId.toString()}
          renderItem={({ item }) => (
            <SubjectCard
              subjectCode={item.subjectCode}
              subjectName={item.subjectName}
              units={item.units}
              eligibility={eligibilityMap.get(item.subjectId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No curriculum subjects loaded.</Text>
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
