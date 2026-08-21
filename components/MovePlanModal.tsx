import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { PLAN_YEAR_LEVELS, TERMS, schoolYearForYearLevel } from '@/constants/grades';
import { X } from 'lucide-react-native';

interface MovePlanModalProps {
  visible: boolean;
  subjectCode: string;
  subjectName: string;
  initialYearLevel: number;
  initialTerm: number;
  onClose: () => void;
  onConfirm: (destination: { yearLevel: number; term: number; schoolYear: string }) => void;
}

export function MovePlanModal({
  visible,
  subjectCode,
  subjectName,
  initialYearLevel,
  initialTerm,
  onClose,
  onConfirm,
}: MovePlanModalProps) {
  const [selectedYearLevel, setSelectedYearLevel] = useState(initialYearLevel);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm);

  useEffect(() => {
    if (visible) {
      setSelectedYearLevel(initialYearLevel);
      setSelectedTerm(initialTerm);
    }
  }, [visible, initialYearLevel, initialTerm]);

  const destinationSchoolYear = schoolYearForYearLevel(selectedYearLevel);
  const isUnchanged =
    selectedYearLevel === initialYearLevel && selectedTerm === initialTerm;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Move to Term</Text>
              <Text style={styles.subtitle}>
                {subjectCode} · {subjectName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.sectionLabel}>Year Level</Text>
            <View style={styles.chipRow}>
              {PLAN_YEAR_LEVELS.map((yearLevel) => {
                const isActive = selectedYearLevel === yearLevel.id;
                return (
                  <TouchableOpacity
                    key={yearLevel.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedYearLevel(yearLevel.id)}>
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {yearLevel.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Term</Text>
            <View style={styles.chipRow}>
              {TERMS.slice(0, 2).map((termOption) => {
                const isActive = selectedTerm === termOption.id;
                return (
                  <TouchableOpacity
                    key={termOption.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedTerm(termOption.id)}>
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {termOption.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Destination</Text>
              <Text style={styles.previewValue}>
                Year {selectedYearLevel} · Term {selectedTerm} · AY {destinationSchoolYear}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, isUnchanged && styles.confirmBtnDisabled]}
              disabled={isUnchanged}
              onPress={() =>
                onConfirm({
                  yearLevel: selectedYearLevel,
                  term: selectedTerm,
                  schoolYear: destinationSchoolYear,
                })
              }>
              <Text style={styles.confirmBtnText}>Move Subject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  previewCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c4a6e',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
