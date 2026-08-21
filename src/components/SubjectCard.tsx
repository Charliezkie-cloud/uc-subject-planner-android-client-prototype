import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { EligibilityBadge } from './EligibilityBadge';
import { SubjectEligibilityResult } from '@/features/eligibility/types';
import { formatGrade } from '@/features/grades/gradeUtils';
import { CheckCircle, PlusCircle, Award, AlertCircle } from 'lucide-react-native';

interface SubjectCardProps {
  subjectCode: string;
  subjectName: string;
  units: number;
  yearLevel?: number;
  term?: number;
  eligibility?: SubjectEligibilityResult;
  currentGrade?: number;
  attemptNumber?: number;
  isPlanned?: boolean;
  onGradePress?: () => void;
  onTogglePlan?: () => void;
}

export function SubjectCard({
  subjectCode,
  subjectName,
  units,
  eligibility,
  currentGrade,
  attemptNumber,
  isPlanned,
  onGradePress,
  onTogglePlan,
}: SubjectCardProps) {
  const isPassed = eligibility?.status === 'passed' || (currentGrade !== undefined && currentGrade <= 3.0);
  const isEligible = eligibility?.status === 'eligible';
  const isNotEligible = eligibility?.status === 'not_eligible';

  return (
    <Card className="my-2 mx-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      {/* Top row: Code, Title, Eligibility/Status Badge */}
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900">{subjectCode}</CardTitle>
            {isPlanned && (
              <View className="bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-sky-800">PLANNED</Text>
              </View>
            )}
          </View>
          <CardDescription className="text-sm text-slate-600 mt-0.5">{subjectName}</CardDescription>
        </View>

        {eligibility && <EligibilityBadge status={eligibility.status} />}
      </View>

      {/* Meta Row: Units & Grade Summary */}
      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-slate-100">
        <Text className="text-xs font-semibold text-slate-500">{units} Units</Text>

        {currentGrade !== undefined && (
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-slate-400">
              {attemptNumber ? `Attempt #${attemptNumber}:` : 'Grade:'}
            </Text>
            <Text
              className={`text-xs font-bold ${
                isPassed ? 'text-emerald-700' : 'text-red-600'
              }`}>
              {formatGrade(currentGrade)} ({isPassed ? 'Passed' : 'Failed'})
            </Text>
          </View>
        )}
      </View>

      {/* Missing Requirements List */}
      {isNotEligible && eligibility && (
        <View className="mt-2.5 p-2.5 bg-red-50/80 border border-red-200 rounded-lg">
          <View className="flex-row items-center gap-1.5 mb-1">
            <AlertCircle size={14} color="#dc2626" />
            <Text className="text-xs font-bold text-red-800">Prerequisite / Co-requisite Required:</Text>
          </View>
          {eligibility.missingPrerequisites.map((prereq) => (
            <Text key={prereq.subjectId} className="text-xs text-red-700 ml-4 mt-0.5">
              • Prereq required: <Text className="font-bold">{prereq.subjectCode}</Text> (Must be passed first)
            </Text>
          ))}
          {eligibility.missingCorequisites.map((coreq) => (
            <Text key={coreq.subjectId} className="text-xs text-amber-800 ml-4 mt-0.5">
              • Co-requisite: <Text className="font-bold">{coreq.subjectCode}</Text> (Plan together in this term)
            </Text>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
        {onGradePress && (
          <TouchableOpacity
            onPress={onGradePress}
            className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-300">
            <Award size={14} color="#334155" />
            <Text className="text-xs font-semibold text-slate-700">
              {currentGrade !== undefined ? 'Edit Grade' : 'Input Grade'}
            </Text>
          </TouchableOpacity>
        )}

        {onTogglePlan && !isPassed && (
          <TouchableOpacity
            onPress={onTogglePlan}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
              isPlanned
                ? 'bg-sky-600 border-sky-700 active:bg-sky-700'
                : isEligible
                ? 'bg-emerald-600 border-emerald-700 active:bg-emerald-700'
                : 'bg-slate-200 border-slate-300'
            }`}>
            {isPlanned ? (
              <>
                <CheckCircle size={14} color="#ffffff" />
                <Text className="text-xs font-bold text-white">Planned</Text>
              </>
            ) : (
              <>
                <PlusCircle size={14} color={isEligible ? '#ffffff' : '#64748b'} />
                <Text className={`text-xs font-bold ${isEligible ? 'text-white' : 'text-slate-600'}`}>
                  {isEligible ? 'Add to Plan' : 'Plan Together'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}
