import { SubjectPassStatus } from '@/types/database';

export interface SubjectInput {
  id: number;
  subjectCode: string;
  subjectName: string;
  units: number;
  yearLevel?: number;
  term?: number;
}

export interface PrerequisiteEdge {
  subjectId: number;
  prerequisiteSubjectId: number;
}

export interface CorequisiteEdge {
  subjectId: number;
  corequisiteSubjectId: number;
}

export interface SubjectStatusInput {
  subjectId: number;
  status: SubjectPassStatus;
  grade?: number;
  attemptNumber?: number;
}

export interface PlannedSubjectInput {
  subjectId: number;
  plannedSchoolYear: string;
  plannedTerm: number;
}

export interface MissingRequirement {
  type: 'prerequisite' | 'corequisite';
  subjectId: number;
  subjectCode: string;
  subjectName?: string;
  reason: string;
}

export type EligibilityStatus = 'passed' | 'eligible' | 'not_eligible';

export interface SubjectEligibilityResult {
  subjectId: number;
  subjectCode: string;
  status: EligibilityStatus;
  isEligible: boolean;
  isPassed: boolean;
  missingPrerequisites: MissingRequirement[];
  missingCorequisites: MissingRequirement[];
  unmetRequirementsCount: number;
}

export interface EvaluateEligibilityParams {
  subjects: SubjectInput[];
  prerequisites: PrerequisiteEdge[];
  corequisites: CorequisiteEdge[];
  subjectStatuses: SubjectStatusInput[];
  plannedSubjects: PlannedSubjectInput[];
  targetPlanningTerm?: {
    plannedSchoolYear: string;
    plannedTerm: number;
  };
}
