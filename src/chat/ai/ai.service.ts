// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate, { ServerSentEvent } from 'replicate';

@Injectable()
export class AIService {
  private aiClient: Replicate;
  private model: `${string}/${string}` = 'meta/meta-llama-3-70b-instruct';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('REPLICATE_API_TOKEN') || 'demo';
    this.aiClient = new Replicate({
      auth: apiKey,
      userAgent: 'https://www.npmjs.com/package/create-replicate',
    });
  }

  async runModel(input: object): Promise<any> {
    return this.aiClient.run(this.model, { input });
  }

  async *streamModel(input: object): AsyncGenerator<ServerSentEvent, any, unknown> {
    for await (const event of this.aiClient.stream(this.model, { input })) {
      yield event;
    }
  }

  async *inferenceModel(input: object): AsyncGenerator<ServerSentEvent, any, unknown> {
    yield* this.streamModel(input);
  }
}
