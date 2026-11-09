import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseBoolPipe, ParseDatePipe, ParseIntPipe, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { User } from '../user/entities/user.entity.js';
import { MedicationService } from './medication.service.js';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { CreateIntakeDto } from './dto/create-intake.dto.js';
import { Medication } from './entities/medication.entity.js';
import { MedicationIntake } from './entities/medication-intake.entity.js';
import { assertOrderedRange } from '../common/validators/ordered-range.js';

@Controller('medications')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Get()
  getMedications(
    @CurrentUser() user: User,
    @Query('includeArchived', new ParseBoolPipe({ optional: true })) includeArchived?: boolean,
  ): Promise<Medication[]> {
    return this.medicationService.getMedications(user.id, includeArchived);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateMedicationDto): Promise<Medication> {
    return this.medicationService.createMedication(user.id, dto);
  }

  @Put(':id')
  update(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateMedicationDto): Promise<Medication> {
    return this.medicationService.updateMedication(user.id, id, dto);
  }

  /** Deletes the medication, or archives it when doses of it were logged. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.medicationService.removeMedication(user.id, id);
  }
}

@Controller('medication-intakes')
export class MedicationIntakeController {
  constructor(private readonly medicationService: MedicationService) {}

  @Get()
  getIntakes(
    @CurrentUser() user: User,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<MedicationIntake[]> {
    assertOrderedRange(from, to);
    return this.medicationService.getIntakes(user.id, from, to, limit);
  }

  @Get(':id')
  getIntakeById(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<MedicationIntake> {
    return this.medicationService.getIntakeById(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateIntakeDto): Promise<MedicationIntake> {
    return this.medicationService.createIntake(user.id, dto);
  }

  @Put(':id')
  update(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateIntakeDto): Promise<MedicationIntake> {
    return this.medicationService.updateIntake(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.medicationService.removeIntake(user.id, id);
  }
}
