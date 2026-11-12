import { Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '@nestjs/authentication';
import { DataSource } from 'typeorm';
import { HealthConsentGuard } from '../../user/health-consent.guard.js';
import { User } from '../../user/entities/user.entity.js';
import { replaceWithExampleData } from './load-example-data.js';
import type { ExampleDataSummary } from './load-example-data.js';

/**
 * Temporary, for public testing: fills the current user's account with a generated year of data.
 * Remove ExampleDataModule (and the button in Settings) once testing is over.
 */
@Controller('user/me/example-data')
@UseGuards(HealthConsentGuard)
export class ExampleDataController {
  constructor(private readonly dataSource: DataSource) {}

  /** Replaces the user's workouts, headaches and medications with the example year. */
  @Post()
  // Each call writes a few thousand rows, so it shares the auth routes' limit (5 per minute per IP)
  @UseGuards(ThrottlerGuard)
  load(@CurrentUser() user: User): Promise<ExampleDataSummary> {
    return this.dataSource.transaction((manager) => replaceWithExampleData(manager, user.id, new Date()));
  }
}
