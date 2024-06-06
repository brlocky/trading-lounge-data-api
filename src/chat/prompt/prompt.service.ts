// src/prompt/prompt.service.ts
import { Injectable } from '@nestjs/common';
import { ChatMessage } from 'src/chat/dto/chat.dto';
import { chatAnalystPrompt, Prompt, ragAnalystPrompt, tickerDetectorPrompt } from './prompts';
import { RAGService } from './rag.service';

@Injectable()
export class PromptService {
  constructor(private readonly ragService: RAGService) {}

  private getPrompt(messages: ChatMessage[], limit: number = 10): string {
    const limitedHistory = messages.slice(0 - limit);
    const messageHistory = limitedHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
    return `${messageHistory}\nassistant: `;
  }

  getTickerPrompt(messages: ChatMessage[]): Prompt {
    const prompt = this.getPrompt(messages, 1);
    return { ...tickerDetectorPrompt, prompt };
  }

  getChatPrompt(messages: ChatMessage[]): Prompt {
    const prompt = this.getPrompt(messages, 10);
    return { ...chatAnalystPrompt, prompt };
  }

  async getRagPrompt(messages: ChatMessage[], symbol: string): Promise<Prompt | null> {
    const prompt = this.getPrompt(messages, 5);

    const ragData = await this.ragService.loadRagData(symbol);
    if (!ragData) return null;

    const systemPrompt = ragAnalystPrompt.system_prompt + JSON.stringify(ragData);

    return { ...ragAnalystPrompt, prompt, system_prompt: systemPrompt };
  }
}
