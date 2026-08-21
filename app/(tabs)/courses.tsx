import React, { useEffect, useState, useMemo } from 'react';
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
import { YEAR_LEVELS, TERMS } from '@/constants/grades';
import {
  BookOpen,
  CheckCircle2,
  GitBranch,
  Layers,
  Sparkles,
} from 'lucide-react-native';

export default function CoursesScreen() {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [curriculumSubjects, setCurriculumSubjects] = useState<ProgramSubjectDetail[]>([]);
  const [prereqs, setPrereqs] = useState<Prerequisite[]>([]);
  const [coreqs, setCoreqs] = useState<Corequisite[]>([]);

  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedTerm, setSelectedTerm] = useState<number | 'all'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const allProgs = await getAllPrograms();
      setPrograms(allProgs);

      const profile = await getStudentProfile();
      const currentProg =
        allProgs.find((p) => p.id === profile?.programId) || allProgs[0] || null;
      setActiveProgram(currentProg);

      if (currentProg) {
        const [subjects, pre, co] = await Promise.all([
          getProgramSubjects(currentProg.id),
          getPrerequisitesForProgram(currentProg.id),
          getCorequisitesForProgram(currentProg.id),
        ]);
        setCurriculumSubjects(subjects);
        setPrereqs(pre);
        setCoreqs(co);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectProgram = async (prog: Program) => {
    try {
      await updateStudentProfile(prog.id, 1);
      setActiveProgram(prog);
      const [subjects, pre, co] = await Promise.all([
        getProgramSubjects(prog.id),
        getPrerequisitesForProgram(prog.id),
        getCorequisitesForProgram(prog.id),
      ]);
      setCurriculumSubjects(subjects);
      setPrereqs(pre);
      setCoreqs(co);
      Alert.alert('Curriculum Switched', `Active curriculum set to ${prog.programCode}.`);
    } catch (err) {
      console.error('Failed to switch program', err);
      Alert.alert('Error', 'Failed to switch program.');
    }
  };

  // Map subjects for quick prereq/coreq name lookups
  const subjectMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of curriculumSubjects) {
      map.set(s.subjectId, s.subjectCode);
    }
    return map;
  }, [curriculumSubjects]);

  // Group prereqs and coreqs by subjectId
  const prereqsBySubject = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const p of prereqs) {
      const list = map.get(p.subjectId) || [];
      const code = subjectMap.get(p.prerequisiteSubjectId) || `Subject #${p.prerequisiteSubjectId}`;
      list.push(code);
      map.set(p.subjectId, list);
    }
    return map;
  }, [prereqs, subjectMap]);

  const coreqsBySubject = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const c of coreqs) {
      const list = map.get(c.subjectId) || [];
      const code = subjectMap.get(c.corequisiteSubjectId) || `Subject #${c.corequisiteSubjectId}`;
      list.push(code);
      map.set(c.subjectId, list);
    }
    return map;
  }, [coreqs, subjectMap]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return curriculumSubjects.filter((s) => {
      const yearMatch = selectedYear === 'all' || s.yearLevel === selectedYear;
      const termMatch = selectedTerm === 'all' || s.term === selectedTerm;
      return yearMatch && termMatch;
    });
  }, [curriculumSubjects, selectedYear, selectedTerm]);

  const totalUnits = useMemo(() => {
    return curriculumSubjects.reduce((sum, s) => sum + s.units, 0);
  }, [curriculumSubjects]);

  return (
    <View style={styles.container}>
      {/* Header */}
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

        {/* Program Selection Cards (if multiple programs exist) */}
        {programs.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.programScroll}>
            {programs.map((p) => {
              const isActive = activeProgram?.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.programCard, isActive && styles.programCardActive]}
                  onPress={() => handleSelectProgram(p)}>
                  <BookOpen size={14} color={isActive ? '#0284c7' : '#64748b'} />
                  <Text style={[styles.programCodeText, isActive && styles.programCodeTextActive]}>
                    {p.programCode} ({p.curriculumVersion})
                  </Text>
                  {isActive && <CheckCircle2 size={13} color="#0284c7" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Year Filter */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, selectedYear === 'all' && styles.chipActive]}
            onPress={() => setSelectedYear('all')}>
            <Text style={[styles.chipText, selectedYear === 'all' && styles.chipTextActive]}>
              All Years
            </Text>
          </TouchableOpacity>
          {YEAR_LEVELS.map((yr) => (
            <TouchableOpacity
              key={yr.id}
              style={[styles.chip, selectedYear === yr.id && styles.chipActive]}
              onPress={() => setSelectedYear(yr.id)}>
              <Text style={[styles.chipText, selectedYear === yr.id && styles.chipTextActive]}>
                Yr {yr.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Term Filter */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.chip, selectedTerm === 'all' && styles.chipActive]}
            onPress={() => setSelectedTerm('all')}>
            <Text style={[styles.chipText, selectedTerm === 'all' && styles.chipTextActive]}>
              All Terms
            </Text>
          </TouchableOpacity>
          {TERMS.slice(0, 2).map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, selectedTerm === t.id && styles.chipActive]}
              onPress={() => setSelectedTerm(t.id)}>
              <Text style={[styles.chipText, selectedTerm === t.id && styles.chipTextActive]}>
                {t.shortLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats banner */}
        <View style={styles.statsBanner}>
          <Text style={styles.statsBannerText}>
            Showing <Text style={styles.bold}>{filteredSubjects.length}</Text> of{' '}
            <Text style={styles.bold}>{curriculumSubjects.length}</Text> subjects •{' '}
            <Text style={styles.bold}>{totalUnits} Total Units</Text>
          </Text>
        </View>
      </View>

      {/* Subjects List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={filteredSubjects}
          keyExtractor={(item) => item.subjectId.toString()}
          renderItem={({ item }) => {
            const reqPrereqs = prereqsBySubject.get(item.subjectId) || [];
            const reqCoreqs = coreqsBySubject.get(item.subjectId) || [];

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

                {/* Prerequisite & Corequisite Badges */}
                {(reqPrereqs.length > 0 || reqCoreqs.length > 0) && (
                  <View style={styles.reqsBox}>
                    {reqPrereqs.length > 0 && (
                      <View style={styles.reqRow}>
                        <GitBranch size={12} color="#dc2626" />
                        <Text style={styles.reqLabel}>Prereq:</Text>
                        <Text style={styles.reqVal}>{reqPrereqs.join(', ')}</Text>
                      </View>
                    )}
                    {reqCoreqs.length > 0 && (
                      <View style={styles.reqRow}>
                        <Layers size={12} color="#d97706" />
                        <Text style={styles.reqLabel}>Co-req:</Text>
                        <Text style={styles.reqVal}>{reqCoreqs.join(', ')}</Text>
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
  programScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  programCardActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  programCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  programCodeTextActive: {
    color: '#0284c7',
    fontWeight: '700',
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
