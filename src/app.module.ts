import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookboostModule } from './modules/bookboost/bookboost.module';

@Module({
  imports: [BookboostModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
