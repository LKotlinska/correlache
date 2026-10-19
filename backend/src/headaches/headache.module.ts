import { Module } from '@nestjs/common';
import { HeadacheService } from './headache.service.js';
import { HeadacheController } from './headache.controller.js';
import { HeadacheLocation } from './lookups/headache-location.entity.js';
import { Trigger } from './lookups/trigger.entity.js';
import { Symptom } from './lookups/symptom.entity.js';
import { ReliefMeasure } from './lookups/relief-measure.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([HeadacheLocation, Trigger, Symptom, ReliefMeasure])],
  controllers: [HeadacheController],
  providers: [HeadacheService],
})
export class HeadacheModule {}
