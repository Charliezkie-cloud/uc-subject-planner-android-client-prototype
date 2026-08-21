import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useEligibility } from '@/hooks/useEligibility';
import { SubjectCard } from '@/components/SubjectCard';
import { GradeModal } from '@/components/GradeModal';
import { YEAR_LEVELS, TERMS } from '@/constants/grades';
import { ProgramSubjectDetail } from '@/db/queries/subjects';
import {
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Sparkles,
  Layers,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';
import { ScreenContainer } from '@/components/ui/ScreenContainer';

type FilterMode = 'curriculum' | 'eligible' | 'all';

export default function PlanScreen() {
  const [selectedYearLevel, setSelectedYearLevel] = useState<number>(1);
  const [selectedTermNumber, setSelectedTermNumber] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<FilterMode>('curriculum');

  const baseYear = 2025;
  const currentSchoolYear = `${baseYear + selectedYearLevel - 1}-${baseYear + selectedYearLevel}`;

  const targetTerm = useMemo(
    () => ({
      plannedSchoolYear: currentSchoolYear,
      plannedTerm: selectedTermNumber,
    }),
    [currentSchoolYear, selectedTermNumber]
  );

  const {
    loading,
    subjects,
    eligibilityMap,
    activeProgram,
    subjectStatusesMap,
    plannedSubjectIds,
    planSubject,
    unplanSubject,
    planAllEligible,
    recordGrade,
  } = useEligibility(targetTerm);

  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [gradingSubject, setGradingSubject] = useState<ProgramSubjectDetail | null>(null);

  const displayedSubjects = useMemo(() => {
    if (filterMode === 'curriculum') {
      return subjects.filter(
        (subject) => subject.yearLevel === selectedYearLevel && subject.term === selectedTermNumber
      );
    }
    if (filterMode === 'eligible') {
      return subjects.filter((subject) => {
        return eligibilityMap.get(subject.subjectId)?.status === 'eligible';
      });
    }
    return subjects;
  }, [subjects, selectedYearLevel, selectedTermNumber, filterMode, eligibilityMap]);

  const stats = useMemo(() => {
    let eligibleCount = 0;
    let passedCount = 0;
    let plannedUnits = 0;
    let totalCurriculumUnits = 0;

    for (const subject of displayedSubjects) {
      totalCurriculumUnits += subject.units;
      const eligibilityResult = eligibilityMap.get(subject.subjectId);
      if (eligibilityResult?.status === 'eligible') eligibleCount++;
      if (eligibilityResult?.status === 'passed') passedCount++;
      if (plannedSubjectIds.has(subject.subjectId)) plannedUnits += subject.units;
    }

    return { eligibleCount, passedCount, plannedUnits, totalCurriculumUnits };
  }, [displayedSubjects, eligibilityMap, plannedSubjectIds]);

  const handleOpenGradeModal = (subject: ProgramSubjectDetail) => {
    setGradingSubject(subject);
    setGradeModalVisible(true);
  };

  const handleSaveGrade = async (grade: number, schoolYear?: string, term?: number) => {
    if (!gradingSubject) return;
    try {
      await recordGrade(gradingSubject.subjectId, grade, schoolYear, term);
    } catch (err) {
      console.error('Failed to save grade', err);
      Alert.alert('Error', 'Failed to save grade.');
    }
  };

  const handleTogglePlan = async (subjectId: number) => {
    if (plannedSubjectIds.has(subjectId)) {
      await unplanSubject(subjectId);
    } else {
      await planSubject(subjectId);
    }
  };

  const handlePlanAllEligible = async () => {
    const eligibleIds = displayedSubjects
      .filter((s) => eligibilityMap.get(s.subjectId)?.status === 'eligible')
      .map((s) => s.subjectId);

    if (eligibleIds.length === 0) {
      Alert.alert('No Eligible Subjects', 'There are no uncompleted eligible subjects to plan in this view.');
      return;
    }

    await planAllEligible(eligibleIds);
    Alert.alert('Success', `Planned ${eligibleIds.length} eligible subjects for Year ${selectedYearLevel} Term ${selectedTermNumber}.`);
  };

  const handleNextTerm = () => {
    if (selectedTermNumber === 1) {
      setSelectedTermNumber(2);
    } else if (selectedTermNumber === 2) {
      if (selectedYearLevel < 4) {
        setSelectedYearLevel((prev) => prev + 1);
        setSelectedTermNumber(1);
      } else {
        Alert.alert('End of Curriculum', 'You have reached the final term (Year 4 Term 2) of the curriculum!');
      }
    }
  };

  const handlePrevTerm = () => {
    if (selectedTermNumber === 2) {
      setSelectedTermNumber(1);
    } else if (selectedTermNumber === 1 && selectedYearLevel > 1) {
      setSelectedYearLevel((prev) => prev - 1);
      setSelectedTermNumber(2);
    }
  };

  const isFirstTerm = selectedYearLevel === 1 && selectedTermNumber === 1;
  const isLastTerm = selectedYearLevel === 4 && selectedTermNumber === 2;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.title}>Subject Planner</Text>
            {activeProgram && (
              <View style={styles.programBadge}>
                <BookOpen size={12} color="#0284c7" />
                <Text style={styles.programBadgeText}>
                  {activeProgram.programCode} ({activeProgram.curriculumVersion})
                </Text>
              </View>
            )}
          </View>
          <View style={styles.schoolYearBadge}>
            <Calendar size={12} color="#475569" />
            <Text style={styles.schoolYearText}>AY {currentSchoolYear}</Text>
          </View>
        </View>

        <View style={styles.yearLevelRow}>
          {YEAR_LEVELS.map((yearLevel) => (
            <TouchableOpacity
              key={yearLevel.id}
              style={[
                styles.yearTab,
                selectedYearLevel === yearLevel.id && styles.yearTabActive,
              ]}
              onPress={() => setSelectedYearLevel(yearLevel.id)}>
              <Text
                style={[
                  styles.yearTabText,
                  selectedYearLevel === yearLevel.id && styles.yearTabTextActive,
                ]}>
                {yearLevel.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.termRow}>
          {TERMS.slice(0, 2).map((termOption) => (
            <TouchableOpacity
              key={termOption.id}
              style={[
                styles.termTab,
                selectedTermNumber === termOption.id && styles.termTabActive,
              ]}
              onPress={() => setSelectedTermNumber(termOption.id)}>
              <Text
                style={[
                  styles.termTabText,
                  selectedTermNumber === termOption.id && styles.termTabTextActive,
                ]}>
                {termOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterMode === 'curriculum' && styles.filterChipActive,
              ]}
              onPress={() => setFilterMode('curriculum')}>
              <Layers size={13} color={filterMode === 'curriculum' ? '#0284c7' : '#64748b'} />
              <Text
                style={[
                  styles.filterChipText,
                  filterMode === 'curriculum' && styles.filterChipTextActive,
                ]}>
                Term Curriculum ({displayedSubjects.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterMode === 'eligible' && styles.filterChipActive,
              ]}
              onPress={() => setFilterMode('eligible')}>
              <Sparkles size={13} color={filterMode === 'eligible' ? '#0284c7' : '#64748b'} />
              <Text
                style={[
                  styles.filterChipText,
                  filterMode === 'eligible' && styles.filterChipTextActive,
                ]}>
                All Eligible Now ({stats.eligibleCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterMode === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setFilterMode('all')}>
              <Text
                style={[
                  styles.filterChipText,
                  filterMode === 'all' && styles.filterChipTextActive,
                ]}>
                Full Curriculum ({subjects.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Evaluating Eligibility & Rules...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedSubjects}
          keyExtractor={(item) => item.subjectId.toString()}
          renderItem={({ item }) => {
            const eligibilityResult = eligibilityMap.get(item.subjectId);
            const status = subjectStatusesMap.get(item.subjectId);
            const isPlanned = plannedSubjectIds.has(item.subjectId);

            return (
              <SubjectCard
                subjectCode={item.subjectCode}
                subjectName={item.subjectName}
                units={item.units}
                yearLevel={item.yearLevel}
                term={item.term}
                eligibility={eligibilityResult}
                currentGrade={status?.grade}
                attemptNumber={status?.attemptNumber}
                isPlanned={isPlanned}
                onGradePress={() => handleOpenGradeModal(item)}
                onTogglePlan={() => handleTogglePlan(item.subjectId)}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No Subjects Found</Text>
              <Text style={styles.emptyText}>
                {filterMode === 'eligible'
                  ? 'No subjects are currently eligible to take in this filter.'
                  : 'No curriculum subjects assigned for this year and term.'}
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.bottomBar}>
        <View style={styles.bottomSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Planned Units</Text>
            <Text style={styles.summaryValue}>{stats.plannedUnits} Units</Text>
          </View>
          <TouchableOpacity
            style={styles.planAllBtn}
            onPress={handlePlanAllEligible}>
            <CheckCircle2 size={15} color="#0284c7" />
            <Text style={styles.planAllBtnText}>Plan All Eligible</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            disabled={isFirstTerm}
            style={[styles.navBtn, isFirstTerm && styles.navBtnDisabled]}
            onPress={handlePrevTerm}>
            <ChevronLeft size={18} color={isFirstTerm ? '#94a3b8' : '#334155'} />
            <Text style={[styles.navBtnText, isFirstTerm && styles.navBtnTextDisabled]}>
              Prev Term
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, isLastTerm && styles.nextBtnDisabled]}
            onPress={handleNextTerm}>
            <Text style={styles.nextBtnText}>
              {isLastTerm ? 'Completed' : 'Next Term Plan'}
            </Text>
            <ChevronRight size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {gradingSubject && (
        <GradeModal
          visible={gradeModalVisible}
          subjectCode={gradingSubject.subjectCode}
          subjectName={gradingSubject.subjectName}
          currentGrade={subjectStatusesMap.get(gradingSubject.subjectId)?.grade}
          initialSchoolYear={currentSchoolYear}
          initialTerm={selectedTermNumber}
          onClose={() => {
            setGradeModalVisible(false);
            setGradingSubject(null);
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'column',
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  programBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  programBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369a1',
  },
  schoolYearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  schoolYearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  yearLevelRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  yearTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  yearTabActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  yearTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  yearTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  termRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  termTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  termTabActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  termTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  termTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 8,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  planAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  planAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  navBtnTextDisabled: {
    color: '#94a3b8',
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#0284c7',
  },
  nextBtnDisabled: {
    backgroundColor: '#64748b',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
