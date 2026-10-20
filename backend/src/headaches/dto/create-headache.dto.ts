import { IsArray, IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsNotBefore } from '../../common/validators/is-not-before.js';

export class CreateHeadacheDto {
  @IsDateString()
  startedAt: string;

  @IsOptional()
  @IsDateString()
  @IsNotBefore('startedAt') // Checks so end date can't be earlier than start date
  endedAt?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  painLevel: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsArray()
  @IsInt({ each: true })
  locationIds: number[];

  @IsArray()
  @IsInt({ each: true })
  triggerIds: number[];

  @IsArray()
  @IsInt({ each: true })
  symptomIds: number[];

  @IsArray()
  @IsInt({ each: true })
  reliefIds: number[];
}
