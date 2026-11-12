import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { UserController } from './user.controller.js';
import { HealthConsentGuard } from './health-consent.guard.js';
import { ExportService } from './export.service.js';
import { HistorySummaryService } from './history-summary.service.js';
import { Headache } from '../headaches/entities/headache.entity.js';
import { Medication } from '../medications/entities/medication.entity.js';
import { MedicationIntake } from '../medications/entities/medication-intake.entity.js';
import { Workout } from '../exercise-library/entities/workout.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Headache, Medication, MedicationIntake, Workout])],
  controllers: [UserController],
  providers: [UserService, ExportService, HistorySummaryService, HealthConsentGuard],
  exports: [UserService, HealthConsentGuard],
})
export class UserModule {}
