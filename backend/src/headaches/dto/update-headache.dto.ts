import { PartialType } from '@nestjs/mapped-types';
import { CreateHeadacheDto } from './create-headache.dto.js';

export class UpdateHeadacheDto extends PartialType(CreateHeadacheDto) {}
