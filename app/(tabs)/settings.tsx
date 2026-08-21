import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { clearAllPlannedSubjects } from '@/db/queries/plannedSubjects';
import { clearAllCompletedSubjects } from '@/db/queries/completedSubjects';
import { seedBundledCurricula } from '@/db/queries/seedCurricula';
import {
  BookOpen,
  RotateCcw,
  Trash2,
  Database,
  Info,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

export default function SettingsScreen() {
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
      const seedResult = await seedBundledCurricula(true);
      const failedImports = seedResult.imported.filter((result) => !result.success);
      if (failedImports.length > 0) {
        Alert.alert(
          'Partial Import',
          `Some curricula failed to re-import (${failedImports.length}). Check the console for details.`
        );
        return;
      }
      Alert.alert(
        'Success',
        `Re-imported ${seedResult.imported.length} bundled prospectus version(s).`
      );
    } catch (err) {
      console.error('Failed to reimport curriculum', err);
      Alert.alert('Error', 'Failed to re-import curriculum.');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Student Profile & Data Management</Text>
      </View>

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
            <Text style={styles.actionTitle}>Re-import Bundled Curricula</Text>
            <Text style={styles.actionSubtitle}>
              Restore all prospectus versions under data/ (e.g. BSIT 2023 & 2024-2025)
            </Text>
          </View>
        </TouchableOpacity>
      </View>

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
    </ScreenContainer>
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
