import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_DOSE_LENGTH, MAX_NAME_LENGTH, MEDICATION_CLASSES, MEDICATION_USES } from '../medication-kinds.js';
import type { MedicationClass, MedicationUse } from '../medication-kinds.js';

export class CreateMedicationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_NAME_LENGTH)
  name: string;

  @IsIn(MEDICATION_CLASSES)
  medicationClass: MedicationClass;

  @IsOptional() // the form sends null for an empty field
  @IsString()
  @MaxLength(MAX_DOSE_LENGTH)
  defaultDose?: string | null;

  @IsIn(MEDICATION_USES)
  use: MedicationUse;
}
