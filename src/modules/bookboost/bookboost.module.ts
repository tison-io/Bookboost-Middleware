import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BookboostService } from './bookboost.service';

@Module({
  imports: [
    HttpModule.register({
      withCredentials: true,
    }),
  ],
  providers: [BookboostService],
  exports: [BookboostService],
})
export class BookboostModule {}
