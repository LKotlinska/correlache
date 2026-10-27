import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsNotInFuture } from '../../common/validators/is-not-in-future.js';

// Caps prevent wasteful requests
const MAX_EXERCISES = 100;
const MAX_SETS = 100;
const MAX_DURATION_SECONDS = 24 * 60 * 60 - 1;
// Requires an explicit timezone (Z or ±hh:mm) so Date.parse never falls back to server-local time.
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;

export class CreateWorkoutSetDto {
  @IsOptional() // the form sends null for an empty field
  @IsNumber()
  @Min(0)
  @Max(10000)
  weight?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  reps?: number | null;
}

export class CreateWorkoutExerciseDto {
  // Id in the exercise library. The name is looked up from it, not taken from the client.
  @IsInt()
  @IsPositive()
  exerciseId: number;

  @IsArray()
  @ArrayMaxSize(MAX_SETS)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutSetDto)
  sets: CreateWorkoutSetDto[];
}

export class CreateWorkoutDto {
  @IsString()
  @Matches(/\S/, { message: 'title must not be empty' })
  @MaxLength(150)
  title: string;

  @IsISO8601({ strict: true })
  @Matches(HAS_TIMEZONE, { message: 'startedAt must include a timezone' })
  @IsNotInFuture()
  startedAt: string;

  @IsInt()
  @Min(0)
  @Max(MAX_DURATION_SECONDS)
  durationSeconds: number;

  // The array order is the exercise order
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EXERCISES)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutExerciseDto)
  exercises: CreateWorkoutExerciseDto[];
}
