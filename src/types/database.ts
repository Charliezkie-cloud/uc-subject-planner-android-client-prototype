export type SubjectPassStatus = 'passed' | 'failed';

export interface Program {
  id: number;
  programCode: string;
  programName: string;
  curriculumVersion: string;
  sourceFile?: string | null;
  importedAt: string;
}

export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  units: number;
}

export interface ProgramSubject {
  id: number;
  programId: number;
  subjectId: number;
  yearLevel: number;
  term: number;
}

export interface Prerequisite {
  id: number;
  programId: number;
  subjectId: number;
  prerequisiteSubjectId: number;
}

export interface Corequisite {
  id: number;
  programId: number;
  subjectId: number;
  corequisiteSubjectId: number;
}

export interface StudentProfile {
  id: number;
  programId: number | null;
  currentYearLevel: number | null;
  updatedAt: string;
}

export interface CompletedSubject {
  id: number;
  subjectId: number;
  grade: number;
  status: SubjectPassStatus;
  attemptNumber: number;
  schoolYear: string | null;
  termTaken: number | null;
  createdAt: string;
}

export interface SubjectStatusView {
  subjectId: number;
  grade: number;
  status: SubjectPassStatus;
  attemptNumber: number;
}

export interface PlannedSubject {
  id: number;
  subjectId: number;
  plannedSchoolYear: string;
  plannedTerm: number;
}

export interface AppSetting {
  key: string;
  value: string;
}
