import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate, { ServerSentEvent } from 'replicate';
import { Observable } from 'rxjs';
import { ChatMessage, ChatRequestDto } from 'src/chat/dto/chat.dto';
import { ElliottWavesService } from 'src/elliott-waves/elliott-waves.service';
import { Pivot } from 'src/elliott-waves/types';
import { SearchService } from 'src/search/search.service';

const inputAnalyst = {
  prompt: 'Hello',
  messages: [],
  top_k: 0,
  top_p: 0.95,
  max_tokens: 512,
  temperature: 0.7,
  /*   system_prompt: `
  I am Trading Lounge AI, specializing in Elliott Wave Analysis.
  I will provide Elliott Wave Analysis when Pivot Points and Degree are provided.
  I can provide information about live data once I have the Pivot Points.
  I will use all of the Pivot Points to performance my analysis and will include special focus on the last waves.
  Pivot points will have information about the time, price, pivot type and index from where they were extracted.
  `, */
  system_prompt: `
  I am Trading Lounge AI, specializing in Elliott Wave Analysis.
  I will provide Elliott Wave Analysis when Pivot Points and Degree are provided.
  I can provide information about live data once I have the Pivot Points.
  I will use all of the Pivot Points to performance my analysis and will include special focus on the last waves.
  Pivot points will have information about the time, price, pivot type and index from where they were extracted.
  `,
  length_penalty: 1,
  max_new_tokens: 512,
  stop_sequences: '<|end_of_text|>,<|eot_id|>',
  prompt_template:
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  presence_penalty: 0,
  log_performance_metrics: false,
};

const inputTickerDetector = {
  prompt: 'Hello',
  messages: [],
  top_k: 0,
  top_p: 0.95,
  max_tokens: 512,
  temperature: 0.7,
  system_prompt: `You are a robot specialized in finding any financial market tickers.
Your only task is to identify 1 ticker in the following text. 
 Your response will be json {"ticker": $TICKER1}
For stocks you should prepend "NASDAQ:$TICKER"
For indices you should prepend "INDEX:$TICKER"
For crypto you should prepend "BINANCE:$TICKER"`,
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
  model: `${string}/${string}` = 'meta/meta-llama-3-8b-instruct';

  constructor(
    private readonly configService: ConfigService,
    private readonly searchService: SearchService,
    private readonly elliottWaveService: ElliottWavesService,
  ) {
    const apiKey = this.configService.get<string>('REPLICATE_API_TOKEN') || 'demo';
    this.aiClient = new Replicate({
      auth: apiKey,
      userAgent: 'https://www.npmjs.com/package/create-replicate',
    });
  }

  preparePrompt(messages: ChatMessage[], data: string | undefined = undefined): string {
    const limitedHistory = messages.slice(-10);
    const messageHistory = limitedHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
    const prompt = `${messageHistory}\n${data === undefined ? '' : data}\n\n\nassistant: `;
    return prompt;
  }

  prepareCandleData(degree: string, retracements: Pivot[]): string {
    const lastPivot = retracements[retracements.length - 1];
    const lastPrice = lastPivot ? lastPivot.price : 0;
    const lastDate = lastPivot ? new Date(lastPivot.time * 1000).toString() : null;
    const pivots = retracements.map((r) => ({
      index: r.candleIndex,
      type: r.type === 1 ? 'H' : 'L',
      price: r.price,
      time: new Date(r.time * 1000).toString(),
    }));
    const text = `\n\nLast Candle Date: ${lastDate}\nLast Price: ${lastPrice}\n Degree: ${degree}\Pivot Points: ${JSON.stringify(
      pivots,
    )}\n\n\n`;
    return text;
  }

  async getChartDataPrompt(messages: ChatMessage[]): Promise<string | null> {
    const ticker2Load = await this.searchForSymbols(messages);

    if (ticker2Load) {
      console.log('Found Ticker', ticker2Load);
      const candlesResult = await this.searchService
        .candles({
          symbol: ticker2Load,
          interval: 'D',
        })
        .catch();
      console.log('Candles Result Ticker', candlesResult?.candles.length);
      if (candlesResult) {
        const {
          degree: { title: degree },
          retracements,
        } = this.elliottWaveService.getPivotsInfo({
          candles: candlesResult.candles,
          definition: 50,
        });

        console.log('degree', degree);
        console.log('retracements', retracements.length);

        return this.prepareCandleData(degree, retracements);
      }
    }

    return null;
  }

  async *inferenceModel(input: object): AsyncGenerator<ServerSentEvent, any, unknown> {
    for await (const event of this.aiClient.stream(this.model, { input: input })) {
      yield event;
    }
  }

  async searchForSymbols(messages: ChatMessage[]): Promise<string | null> {
    const prompt = this.preparePrompt(messages);
    const input = {
      ...inputTickerDetector,
      prompt,
    };
    try {
      const output = await this.aiClient.run(this.model, { input: input });
      const tickerTest = JSON.parse((output as string[]).join(''));
      return tickerTest.ticker;
    } catch (e) {
      console.log(e);
    }

    return null;
  }

  async getInferenceStream(dto: ChatRequestDto): Promise<Observable<ServerSentEvent>> {
    const chartDataPrompt = await this.getChartDataPrompt(dto.messages);

    const prompt = this.preparePrompt(dto.messages, chartDataPrompt || undefined);
    const input = {
      ...inputAnalyst,
      prompt: prompt,
    };

    const stream = this.inferenceModel(input);

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
