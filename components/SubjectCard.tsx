import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { EligibilityBadge } from './EligibilityBadge';
import { SubjectEligibilityResult } from '@/features/eligibility/types';
import { formatGrade } from '@/features/grades/gradeUtils';
import { CheckCircle, PlusCircle, Award, AlertCircle, ArrowRightLeft } from 'lucide-react-native';

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
  /** e.g. "Y2 · Term 1" when planned in a different term than the one being viewed */
  plannedElsewhereLabel?: string | null;
  onGradePress?: () => void;
  onTogglePlan?: () => void;
  onMovePlan?: () => void;
}

export function SubjectCard({
  subjectCode,
  subjectName,
  units,
  eligibility,
  currentGrade,
  attemptNumber,
  isPlanned,
  plannedElsewhereLabel,
  onGradePress,
  onTogglePlan,
  onMovePlan,
}: SubjectCardProps) {
  const isPassed = eligibility?.status === 'passed' || (currentGrade !== undefined && currentGrade <= 3.0);
  const isEligible = eligibility?.status === 'eligible';
  const isNotEligible = eligibility?.status === 'not_eligible';

  // Grade only after planning (passed subjects may still edit an existing record).
  const canInputGrade = Boolean(onGradePress) && (isPlanned || isPassed);
  // Plan only when eligible; already-planned subjects may unplan.
  const canTogglePlan = Boolean(onTogglePlan) && !isPassed && (isEligible || isPlanned);
  const canMovePlan = Boolean(onMovePlan) && !isPassed && (isPlanned || Boolean(plannedElsewhereLabel));

  return (
    <Card className="my-1.5 mx-4 gap-0 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-bold text-slate-900">{subjectCode}</CardTitle>
            {isPlanned && (
              <View className="bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-sky-800">PLANNED</Text>
              </View>
            )}
            {!isPlanned && plannedElsewhereLabel ? (
              <View className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-amber-800">
                  PLANNED · {plannedElsewhereLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <CardDescription className="text-sm text-slate-600 mt-0.5">{subjectName}</CardDescription>
        </View>

        {eligibility && <EligibilityBadge status={eligibility.status} />}
      </View>

      <View className="flex-row justify-between items-center mt-1.5 pt-1.5 border-t border-slate-100">
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

      {isNotEligible && eligibility && (
        <View className="mt-2 p-2 bg-red-50/80 border border-red-200 rounded-lg">
          <View className="flex-row items-center gap-1.5 mb-1">
            <AlertCircle size={14} color="#dc2626" />
            <Text className="text-xs font-bold text-red-800">Prerequisite / Co-requisite Required:</Text>
          </View>
          {eligibility.missingPrerequisites.map((prereq) => (
            <Text key={prereq.subjectId} className="text-xs text-red-700 ml-4 mt-0.5">
              • Prereq required: <Text className="font-bold">{prereq.subjectCode}</Text> (Must be passed first)
            </Text>
          ))}
          {eligibility.missingYearRangePrerequisites?.map((yrPrereq) => {
            const ordinal = (n: number) => {
              if (n === 1) return '1st';
              if (n === 2) return '2nd';
              if (n === 3) return '3rd';
              return `${n}th`;
            };
            const requirementText =
              yrPrereq.throughYearLevel === 1
                ? 'Requires all 1st subjects'
                : `Requires all 1st to ${ordinal(yrPrereq.throughYearLevel)} subjects`;
            return (
              <Text key={yrPrereq.throughYearLevel} className="text-xs text-red-700 ml-4 mt-0.5">
                • <Text className="font-bold">{requirementText}</Text> (Must be passed first)
              </Text>
            );
          })}
          {eligibility.missingCorequisites.map((coreq) => (
            <Text key={coreq.subjectId} className="text-xs text-amber-800 ml-4 mt-0.5">
              • Co-requisite: <Text className="font-bold">{coreq.subjectCode}</Text> (Must be passed or planned in this term first)
            </Text>
          ))}
        </View>
      )}

      {(canInputGrade || canTogglePlan || canMovePlan) && (
        <View className="flex-row items-center justify-end gap-2 mt-2 pt-1.5 border-t border-slate-100 flex-wrap">
          {canInputGrade && (
            <TouchableOpacity
              onPress={onGradePress}
              className="flex-row items-center gap-1.5 px-3 py-1.5 bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-300">
              <Award size={14} color="#334155" />
              <Text className="text-xs font-semibold text-slate-700">
                {currentGrade !== undefined ? 'Edit Grade' : 'Input Grade'}
              </Text>
            </TouchableOpacity>
          )}

          {canMovePlan && (
            <TouchableOpacity
              onPress={onMovePlan}
              className="flex-row items-center gap-1.5 px-3 py-1.5 bg-white active:bg-slate-50 rounded-lg border border-slate-300">
              <ArrowRightLeft size={14} color="#0369a1" />
              <Text className="text-xs font-semibold text-sky-700">Move Term</Text>
            </TouchableOpacity>
          )}

          {canTogglePlan && (
            <TouchableOpacity
              onPress={onTogglePlan}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                isPlanned
                  ? 'bg-sky-600 border-sky-700 active:bg-sky-700'
                  : 'bg-emerald-600 border-emerald-700 active:bg-emerald-700'
              }`}>
              {isPlanned ? (
                <>
                  <CheckCircle size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Planned</Text>
                </>
              ) : (
                <>
                  <PlusCircle size={14} color="#ffffff" />
                  <Text className="text-xs font-bold text-white">Add to Plan</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
}
