import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medication } from './entities/medication.entity.js';
import { MedicationIntake } from './entities/medication-intake.entity.js';
import { Headache } from '../headaches/entities/headache.entity.js';
import { MedicationService } from './medication.service.js';
import { MedicationController, MedicationIntakeController } from './medication.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Medication, MedicationIntake, Headache])],
  controllers: [MedicationController, MedicationIntakeController],
  providers: [MedicationService],
  // The headache form saves its doses through MedicationService
  exports: [MedicationService],
})
export class MedicationModule {}
