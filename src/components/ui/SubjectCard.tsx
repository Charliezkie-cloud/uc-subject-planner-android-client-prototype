import React from 'react';
import { View } from 'react-native';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { EligibilityBadge } from './EligibilityBadge';
import { SubjectEligibilityResult } from '@/features/eligibility/types';

interface SubjectCardProps {
  subjectCode: string;
  subjectName: string;
  units: number;
  eligibility?: SubjectEligibilityResult;
}

export function SubjectCard({
  subjectCode,
  subjectName,
  units,
  eligibility,
}: SubjectCardProps) {
  return (
    <Card className="my-1.5 mx-4 p-4 gap-2">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <CardTitle className="text-base font-bold text-slate-900">{subjectCode}</CardTitle>
          <CardDescription className="text-sm text-slate-600 mt-0.5">{subjectName}</CardDescription>
        </View>
        {eligibility && <EligibilityBadge status={eligibility.status} />}
      </View>
      <View className="flex-row items-center mt-1">
        <Text className="text-xs text-slate-500 font-medium">{units} Units</Text>
      </View>
      {eligibility && eligibility.status === 'not_eligible' && (
        <View className="mt-2.5 pt-2 border-t border-red-100">
          {eligibility.missingPrerequisites.map((prereq) => (
            <Text key={prereq.subjectId} className="text-xs text-red-700 mt-0.5">
              • Prereq missing: {prereq.subjectCode}
            </Text>
          ))}
          {eligibility.missingCorequisites.map((coreq) => (
            <Text key={coreq.subjectId} className="text-xs text-red-700 mt-0.5">
              • Co-req missing: {coreq.subjectCode} (must plan in same term)
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
}
