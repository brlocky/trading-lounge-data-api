import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GetCandlesDto, GetCandlesResultDto } from 'src/search/dto';
import { SearchResultDto } from 'src/search/dto/search-result.dto';
import { SearchProvider } from 'src/search/search-provider.interface';

interface ICandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  datetime: string;
}
@Injectable()
export class TradingViewService implements SearchProvider {
  apiEndpoint: string;
  constructor(private readonly configService: ConfigService) {
    this.apiEndpoint = this.configService.get<string>('API_TV_DATA')!;
  }

  async search(): Promise<SearchResultDto[]> {
    return [];
  }

  async getCandles(request: GetCandlesDto): Promise<GetCandlesResultDto | null> {
    const { interval } = request;
    const [exchange, symbol] = request.symbol.split(':');
    const url = this.buildCandlesEndpoint(symbol, exchange, interval);
    const response = await axios.get<ICandle[]>(url);
    if (response.status !== 200) {
      return null;
    }

    return {
      symbol: request.symbol,
      interval,
      candles: response.data.map((c) => ({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        time: new Date(c.datetime).getTime() / 1000,
      })),
      prevCandle: null,
      nextCandle: null,
    };
  }

  buildCandlesEndpoint(symbol: string, exchange: string, interval: string) {
    return `${this.apiEndpoint}/get_data?symbol=${symbol}&exchange=${exchange}&interval=${interval}`;
  }

  getIdentifier(): string {
    return 'TV';
  }

  getExchange(): string {
    return 'TradingView';
  }
}
