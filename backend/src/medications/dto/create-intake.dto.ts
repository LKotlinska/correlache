import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf } from 'class-validator';
import { IsNotBefore } from '../../common/validators/is-not-before.js';
import { IsNotInFuture } from '../../common/validators/is-not-in-future.js';
import { INTAKE_EFFECTS, MAX_DOSE_LENGTH } from '../medication-kinds.js';
import type { IntakeEffect } from '../medication-kinds.js';

// Requires an explicit timezone (Z or ±hh:mm) so Date.parse never falls back to server-local time.
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;

/** Fields shared by a dose logged on its own and one logged inside the headache form. */
export class IntakeFieldsDto {
  @IsUUID()
  medicationId: string;

  @IsISO8601({ strict: true })
  @Matches(HAS_TIMEZONE, { message: 'takenAt must include a timezone' })
  @IsNotInFuture()
  takenAt: string;

  @IsOptional() // the form sends null for an empty field
  @IsString()
  @MaxLength(MAX_DOSE_LENGTH)
  dose?: string | null;

  // Required once effectAt is given: a time for an effect that wasn't rated means nothing
  @ValidateIf((o: IntakeFieldsDto) => o.effect != null || o.effectAt != null)
  @IsIn(INTAKE_EFFECTS)
  effect?: IntakeEffect | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(HAS_TIMEZONE, { message: 'effectAt must include a timezone' })
  @IsNotInFuture()
  @IsNotBefore('takenAt')
  effectAt?: string | null;
}

/** A dose logged from the quick-add form, optionally linked to a headache. */
export class CreateIntakeDto extends IntakeFieldsDto {
  @IsOptional()
  @IsUUID()
  headacheId?: string | null;
}

/** A dose inside the headache form. `id` is set for doses already saved, so they are updated rather than replaced. */
export class HeadacheIntakeDto extends IntakeFieldsDto {
  @IsOptional()
  @IsUUID()
  id?: string;
}
