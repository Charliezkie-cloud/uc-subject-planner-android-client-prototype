import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, Award } from 'lucide-react-native';
import { PASSING_GRADE_THRESHOLD, MIN_GRADE, MAX_GRADE } from '@/constants/grades';
import { formatGrade } from '@/features/grades/gradeUtils';

const STANDARD_GRADES = [
  { value: 1.0, label: '1.00 - Excellent' },
  { value: 1.25, label: '1.25 - Superior' },
  { value: 1.5, label: '1.50 - Very Good' },
  { value: 1.75, label: '1.75 - Good' },
  { value: 2.0, label: '2.00 - Satisfactory' },
  { value: 2.25, label: '2.25 - Fairly Satisfactory' },
  { value: 2.5, label: '2.50 - Fair' },
  { value: 2.75, label: '2.75 - Passed' },
  { value: 3.0, label: '3.00 - Passing' },
  { value: 5.0, label: '5.00 - Failed' },
];

interface GradeModalProps {
  visible: boolean;
  subjectCode: string;
  subjectName: string;
  currentGrade?: number;
  initialSchoolYear?: string;
  initialTerm?: number;
  onClose: () => void;
  onSubmit: (grade: number, schoolYear?: string, term?: number) => void;
}

export function GradeModal({
  visible,
  subjectCode,
  subjectName,
  currentGrade,
  initialSchoolYear,
  initialTerm,
  onClose,
  onSubmit,
}: GradeModalProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(currentGrade ?? 1.0);
  const [customGradeText, setCustomGradeText] = useState<string>(
    currentGrade ? currentGrade.toFixed(2) : ''
  );
  const [schoolYear, setSchoolYear] = useState<string>(initialSchoolYear ?? '2025-2026');
  const [term, setTerm] = useState<number>(initialTerm ?? 1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      const initialGradeValue = currentGrade ?? 1.0;
      setSelectedGrade(initialGradeValue);
      setCustomGradeText(initialGradeValue ? initialGradeValue.toFixed(2) : '');
      if (initialSchoolYear) setSchoolYear(initialSchoolYear);
      if (initialTerm) setTerm(initialTerm);
      setErrorMsg(null);
    }
  }, [visible, currentGrade, initialSchoolYear, initialTerm]);

  const handleSelectQuickGrade = (val: number) => {
    setSelectedGrade(val);
    setCustomGradeText(val.toFixed(2));
    setErrorMsg(null);
  };

  const handleCustomChange = (text: string) => {
    setCustomGradeText(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed)) {
      setSelectedGrade(parsed);
      if (parsed < MIN_GRADE || parsed > MAX_GRADE) {
        setErrorMsg(`Grade must be between ${MIN_GRADE.toFixed(2)} and ${MAX_GRADE.toFixed(2)}`);
      } else {
        setErrorMsg(null);
      }
    } else {
      setSelectedGrade(null);
    }
  };

  const handleSave = () => {
    const finalGrade = selectedGrade;
    if (finalGrade === null || isNaN(finalGrade)) {
      setErrorMsg('Please select or input a valid grade');
      return;
    }
    if (finalGrade < MIN_GRADE || finalGrade > MAX_GRADE) {
      setErrorMsg(`Grade must be between ${MIN_GRADE.toFixed(2)} and ${MAX_GRADE.toFixed(2)}`);
      return;
    }
    onSubmit(finalGrade, schoolYear, term);
    onClose();
  };

  const isPassing = selectedGrade !== null && selectedGrade <= PASSING_GRADE_THRESHOLD;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Award size={20} color="#0284c7" />
              <Text style={styles.headerTitle}>Input Grade</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.subjectInfoBox}>
            <Text style={styles.subjectCode}>{subjectCode}</Text>
            <Text style={styles.subjectName}>{subjectName}</Text>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Select Standard Grade:</Text>
            <View style={styles.grid}>
              {STANDARD_GRADES.map((item) => {
                const isSelected = selectedGrade === item.value;
                const passing = item.value <= PASSING_GRADE_THRESHOLD;
                return (
                  <TouchableOpacity
                    key={item.value.toString()}
                    style={[
                      styles.gradeButton,
                      isSelected && (passing ? styles.gradeButtonPassed : styles.gradeButtonFailed),
                    ]}
                    onPress={() => handleSelectQuickGrade(item.value)}>
                    <Text
                      style={[
                        styles.gradeButtonText,
                        isSelected && styles.gradeButtonTextActive,
                      ]}>
                      {formatGrade(item.value)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.customSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numeric Grade:</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={customGradeText}
                  onChangeText={handleCustomChange}
                  placeholder="e.g. 1.75"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {selectedGrade !== null && !isNaN(selectedGrade) && (
                <View
                  style={[
                    styles.statusBadge,
                    isPassing ? styles.statusBadgePassed : styles.statusBadgeFailed,
                  ]}>
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isPassing ? styles.statusBadgeTextPassed : styles.statusBadgeTextFailed,
                    ]}>
                    {isPassing ? 'PASSED (≤ 3.00)' : 'FAILED (> 3.00)'}
                  </Text>
                </View>
              )}
            </View>

            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Check size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Grade</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subjectInfoBox: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  subjectCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
  },
  subjectName: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gradeButton: {
    width: '18%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  gradeButtonPassed: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  gradeButtonFailed: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  gradeButtonTextActive: {
    color: '#ffffff',
  },
  customSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  statusBadgePassed: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  statusBadgeFailed: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextPassed: {
    color: '#15803d',
  },
  statusBadgeTextFailed: {
    color: '#b91c1c',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 10,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0284c7',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
