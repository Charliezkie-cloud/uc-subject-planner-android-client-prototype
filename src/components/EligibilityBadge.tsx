import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { EligibilityStatus } from '@/features/eligibility/types';

interface EligibilityBadgeProps {
  status: EligibilityStatus;
}

export function EligibilityBadge({ status }: EligibilityBadgeProps) {
  if (status === 'passed') {
    return (
      <Badge variant="secondary" className="bg-emerald-100 border-emerald-200">
        <Text className="text-emerald-700 font-semibold text-xs">Passed</Text>
      </Badge>
    );
  }

  if (status === 'not_eligible') {
    return (
      <Badge variant="destructive" className="bg-red-100 border-red-200">
        <Text className="text-red-700 font-semibold text-xs">Not Eligible</Text>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-blue-100 border-blue-200">
      <Text className="text-blue-700 font-semibold text-xs">Eligible</Text>
    </Badge>
  );
}
