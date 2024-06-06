import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import moment from 'moment';
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
  system_prompt: `
  I am Trading Lounge AI, specializing in Elliott Wave Analysis.
  I don't have access to market data or any prices in general.
  `,

  length_penalty: 1,
  max_new_tokens: 2048,
  stop_sequences: '<|end_of_text|>,<|eot_id|>',
  prompt_template:
    '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  presence_penalty: 0,
  log_performance_metrics: false,
};

const inputWaveAnalyst = {
  prompt: 'Hello',
  messages: [],
  top_k: 0,
  top_p: 0.95,
  max_tokens: 512,
  temperature: 0.7,
  system_prompt: `
  I am Trading Lounge AI, specializing in Elliott Wave Analysis.
  I will provide Elliott Wave Analysis with provided information.
  Pivot points will have information about the date, price, pivot type.\n
  I will use all of the Pivot Points to performance my analysis and will include special focus on the last dates and prices.\n
  I will include ticker and relevant information.\n
  `,
  length_penalty: 1,
  max_new_tokens: 2048,
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
  system_prompt: `You are a robot specialized in finding any financial market tickers and main exchange.
Your only task is to identify 1 exchange:ticker from the provided text.
Sometimes the user will specify the exact ticker already with the correct prepend.
Ticker are always simple don't use special characters, however they always have the format EXCHANGE:TICKER.
Stocks and indices use one of the following exchanges: XETR, NYSE, NASDAQ, LSE, TSE, SSE, HKEX, Euronext, SZSE, TSX, BSE, NSE, ASX, INDEX
Crypto use BINANCE
The format should be like so "EXCHANGE:TICKER".
Your response will only be json {"ticker": TICKER}.`,
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
  model: `${string}/${string}` = 'meta/meta-llama-3-70b-instruct';

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
    const extraData = data ? `\n\n#THIS DATA SHOULD BE HIDDEN TO THE USER#\n\n${data}\n\n` : '';
    const prompt = `${messageHistory}\n${extraData}\nassistant: `;
    return prompt;
  }

  prepareCandleData(ticker: string, degree: string, retracements: Pivot[]): string {
    const pivots = retracements.map((r) => ({
      index: r.candleIndex,
      type: r.type === 1 ? 'H' : 'L',
      price: r.price,
      date: moment(new Date(r.time * 1000)).toString(),
    }));
    const lastPivot = retracements[retracements.length - 1];
    const lastPrice = lastPivot ? lastPivot.price : 0;
    const lastDate = lastPivot ? moment(new Date(lastPivot.time * 1000)).toString() : null;
    const text = `\n\nDetected Ticker: ${ticker}\n\nLast Candle Date: ${lastDate}\nLast Price: ${lastPrice}\n Degree: ${degree}\Pivot Points: ${JSON.stringify(
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
          limit: 5000,
        })
        .catch();
      console.log('Candles Result Ticker', candlesResult?.candles.length);
      if (candlesResult?.candles.length) {
        const {
          degree: { title: degree },
          retracements,
        } = this.elliottWaveService.getPivotsInfo({
          candles: candlesResult.candles,
          definition: 20,
        });

        console.log('degree', degree);
        console.log('retracements', retracements.length);

        return this.prepareCandleData(ticker2Load, degree, retracements);
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

    const analyst = chartDataPrompt
      ? {
          ...inputWaveAnalyst,
          system_prompt: inputWaveAnalyst.system_prompt + chartDataPrompt,
        }
      : inputAnalyst;
    const prompt = this.preparePrompt(dto.messages);
    const input = {
      ...analyst,
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
