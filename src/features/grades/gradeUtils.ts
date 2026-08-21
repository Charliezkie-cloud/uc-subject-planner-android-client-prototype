import { PASSING_GRADE_THRESHOLD, MIN_GRADE, MAX_GRADE } from '@/constants/grades';
import { SubjectPassStatus } from '@/types/database';

/**
 * Validates if a numeric grade is within the valid Philippine 1.00 - 5.00 range.
 */
export function isValidGrade(grade: number): boolean {
  return !isNaN(grade) && grade >= MIN_GRADE && grade <= MAX_GRADE;
}

/**
 * Derives the pass/fail status from a numeric grade based on the Philippine scale.
 * Note: Database uses a GENERATED ALWAYS column for this; this helper is for pure client-side validations.
 */
export function deriveGradeStatus(grade: number): SubjectPassStatus {
  return grade <= PASSING_GRADE_THRESHOLD ? 'passed' : 'failed';
}

/**
 * Formats a grade number to standard 2 decimal places (e.g. 1.25, 3.00).
 */
export function formatGrade(grade: number): string {
  return grade.toFixed(2);
}
