import { Module } from '@nestjs/common';
import { SearchController } from './search/search.controller';
import { CandlesController } from './candles/candles.controller';
import { DataService } from './services';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables
  ],
  controllers: [SearchController, CandlesController],
  providers: [DataService],
})
export class AppModule {}
