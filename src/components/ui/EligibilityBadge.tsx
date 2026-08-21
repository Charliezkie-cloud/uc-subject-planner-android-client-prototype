import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EligibilityStatus } from '@/features/eligibility/types';

interface EligibilityBadgeProps {
  status: EligibilityStatus;
}

export function EligibilityBadge({ status }: EligibilityBadgeProps) {
  let badgeStyle = styles.eligibleBadge;
  let textStyle = styles.eligibleText;
  let label = 'Eligible';

  if (status === 'passed') {
    badgeStyle = styles.passedBadge;
    textStyle = styles.passedText;
    label = 'Passed';
  } else if (status === 'not_eligible') {
    badgeStyle = styles.notEligibleBadge;
    textStyle = styles.notEligibleText;
    label = 'Not Eligible';
  }

  return (
    <View style={[styles.baseBadge, badgeStyle]}>
      <Text style={[styles.baseText, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  baseText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passedBadge: {
    backgroundColor: '#dcfce7',
  },
  passedText: {
    color: '#15803d',
  },
  eligibleBadge: {
    backgroundColor: '#dbeafe',
  },
  eligibleText: {
    color: '#1d4ed8',
  },
  notEligibleBadge: {
    backgroundColor: '#fee2e2',
  },
  notEligibleText: {
    color: '#b91c1c',
  },
});
