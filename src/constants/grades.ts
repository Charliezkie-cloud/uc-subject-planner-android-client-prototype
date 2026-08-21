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
