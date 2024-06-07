import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SearchModule } from 'src/search/search.module';
import { TradingViewService } from 'src/search/providers';
import { ElliottWavesModule } from 'src/elliott-waves/elliott-waves.module';
import { AIService } from './ai/ai.service';
import { PromptService } from './prompt/prompt.service';
import { RAGService } from './prompt/rag.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, AIService, PromptService, RAGService],
  imports: [ElliottWavesModule, SearchModule.register([TradingViewService])],
})
export class ChatModule {}
