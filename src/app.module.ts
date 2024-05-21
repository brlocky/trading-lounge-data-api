import { Module } from '@nestjs/common';
import { SearchController } from './search/search.controller';
import { CandlesController } from './candles/candles.controller';
import { DataService } from './services';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './services/chat.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [SearchController, CandlesController, ChatController],
  providers: [DataService, ChatService],
})
export class AppModule {}
