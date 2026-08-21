export const PASSING_GRADE_THRESHOLD = 3.00;
export const MIN_GRADE = 1.00;
export const MAX_GRADE = 5.00;

export const TERMS = [
  { id: 1, label: '1st Semester', shortLabel: '1st Term' },
  { id: 2, label: '2nd Semester', shortLabel: '2nd Term' },
  { id: 3, label: 'Summer', shortLabel: 'Summer' },
] as const;

export const YEAR_LEVELS = [
  { id: 1, label: '1st Year' },
  { id: 2, label: '2nd Year' },
  { id: 3, label: '3rd Year' },
  { id: 4, label: '4th Year' },
] as const;

/** Curriculum years plus an optional 5th year for deferred / catch-up planning. */
export const PLAN_YEAR_LEVELS = [
  ...YEAR_LEVELS,
  { id: 5, label: '5th Year' },
] as const;

export const PLAN_BASE_SCHOOL_YEAR_START = 2025;

export function schoolYearForYearLevel(
  yearLevel: number,
  baseYearStart: number = PLAN_BASE_SCHOOL_YEAR_START
): string {
  return `${baseYearStart + yearLevel - 1}-${baseYearStart + yearLevel}`;
}

export function yearLevelFromSchoolYear(
  schoolYear: string,
  baseYearStart: number = PLAN_BASE_SCHOOL_YEAR_START
): number | null {
  const startYear = Number.parseInt(schoolYear.split('-')[0] ?? '', 10);
  if (Number.isNaN(startYear)) return null;
  return startYear - baseYearStart + 1;
}
