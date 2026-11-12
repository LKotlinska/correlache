import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateWorkoutDto } from './create-workout.dto.js';

// Keeps a request well under Express's default 100 kB body limit. The frontend sends batches of this size.
export const MAX_IMPORT_BATCH = 20;

/** A batch of workouts imported from another app, each checked like one entered by hand. */
export class ImportWorkoutsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPORT_BATCH)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutDto)
  workouts: CreateWorkoutDto[];
}

export class ImportWorkoutsResultDto {
  imported: number;
  /** Already saved with the same start and title, e.g. from importing the same file before */
  skipped: number;
}
