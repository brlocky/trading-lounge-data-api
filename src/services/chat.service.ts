import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate, { ServerSentEvent } from 'replicate';
import { Observable } from 'rxjs';

const input = {
  top_k: 0,
  top_p: 0.95,
  prompt: 'Hello',
  max_tokens: 512,
  temperature: 0.7,
  system_prompt: 'I am Trading Lounge AI, specializing in Elliott Wave Analysis. I provide text-based content in English.',
  length_penalty: 1,
  max_new_tokens: 512,
  stop_sequences: '<|end_of_text|>,<|eot_id|>',
  prompt_template:
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  presence_penalty: 0,
  log_performance_metrics: false,
};

@Injectable()
export class ChatService {
  aiClient: Replicate;
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('REPLICATE_API_TOKEN') || 'demo';
    this.aiClient = new Replicate({
      auth: apiKey,
      userAgent: 'https://www.npmjs.com/package/create-replicate',
    });
  }

  async *inferenceModel(prompt: string): AsyncGenerator<ServerSentEvent, any, unknown> {
    const model = 'meta/meta-llama-3-8b-instruct';
    input.prompt = prompt;

    for await (const event of this.aiClient.stream(model, { input })) {
      yield event;
    }
  }
  getInferenceStream(prompt: string): Observable<ServerSentEvent> {
    const stream = this.inferenceModel(prompt);

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
