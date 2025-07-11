import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { VisbookController } from './visbook.controller';
import { VisbookService } from './visbook.service';
import { VisbookIntegrationService } from './visbook.integration.service';
import { BookboostService } from 'src/modules/bookboost/bookboost.service';

@Module({
  imports: [HttpModule.register({ withCredentials: true })],
  controllers: [VisbookController],
  providers: [VisbookService, VisbookIntegrationService, BookboostService],
  exports: [],
})
export class VisbookIntegrationModule {}
