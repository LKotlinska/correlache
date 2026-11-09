import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsInt, IsISO8601, IsOptional, IsPositive, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { HeadacheIntakeDto } from '../../medications/dto/create-intake.dto.js';
import { IsNotBefore } from '../../common/validators/is-not-before.js';
import { IsNotInFuture } from '../../common/validators/is-not-in-future.js';

// Cap prevents wasteful requests as lookup tables only have a handful of options
const MAX_LOOKUP_IDS = 50;
const MAX_INTAKES = 20;
// Requires an explicit timezone (Z or ±hh:mm) so Date.parse never falls back to server-local time.
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;

export class CreateHeadacheDto {
  @IsISO8601({ strict: true }) // Checks that the string looks like a standard date-time and that date exists
  @Matches(HAS_TIMEZONE, { message: 'startedAt must include a timezone' })
  @IsNotInFuture()
  startedAt: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(HAS_TIMEZONE, { message: 'endedAt must include a timezone' })
  @IsNotInFuture()
  @IsNotBefore('startedAt') // Checks so end date can't be earlier than start date
  endedAt?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  painLevel: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @IsArray()
  @ArrayMaxSize(MAX_LOOKUP_IDS)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  locationIds: number[];

  @IsArray()
  @ArrayMaxSize(MAX_LOOKUP_IDS)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  triggerIds: number[];

  @IsArray()
  @ArrayMaxSize(MAX_LOOKUP_IDS)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  symptomIds: number[];

  @IsArray()
  @ArrayMaxSize(MAX_LOOKUP_IDS)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  reliefIds: number[];

  /** The headache's doses. Left out, they are not touched; given, they replace the headache's doses. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_INTAKES)
  @ValidateNested({ each: true })
  @Type(() => HeadacheIntakeDto)
  intakes?: HeadacheIntakeDto[];
}
