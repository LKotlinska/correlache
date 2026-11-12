import { Module } from '@nestjs/common';
import { UserModule } from '../../user/user.module.js';
import { ExampleDataController } from './example-data.controller.js';

/** Temporary, for public testing: lets users load the example year into their own account. */
@Module({
  imports: [UserModule],
  controllers: [ExampleDataController],
})
export class ExampleDataModule {}
