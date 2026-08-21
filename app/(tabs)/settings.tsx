import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {
  getAllPrograms,
  getStudentProfile,
  updateStudentProfile,
} from '@/db/queries/programs';
import { clearAllPlannedSubjects } from '@/db/queries/plannedSubjects';
import { clearAllCompletedSubjects } from '@/db/queries/completedSubjects';
import { importCurriculumPackage } from '@/db/queries/curriculumImport';
import bsit2023Data from '../../data/curricula/bsit-2023.json';
import { Program } from '@/types/database';
import {
  BookOpen,
  CheckCircle,
  RotateCcw,
  Trash2,
  Database,
  Info,
  Layers,
} from 'lucide-react-native';

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

  const handleClearPlan = () => {
    Alert.alert(
      'Clear Planned Subjects',
      'Are you sure you want to remove all planned subjects from your timeline?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Planned',
          style: 'destructive',
          onPress: async () => {
            await clearAllPlannedSubjects();
            Alert.alert('Success', 'All planned subjects have been cleared.');
          },
        },
      ]
    );
  };

  const handleClearGrades = () => {
    Alert.alert(
      'Reset All Grades',
      'Are you sure you want to reset all completed subject grades? This will clear all academic records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Grades',
          style: 'destructive',
          onPress: async () => {
            await clearAllCompletedSubjects();
            Alert.alert('Success', 'All completed grades have been reset.');
          },
        },
      ]
    );
  };

  const handleReimportCurriculum = async () => {
    try {
      await importCurriculumPackage(bsit2023Data, 'bsit-2023.json');
      await loadSettings();
      Alert.alert('Success', 'BSIT 2023 Curriculum successfully re-imported.');
    } catch (err) {
      console.error('Failed to reimport curriculum', err);
      Alert.alert('Error', 'Failed to re-import curriculum.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Curriculum, Student Profile & Data Management</Text>
      </View>

      {/* Active Curriculum Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Layers size={18} color="#0284c7" />
          <Text style={styles.sectionTitle}>Active Curriculum</Text>
        </View>
        {programs.map((prog) => {
          const isActive = activeProgramId === prog.id;
          return (
            <TouchableOpacity
              key={prog.id}
              style={[styles.programCard, isActive && styles.activeCard]}
              onPress={() => handleSelectProgram(prog.id)}>
              <View style={styles.programInfo}>
                <Text style={styles.progCode}>
                  {prog.programCode} - {prog.curriculumVersion}
                </Text>
                <Text style={styles.progName}>{prog.programName}</Text>
              </View>
              {isActive && (
                <View style={styles.activeBadgeContainer}>
                  <CheckCircle size={14} color="#0284c7" />
                  <Text style={styles.activeBadge}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Database size={18} color="#0284c7" />
          <Text style={styles.sectionTitle}>Data Management</Text>
        </View>

        <TouchableOpacity style={styles.actionCard} onPress={handleClearPlan}>
          <View style={styles.actionIconBox}>
            <RotateCcw size={18} color="#d97706" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Clear Planned Subjects</Text>
            <Text style={styles.actionSubtitle}>Remove all plotted subjects from terms</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleClearGrades}>
          <View style={styles.actionIconBox}>
            <Trash2 size={18} color="#dc2626" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Reset All Recorded Grades</Text>
            <Text style={styles.actionSubtitle}>Clear completed grades and attempts</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleReimportCurriculum}>
          <View style={styles.actionIconBox}>
            <BookOpen size={18} color="#0284c7" />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Re-import Bundled Curriculum</Text>
            <Text style={styles.actionSubtitle}>Restore original BSIT 2023 syllabus rules</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={[styles.section, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Info size={18} color="#0284c7" />
          <Text style={styles.sectionTitle}>About App</Text>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>University of Cebu - Banilad</Text>
          <Text style={styles.aboutSub}>Subject Eligibility & Prospectus Planner</Text>
          <Text style={styles.aboutText}>
            • 100% Offline SQLite Architecture{'\n'}
            • Pure Rule Evaluation Engine (Prerequisites & Co-requisites){'\n'}
            • Standard Philippine Grading Scale (1.00 – 5.00)
          </Text>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  programCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
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
  programInfo: {
    flex: 1,
  },
  progCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  progName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  activeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    gap: 12,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  aboutSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    marginTop: 2,
  },
  aboutText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 8,
  },
});
