import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  getAllPrograms,
  getStudentProfile,
  updateStudentProfile,
} from '@/db/queries/programs';
import {
  getProgramSubjects,
  getPrerequisitesForProgram,
  getCorequisitesForProgram,
  ProgramSubjectDetail,
} from '@/db/queries/subjects';
import { Program, Prerequisite, Corequisite } from '@/types/database';
import { TERMS } from '@/constants/grades';
import {
  CheckCircle,
  GitBranch,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [curriculumSubjects, setCurriculumSubjects] = useState<ProgramSubjectDetail[]>([]);
  const [prereqs, setPrereqs] = useState<Prerequisite[]>([]);
  const [coreqs, setCoreqs] = useState<Corequisite[]>([]);

  const [selectedTerm, setSelectedTerm] = useState<number | 'all'>('all');

  const loadCoursesScreenData = async () => {
    try {
      setLoading(true);
      const allPrograms = await getAllPrograms();
      setPrograms(allPrograms);

      const profile = await getStudentProfile();
      const currentProgram =
        allPrograms.find((program) => program.id === profile?.programId) || allPrograms[0] || null;
      setActiveProgram(currentProgram);

      if (currentProgram) {
        const [subjects, prerequisites, corequisites] = await Promise.all([
          getProgramSubjects(currentProgram.id),
          getPrerequisitesForProgram(currentProgram.id),
          getCorequisitesForProgram(currentProgram.id),
        ]);
        setCurriculumSubjects(subjects);
        setPrereqs(prerequisites);
        setCoreqs(corequisites);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoursesScreenData();
  }, []);

  const handleSelectProgram = async (selectedProgram: Program) => {
    try {
      await updateStudentProfile(selectedProgram.id, 1);
      setActiveProgram(selectedProgram);
      const [subjects, prerequisites, corequisites] = await Promise.all([
        getProgramSubjects(selectedProgram.id),
        getPrerequisitesForProgram(selectedProgram.id),
        getCorequisitesForProgram(selectedProgram.id),
      ]);
      setCurriculumSubjects(subjects);
      setPrereqs(prerequisites);
      setCoreqs(corequisites);
      Alert.alert(
        'Curriculum Switched',
        `Active curriculum set to ${selectedProgram.programCode} (${selectedProgram.curriculumVersion}).`
      );
    } catch (err) {
      console.error('Failed to switch program', err);
      Alert.alert('Error', 'Failed to switch program.');
    }
  };

  const subjectCodeById = useMemo(() => {
    const map = new Map<number, string>();
    for (const subject of curriculumSubjects) {
      map.set(subject.subjectId, subject.subjectCode);
    }
    return map;
  }, [curriculumSubjects]);

  const prerequisiteCodesBySubjectId = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const prereq of prereqs) {
      const codes = map.get(prereq.subjectId) || [];
      codes.push(subjectCodeById.get(prereq.prerequisiteSubjectId) || `Subject #${prereq.prerequisiteSubjectId}`);
      map.set(prereq.subjectId, codes);
    }
    return map;
  }, [prereqs, subjectCodeById]);

  const corequisiteCodesBySubjectId = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const coreq of coreqs) {
      const codes = map.get(coreq.subjectId) || [];
      codes.push(subjectCodeById.get(coreq.corequisiteSubjectId) || `Subject #${coreq.corequisiteSubjectId}`);
      map.set(coreq.subjectId, codes);
    }
    return map;
  }, [coreqs, subjectCodeById]);

  const filteredSubjects = useMemo(() => {
    return curriculumSubjects.filter((subject) => {
      const termMatch = selectedTerm === 'all' || subject.term === selectedTerm;
      return termMatch;
    });
  }, [curriculumSubjects, selectedTerm]);

  const totalUnits = useMemo(() => {
    return curriculumSubjects.reduce((sum, subject) => sum + subject.units, 0);
  }, [curriculumSubjects]);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>Curriculum & Courses</Text>
            {activeProgram && (
              <Text style={styles.subtitle}>
                {activeProgram.programName} ({activeProgram.curriculumVersion})
              </Text>
            )}
          </View>
        </View>

        {programs.length > 0 && (
          <View style={styles.curriculumSection}>
            <View style={styles.curriculumSectionHeader}>
              <Layers size={18} color="#0284c7" />
              <Text style={styles.curriculumSectionTitle}>Curriculum</Text>
            </View>
            <Text style={styles.curriculumHint}>Select the curriculum you are following.</Text>
            {programs.map((program) => {
              const isActive = activeProgram?.id === program.id;
              return (
                <TouchableOpacity
                  key={program.id}
                  style={[styles.curriculumCard, isActive && styles.curriculumCardActive]}
                  onPress={() => handleSelectProgram(program)}>
                  <View style={styles.curriculumInfo}>
                    <Text style={styles.curriculumCode}>
                      {program.programCode} · {program.curriculumVersion}
                    </Text>
                    <Text style={styles.curriculumName}>{program.programName}</Text>
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
        )}

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, selectedTerm === 'all' && styles.chipActive]}
            onPress={() => setSelectedTerm('all')}>
            <Text style={[styles.chipText, selectedTerm === 'all' && styles.chipTextActive]}>
              All Terms
            </Text>
          </TouchableOpacity>
          {TERMS.slice(0, 2).map((termOption) => (
            <TouchableOpacity
              key={termOption.id}
              style={[styles.chip, selectedTerm === termOption.id && styles.chipActive]}
              onPress={() => setSelectedTerm(termOption.id)}>
              <Text style={[styles.chipText, selectedTerm === termOption.id && styles.chipTextActive]}>
                {termOption.shortLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsBanner}>
          <Text style={styles.statsBannerText}>
            Showing <Text style={styles.bold}>{filteredSubjects.length}</Text> of{' '}
            <Text style={styles.bold}>{curriculumSubjects.length}</Text> subjects •{' '}
            <Text style={styles.bold}>{totalUnits} Total Units</Text>
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={(item) => item.subjectId.toString()}
          renderItem={({ item }) => {
            const subjectPrerequisiteCodes = prerequisiteCodesBySubjectId.get(item.subjectId) || [];
            const subjectCorequisiteCodes = corequisiteCodesBySubjectId.get(item.subjectId) || [];

            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.code}>{item.subjectCode}</Text>
                  <View style={styles.metaBadge}>
                    <Text style={styles.badgeText}>
                      Year {item.yearLevel} • Term {item.term}
                    </Text>
                  </View>
                </View>

                <Text style={styles.name}>{item.subjectName}</Text>
                <Text style={styles.units}>{item.units} Units</Text>

                {(subjectPrerequisiteCodes.length > 0 || subjectCorequisiteCodes.length > 0) && (
                  <View style={styles.reqsBox}>
                    {subjectPrerequisiteCodes.length > 0 && (
                      <View style={styles.reqRow}>
                        <GitBranch size={12} color="#dc2626" />
                        <Text style={styles.reqLabel}>Prereq:</Text>
                        <Text style={styles.reqVal}>{subjectPrerequisiteCodes.join(', ')}</Text>
                      </View>
                    )}
                    {subjectCorequisiteCodes.length > 0 && (
                      <View style={styles.reqRow}>
                        <Layers size={12} color="#d97706" />
                        <Text style={styles.reqLabel}>Co-req:</Text>
                        <Text style={styles.reqVal}>{subjectCorequisiteCodes.join(', ')}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No subjects found matching the filter.</Text>
            </View>
          }
        />
      )}
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
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  curriculumSection: {
    marginBottom: 10,
  },
  curriculumSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  curriculumSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  curriculumHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  curriculumCard: {
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
  curriculumCardActive: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  curriculumInfo: {
    flex: 1,
  },
  curriculumCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  curriculumName: {
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
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  statsBanner: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statsBannerText: {
    fontSize: 12,
    color: '#64748b',
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  listContent: {
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 14,
    marginVertical: 5,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  metaBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  name: {
    fontSize: 14,
    color: '#334155',
    marginTop: 4,
    fontWeight: '500',
  },
  units: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  reqsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  reqVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});
