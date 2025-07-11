import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookboostModule } from './modules/bookboost/bookboost.module';
import { VisbookIntegrationModule } from './modules/integrations/visbook/visbook.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BookboostModule,
    VisbookIntegrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
