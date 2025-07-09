import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BookboostController } from './bookboost.controller';
import { BookboostService } from './bookboost.service';

@Module({
  imports: [HttpModule],
  controllers: [BookboostController],
  providers: [BookboostService],
  exports: [BookboostService],
})
export class BookboostModule {}
