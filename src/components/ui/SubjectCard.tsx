import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EligibilityBadge } from './EligibilityBadge';
import { SubjectEligibilityResult } from '@/features/eligibility/types';

interface SubjectCardProps {
  subjectCode: string;
  subjectName: string;
  units: number;
  eligibility?: SubjectEligibilityResult;
}

export function SubjectCard({
  subjectCode,
  subjectName,
  units,
  eligibility,
}: SubjectCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.code}>{subjectCode}</Text>
          <Text style={styles.name}>{subjectName}</Text>
        </View>
        {eligibility && <EligibilityBadge status={eligibility.status} />}
      </View>
      <View style={styles.footer}>
        <Text style={styles.unitsText}>{units} Units</Text>
      </View>
      {eligibility && eligibility.status === 'not_eligible' && (
        <View style={styles.reasonsContainer}>
          {eligibility.missingPrerequisites.map((prereq) => (
            <Text key={prereq.subjectId} style={styles.missingText}>
              • Prereq missing: {prereq.subjectCode}
            </Text>
          ))}
          {eligibility.missingCorequisites.map((coreq) => (
            <Text key={coreq.subjectId} style={styles.missingText}>
              • Co-req missing: {coreq.subjectCode} (must plan in same term)
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    maxWidth: 220,
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  reasonsContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
  },
  missingText: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 2,
  },
});
