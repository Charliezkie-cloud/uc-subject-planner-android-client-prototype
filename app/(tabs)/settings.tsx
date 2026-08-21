import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getAllPrograms, getStudentProfile, updateStudentProfile } from '@/db/queries/programs';
import { Program } from '@/types/database';

export default function SettingsScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<number | null>(null);

  const loadSettings = async () => {
    try {
      const all = await getAllPrograms();
      setPrograms(all);
      const profile = await getStudentProfile();
      setActiveProgramId(profile?.programId ?? (all[0]?.id || null));
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSelectProgram = async (programId: number) => {
    try {
      await updateStudentProfile(programId, 1);
      setActiveProgramId(programId);
      Alert.alert('Curriculum Switched', 'Active program updated.');
    } catch (err) {
      console.error('Failed to update program', err);
      Alert.alert('Error', 'Failed to update program.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Curriculum and Student Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Curriculum</Text>
        {programs.map((prog) => (
          <TouchableOpacity
            key={prog.id}
            style={[
              styles.programCard,
              activeProgramId === prog.id && styles.activeCard,
            ]}
            onPress={() => handleSelectProgram(prog.id)}>
            <View>
              <Text style={styles.progCode}>
                {prog.programCode} - {prog.curriculumVersion}
              </Text>
              <Text style={styles.progName}>{prog.programName}</Text>
            </View>
            {activeProgramId === prog.id && (
              <Text style={styles.activeBadge}>Active</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About App</Text>
        <Text style={styles.aboutText}>
          University of Cebu - Banilad Subject Eligibility Planner{'\n'}
          Offline-first architecture • Single local profile
        </Text>
      </View>
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
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  programCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeCard: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  progCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  progName: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  aboutText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
