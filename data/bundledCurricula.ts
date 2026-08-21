import { CurriculumPackageDto } from '@/features/curriculum-import/types';
import bsit2024_2025 from './BSIT/2024-2025.json';

/**
 * Bundled curriculum packages, keyed by program folder then version file.
 * Add a new prospectus by dropping JSON under data/<PROGRAM_CODE>/ and registering it here.
 */
export interface BundledCurriculum {
  sourceFile: string;
  data: CurriculumPackageDto;
}

export const BUNDLED_CURRICULA: BundledCurriculum[] = [
  { sourceFile: 'BSIT/2024-2025.json', data: bsit2024_2025 as CurriculumPackageDto },
];
