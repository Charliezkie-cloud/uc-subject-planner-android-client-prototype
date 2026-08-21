import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useCompletedSubjects } from '@/hooks/useCompletedSubjects';
import { formatGrade } from '@/features/grades/gradeUtils';
import { GradeModal } from '@/components/GradeModal';
import { ProgramSubjectDetail } from '@/db/queries/subjects';
import {
  Plus,
  Trash2,
  Edit3,
  GraduationCap,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

type FilterType = 'all' | 'passed' | 'failed';

export default function SubjectsScreen() {
  const {
    loading,
    completedSubjects,
    availableSubjects,
    activeProgram,
    addAttempt,
    removeAttempt,
  } = useCompletedSubjects();

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectSubjectModalVisible, setSelectSubjectModalVisible] = useState(false);
  const [selectedSubjectForGrade, setSelectedSubjectForGrade] =
    useState<ProgramSubjectDetail | null>(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);

  // Edit attempt state
  const [editingAttempt, setEditingAttempt] = useState<{
    subjectCode: string;
    subjectName: string;
    subjectId: number;
    grade: number;
    schoolYear?: string | null;
    termTaken?: number | null;
  } | null>(null);

  // Calculate Academic Stats (GWA & Units)
  const stats = useMemo(() => {
    let totalWeightedGrade = 0;
    let totalUnitsGraded = 0;
    let passedUnits = 0;
    const passedSubjectIds = new Set<number>();

    for (const item of completedSubjects) {
      if (item.status === 'passed') {
        if (!passedSubjectIds.has(item.subjectId)) {
          passedUnits += item.units;
          passedSubjectIds.add(item.subjectId);
        }
      }
      totalWeightedGrade += item.grade * item.units;
      totalUnitsGraded += item.units;
    }

    const gwa = totalUnitsGraded > 0 ? totalWeightedGrade / totalUnitsGraded : null;

    return {
      gwa,
      passedUnits,
      totalAttempts: completedSubjects.length,
      passedCount: passedSubjectIds.size,
    };
  }, [completedSubjects]);

  // Filtered List
  const filteredList = useMemo(() => {
    if (filter === 'passed') return completedSubjects.filter((s) => s.status === 'passed');
    if (filter === 'failed') return completedSubjects.filter((s) => s.status === 'failed');
    return completedSubjects;
  }, [completedSubjects, filter]);

  const handleDeleteAttempt = (id: number, subjectCode: string) => {
    Alert.alert(
      'Delete Grade Record',
      `Are you sure you want to remove the grade attempt for ${subjectCode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeAttempt(id);
          },
        },
      ]
    );
  };

  const handlePickSubject = (subj: ProgramSubjectDetail) => {
    setSelectedSubjectForGrade(subj);
    setSelectSubjectModalVisible(false);
    setGradeModalVisible(true);
  };

  const handleEditAttempt = (item: (typeof completedSubjects)[0]) => {
    setEditingAttempt({
      subjectId: item.subjectId,
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      grade: item.grade,
      schoolYear: item.schoolYear,
      termTaken: item.termTaken,
    });
    setGradeModalVisible(true);
  };

  const handleSaveGrade = async (grade: number, schoolYear?: string, term?: number) => {
    const subjectId = selectedSubjectForGrade?.subjectId ?? editingAttempt?.subjectId;
    if (!subjectId) return;

    await addAttempt({
      subjectId,
      grade,
      schoolYear,
      termTaken: term,
    });

    setSelectedSubjectForGrade(null);
    setEditingAttempt(null);
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Academic Records</Text>
            <Text style={styles.subtitle}>
              {activeProgram
                ? `${activeProgram.programCode} (${activeProgram.curriculumVersion}) • Completed Subjects`
                : 'Completed Subjects & Grade History'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setSelectSubjectModalVisible(true)}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>Record Grade</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>GWA</Text>
            <Text style={styles.statValue}>
              {stats.gwa !== null ? formatGrade(stats.gwa) : '--'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Units Passed</Text>
            <Text style={styles.statValue}>{stats.passedUnits}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Subjects Passed</Text>
            <Text style={styles.statValue}>{stats.passedCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Attempts</Text>
            <Text style={styles.statValue}>{stats.totalAttempts}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All ({completedSubjects.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'passed' && styles.filterTabActive]}
            onPress={() => setFilter('passed')}>
            <CheckCircle size={13} color={filter === 'passed' ? '#15803d' : '#64748b'} />
            <Text style={[styles.filterText, filter === 'passed' && styles.filterTextActive]}>
              Passed Only
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'failed' && styles.filterTabActive]}
            onPress={() => setFilter('failed')}>
            <XCircle size={13} color={filter === 'failed' ? '#b91c1c' : '#64748b'} />
            <Text style={[styles.filterText, filter === 'failed' && styles.filterTextActive]}>
              Failed Attempts
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isPassed = item.status === 'passed';
            return (
              <View style={styles.rowCard}>
                <View style={styles.infoCol}>
                  <View style={styles.codeRow}>
                    <Text style={styles.code}>{item.subjectCode}</Text>
                    <Text style={styles.unitsBadge}>{item.units} Units</Text>
                  </View>
                  <Text style={styles.name}>{item.subjectName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Attempt #{item.attemptNumber}</Text>
                    {item.schoolYear && (
                      <Text style={styles.metaText}>• AY {item.schoolYear}</Text>
                    )}
                    {item.termTaken && (
                      <Text style={styles.metaText}>• Term {item.termTaken}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.gradeCol}>
                  <Text
                    style={[
                      styles.grade,
                      isPassed ? styles.gradePassed : styles.gradeFailed,
                    ]}>
                    {formatGrade(item.grade)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isPassed ? styles.statusBadgePassed : styles.statusBadgeFailed,
                    ]}>
                    <Text
                      style={[
                        styles.statusTag,
                        isPassed ? styles.statusTextPassed : styles.statusTextFailed,
                      ]}>
                      {isPassed ? 'PASSED' : 'FAILED'}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleEditAttempt(item)}
                      style={styles.iconBtn}>
                      <Edit3 size={15} color="#0284c7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAttempt(item.id, item.subjectCode)}
                      style={styles.iconBtn}>
                      <Trash2 size={15} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <GraduationCap size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Recorded Grades</Text>
              <Text style={styles.emptyText}>
                {'Tap "+ Record Grade" or grade subjects in the Planner to build your academic history.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={selectSubjectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectSubjectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.subjectPickerContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject to Grade</Text>
              <TouchableOpacity onPress={() => setSelectSubjectModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.subjectPickerList}>
              {availableSubjects.map((subject) => (
                <TouchableOpacity
                  key={subject.subjectId}
                  style={styles.subjectPickerItem}
                  onPress={() => handlePickSubject(subject)}>
                  <View>
                    <View style={styles.codeRow}>
                      <Text style={styles.pickerCode}>{subject.subjectCode}</Text>
                      <Text style={styles.pickerMeta}>
                        Year {subject.yearLevel} - Term {subject.term}
                      </Text>
                    </View>
                    <Text style={styles.pickerName}>{subject.subjectName}</Text>
                  </View>
                  <Text style={styles.pickerUnits}>{subject.units}u</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {(selectedSubjectForGrade || editingAttempt) && (
        <GradeModal
          visible={gradeModalVisible}
          subjectCode={selectedSubjectForGrade?.subjectCode ?? editingAttempt?.subjectCode ?? ''}
          subjectName={selectedSubjectForGrade?.subjectName ?? editingAttempt?.subjectName ?? ''}
          currentGrade={editingAttempt?.grade}
          initialSchoolYear={editingAttempt?.schoolYear ?? '2025-2026'}
          initialTerm={editingAttempt?.termTaken ?? 1}
          onClose={() => {
            setGradeModalVisible(false);
            setSelectedSubjectForGrade(null);
            setEditingAttempt(null);
          }}
          onSubmit={handleSaveGrade}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: '#e0f2fe',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 10,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    marginVertical: 5,
    marginHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoCol: {
    flex: 1,
    paddingRight: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  unitsBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  name: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  gradeCol: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  grade: {
    fontSize: 20,
    fontWeight: '800',
  },
  gradePassed: {
    color: '#15803d',
  },
  gradeFailed: {
    color: '#b91c1c',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  statusBadgePassed: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeFailed: {
    backgroundColor: '#fee2e2',
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPassed: {
    color: '#15803d',
  },
  statusTextFailed: {
    color: '#b91c1c',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  iconBtn: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  subjectPickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  subjectPickerList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subjectPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284c7',
  },
  pickerMeta: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pickerName: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  pickerUnits: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
});
