import { BadRequestException } from '@nestjs/common';

/** Throws a 400 when both bounds are given and `from` is not before `to`. */
export function assertOrderedRange(from?: Date, to?: Date): void {
  if (from && to && from >= to) throw new BadRequestException('from must be before to');
}
