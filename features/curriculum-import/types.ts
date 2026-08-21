export interface CurriculumSubjectDto {
  code: string;
  name: string;
  units: number;
  year_level: number;
  term: number;
}

export interface CurriculumPrerequisiteDto {
  subject: string;
  requires: string;
}

export interface CurriculumYearRangePrerequisiteDto {
  subject: string;
  through_year_level: number;
}

export interface CurriculumCorequisiteDto {
  subject: string;
  with: string;
}

export interface CurriculumPackageDto {
  program_code: string;
  program_name: string;
  curriculum_version: string;
  subjects: CurriculumSubjectDto[];
  prerequisites?: CurriculumPrerequisiteDto[];
  year_range_prerequisites?: CurriculumYearRangePrerequisiteDto[];
  corequisites?: CurriculumCorequisiteDto[];
}
