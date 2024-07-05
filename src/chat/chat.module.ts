import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SearchModule } from 'src/search/search.module';
import { TradingViewService } from 'src/search/providers';
import { ElliottWavesModule } from 'src/elliott-waves/elliott-waves.module';
import { PromptService } from './prompt/prompt.service';
import { RAGService } from './prompt/rag.service';
import { AIModule } from 'src/ai/ai.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService, PromptService, RAGService],
  imports: [AIModule, ElliottWavesModule, SearchModule.register([TradingViewService])],
})
export class ChatModule {}
