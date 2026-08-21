import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BookOpen, GitBranch, Layers } from 'lucide-react-native';
import { TERMS } from '@/constants/grades';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllPrograms,
  getStudentProfile,
  updateStudentProfile,
} from '@/db/queries/programs';
import {
  getCorequisitesForProgram,
  getPrerequisitesForProgram,
  getProgramSubjects,
  getYearRangePrerequisitesForProgram,
  ProgramSubjectDetail,
} from '@/db/queries/subjects';
import { Corequisite, Prerequisite, Program, YearRangePrerequisite } from '@/types/database';

const getYearLevelLabel = (yearLevel: number) => {
  const ordinalSuffix = yearLevel === 1 ? 'st' : yearLevel === 2 ? 'nd' : yearLevel === 3 ? 'rd' : 'th';
  return `${yearLevel}${ordinalSuffix} Year`;
};

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [currentYearLevel, setCurrentYearLevel] = useState<number | null>(null);
  const [curriculumSubjects, setCurriculumSubjects] = useState<ProgramSubjectDetail[]>([]);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [corequisites, setCorequisites] = useState<Corequisite[]>([]);
  const [yearRangePrerequisites, setYearRangePrerequisites] = useState<YearRangePrerequisite[]>([]);
  const [selectedYearLevel, setSelectedYearLevel] = useState<number | 'all'>('all');
  const [selectedTerm, setSelectedTerm] = useState<number | 'all'>('all');

  const loadProgramSubjects = async (program: Program) => {
    const [subjects, programPrerequisites, programCorequisites, programYearRangePrerequisites] = await Promise.all([
      getProgramSubjects(program.id),
      getPrerequisitesForProgram(program.id),
      getCorequisitesForProgram(program.id),
      getYearRangePrerequisitesForProgram(program.id),
    ]);
    setCurriculumSubjects(subjects);
    setPrerequisites(programPrerequisites);
    setCorequisites(programCorequisites);
    setYearRangePrerequisites(programYearRangePrerequisites);
  };

  const loadCoursesScreenData = useCallback(async () => {
    try {
      setLoading(true);
      const [availablePrograms, profile] = await Promise.all([getAllPrograms(), getStudentProfile()]);
      const selectedProgram =
        availablePrograms.find((program) => program.id === profile?.programId) ??
        availablePrograms[0] ??
        null;

      setPrograms(availablePrograms);
      setCurrentYearLevel(profile?.currentYearLevel ?? null);
      setActiveProgram(selectedProgram);

      if (selectedProgram) {
        await loadProgramSubjects(selectedProgram);
      }
    } catch (error) {
      console.error('Failed to load courses', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCoursesScreenData();
    }, [loadCoursesScreenData])
  );

  const handleCurriculumChange = async (programId: string) => {
    const selectedProgram = programs.find((program) => program.id === Number(programId));
    if (!selectedProgram || selectedProgram.id === activeProgram?.id) {
      return;
    }

    try {
      await updateStudentProfile(selectedProgram.id, currentYearLevel ?? 1);
      setActiveProgram(selectedProgram);
      await loadProgramSubjects(selectedProgram);
      Alert.alert(
        'Curriculum Switched',
        `Active curriculum set to ${selectedProgram.programCode} (${selectedProgram.curriculumVersion}).`
      );
    } catch (error) {
      console.error('Failed to switch curriculum', error);
      Alert.alert('Error', 'Failed to switch curriculum.');
    }
  };

  const subjectCodeById = useMemo(() => {
    return new Map(curriculumSubjects.map((subject) => [subject.subjectId, subject.subjectCode]));
  }, [curriculumSubjects]);

  const prerequisiteCodesBySubjectId = useMemo(() => {
    const codesBySubjectId = new Map<number, string[]>();
    for (const prerequisite of prerequisites) {
      const codes = codesBySubjectId.get(prerequisite.subjectId) ?? [];
      codes.push(subjectCodeById.get(prerequisite.prerequisiteSubjectId) ?? `Subject #${prerequisite.prerequisiteSubjectId}`);
      codesBySubjectId.set(prerequisite.subjectId, codes);
    }
    return codesBySubjectId;
  }, [prerequisites, subjectCodeById]);

  const corequisiteCodesBySubjectId = useMemo(() => {
    const codesBySubjectId = new Map<number, string[]>();
    for (const corequisite of corequisites) {
      const codes = codesBySubjectId.get(corequisite.subjectId) ?? [];
      codes.push(subjectCodeById.get(corequisite.corequisiteSubjectId) ?? `Subject #${corequisite.corequisiteSubjectId}`);
      codesBySubjectId.set(corequisite.subjectId, codes);
    }
    return codesBySubjectId;
  }, [corequisites, subjectCodeById]);

  const yearRangePrerequisiteTextBySubjectId = useMemo(() => {
    const textsBySubjectId = new Map<number, string>();
    const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
    for (const yr of yearRangePrerequisites) {
      const text =
        yr.throughYearLevel === 1
          ? 'Requires all 1st subjects'
          : `Requires all 1st to ${ordinal(yr.throughYearLevel)} subjects`;
      textsBySubjectId.set(yr.subjectId, text);
    }
    return textsBySubjectId;
  }, [yearRangePrerequisites]);

  const availableYearLevels = useMemo(() => {
    return [...new Set(curriculumSubjects.map((subject) => subject.yearLevel))].sort((firstYear, secondYear) => firstYear - secondYear);
  }, [curriculumSubjects]);

  useEffect(() => {
    if (selectedYearLevel !== 'all' && !availableYearLevels.includes(selectedYearLevel)) {
      setSelectedYearLevel('all');
    }
  }, [availableYearLevels, selectedYearLevel]);

  const filteredSubjects = useMemo(
    () =>
      curriculumSubjects.filter(
        (subject) =>
          (selectedYearLevel === 'all' || subject.yearLevel === selectedYearLevel) &&
          (selectedTerm === 'all' || subject.term === selectedTerm)
      ),
    [curriculumSubjects, selectedTerm, selectedYearLevel]
  );

  const totalUnits = useMemo(
    () => curriculumSubjects.reduce((total, subject) => total + subject.units, 0),
    [curriculumSubjects]
  );

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Curriculum & Courses</Text>
        {activeProgram && (
          <Text style={styles.subtitle}>
            {activeProgram.programName} ({activeProgram.curriculumVersion})
          </Text>
        )}

        {programs.length > 0 && (
          <View style={styles.curriculumSection}>
            <View style={styles.curriculumSectionHeader}>
              <BookOpen size={18} color="#0284c7" />
              <Text style={styles.curriculumSectionTitle}>Curriculum</Text>
            </View>
            <Text style={styles.curriculumHint}>Choose the curriculum you are following.</Text>
            <Select
              value={
                activeProgram
                  ? {
                      value: activeProgram.id.toString(),
                      label: `${activeProgram.programCode} · ${activeProgram.curriculumVersion}`,
                    }
                  : undefined
              }
              onValueChange={(option) => {
                if (option) {
                  handleCurriculumChange(option.value);
                }
              }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a curriculum" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Curricula</SelectLabel>
                  {programs.map((program) => (
                    <SelectItem
                      key={program.id}
                      value={program.id.toString()}
                      label={`${program.programCode} · ${program.curriculumVersion}`}>
                      {program.programName} ({program.curriculumVersion})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {activeProgram && <Text style={styles.selectedCurriculumName}>{activeProgram.programName}</Text>}
          </View>
        )}

        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.chip, selectedYearLevel === 'all' && styles.chipActive]} onPress={() => setSelectedYearLevel('all')}>
            <Text style={[styles.chipText, selectedYearLevel === 'all' && styles.chipTextActive]}>All Years</Text>
          </TouchableOpacity>
          {availableYearLevels.map((yearLevel) => (
            <TouchableOpacity key={yearLevel} style={[styles.chip, selectedYearLevel === yearLevel && styles.chipActive]} onPress={() => setSelectedYearLevel(yearLevel)}>
              <Text style={[styles.chipText, selectedYearLevel === yearLevel && styles.chipTextActive]}>{getYearLevelLabel(yearLevel)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.chip, selectedTerm === 'all' && styles.chipActive]} onPress={() => setSelectedTerm('all')}>
            <Text style={[styles.chipText, selectedTerm === 'all' && styles.chipTextActive]}>All Terms</Text>
          </TouchableOpacity>
          {TERMS.slice(0, 2).map((termOption) => (
            <TouchableOpacity key={termOption.id} style={[styles.chip, selectedTerm === termOption.id && styles.chipActive]} onPress={() => setSelectedTerm(termOption.id)}>
              <Text style={[styles.chipText, selectedTerm === termOption.id && styles.chipTextActive]}>{termOption.shortLabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsBanner}>
          <Text style={styles.statsBannerText}>
            Showing <Text style={styles.bold}>{filteredSubjects.length}</Text> of <Text style={styles.bold}>{curriculumSubjects.length}</Text> subjects · <Text style={styles.bold}>{totalUnits} Total Units</Text>
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#0284c7" /></View>
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={(subject) => subject.subjectId.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const subjectPrerequisiteCodes = prerequisiteCodesBySubjectId.get(item.subjectId) ?? [];
            const subjectCorequisiteCodes = corequisiteCodesBySubjectId.get(item.subjectId) ?? [];
            const subjectYearRangeText = yearRangePrerequisiteTextBySubjectId.get(item.subjectId);
            const hasRequirements =
              subjectPrerequisiteCodes.length > 0 ||
              subjectCorequisiteCodes.length > 0 ||
              Boolean(subjectYearRangeText);
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.code}>{item.subjectCode}</Text>
                  <View style={styles.metaBadge}><Text style={styles.badgeText}>Year {item.yearLevel} · Term {item.term}</Text></View>
                </View>
                <Text style={styles.name}>{item.subjectName}</Text>
                <Text style={styles.units}>{item.units} Units</Text>
                {hasRequirements && (
                  <View style={styles.reqsBox}>
                    {subjectPrerequisiteCodes.length > 0 && <View style={styles.reqRow}><GitBranch size={12} color="#dc2626" /><Text style={styles.reqLabel}>Prereq:</Text><Text style={styles.reqVal}>{subjectPrerequisiteCodes.join(', ')}</Text></View>}
                    {subjectYearRangeText && <View style={styles.reqRow}><GitBranch size={12} color="#dc2626" /><Text style={styles.reqLabel}>Prereq:</Text><Text style={styles.reqVal}>{subjectYearRangeText}</Text></View>}
                    {subjectCorequisiteCodes.length > 0 && <View style={styles.reqRow}><Layers size={12} color="#d97706" /><Text style={styles.reqLabel}>Co-req:</Text><Text style={styles.reqVal}>{subjectCorequisiteCodes.join(', ')}</Text></View>}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>No subjects found matching the filter.</Text></View>}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 10 },
  curriculumSection: { marginBottom: 10 },
  curriculumSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  curriculumSectionTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
  curriculumHint: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  selectedCurriculumName: { fontSize: 12, color: '#64748b', marginTop: 6 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  statsBanner: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  statsBannerText: { fontSize: 12, color: '#64748b' },
  bold: { fontWeight: '700', color: '#0f172a' },
  listContent: { paddingVertical: 10 },
  card: { backgroundColor: '#ffffff', padding: 14, marginVertical: 5, marginHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  metaBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#0369a1' },
  name: { fontSize: 14, color: '#334155', marginTop: 4, fontWeight: '500' },
  units: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  reqsBox: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  reqVal: { fontSize: 11, fontWeight: '600', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: '#64748b' },
});
