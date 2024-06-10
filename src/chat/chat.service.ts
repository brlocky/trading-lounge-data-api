// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { ServerSentEvent } from 'replicate';
import { Observable } from 'rxjs';
import { ChatMessage, ChatRequestDto, AITickerInfo } from 'src/chat/dto/chat.dto';
import { AIService } from './ai/ai.service';
import { PromptService } from './prompt/prompt.service';
import { Prompt } from './prompt/prompts';

@Injectable()
export class ChatService {
  constructor(
    private readonly promptService: PromptService,
    private readonly aiService: AIService,
  ) {}

  private async getTickerInfo(messages: ChatMessage[]): Promise<AITickerInfo | null> {
    const tickerPrompt = this.promptService.getTickerPrompt(messages);

    try {
      const modelResponse = await this.aiService.runModel(tickerPrompt);
      const tickerTest = JSON.parse((modelResponse as string[]).join(''));
      console.log('ChatService - Got ticker info', tickerTest);
      return tickerTest;
    } catch (e) {
      console.error('Error on ticker identification', e);
    }

    return null;
  }

  private async getPrompt(messages: ChatMessage[]): Promise<Prompt> {
    const ticker = await this.getTickerInfo(messages);
    if (ticker) {
      const prompt = await this.promptService.getRagPrompt(messages, ticker);
      if (prompt) return prompt;
    }
    return this.promptService.getChatPrompt(messages);
  }

  async getInferenceStream(dto: ChatRequestDto): Promise<Observable<ServerSentEvent>> {
    const prompt = await this.getPrompt(dto.messages);
    const stream = this.aiService.inferenceModel(prompt);

    return new Observable<ServerSentEvent>((observer) => {
      (async () => {
        try {
          for await (const event of stream) {
            observer.next(event);
          }
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }
}
