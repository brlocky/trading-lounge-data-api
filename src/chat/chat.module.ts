import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SearchModule } from 'src/search/search.module';
import { AlphaVantageService, TradingViewService } from 'src/search/providers';
import { ElliottWavesModule } from 'src/elliott-waves/elliott-waves.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [ElliottWavesModule, SearchModule.register([AlphaVantageService, TradingViewService])],
})
export class ChatModule {}
