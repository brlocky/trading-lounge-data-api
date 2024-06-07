import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GetCandlesDto, GetCandlesResultDto, GetQuoteDto, GetQuoteResultDto, QuoteResult } from 'src/search/dto';
import { SearchResultDto } from 'src/search/dto/search-result.dto';
import { SearchProvider } from 'src/search/search-provider.interface';
import countries from 'i18n-iso-countries';

// eslint-disable-next-line @typescript-eslint/no-var-requires
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

interface ICandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  datetime: string;
}

interface ISearchResult {
  symbol: string;
  description: string;
  type: string;
  exchange: string;
  country: string;
}

@Injectable()
export class TradingViewService implements SearchProvider {
  apiEndpoint: string;
  constructor(private readonly configService: ConfigService) {
    this.apiEndpoint = this.configService.get<string>('API_TV_DATA')!;
  }

  convertToCountryName(country: string): string {
    const c = countries.getName(country, 'en') || country;
    return c;
  }

  async search(query: string): Promise<SearchResultDto[]> {
    try {
      const url = `${this.apiEndpoint}/search`;
      const response = await axios.post<{ symbols: ISearchResult[] }>(url, { query });
      if (response.status === 200) {
        return response.data.symbols.slice(0, 20).map((r) => {
          return {
            identifier: this.getIdentifier(),
            exchange: r.exchange,
            symbol: r.symbol.replace(/<[^>]*>/g, ''),
            name: r.description.replace(/<[^>]*>/g, ''),
            type: r.type.toUpperCase(),
            region: this.convertToCountryName(r.country) || '-',
          };
        }) as SearchResultDto[];
      }
    } catch (e) {
      console.error('Fail search', query);
    }

    return [];
  }

  async getCandles(request: GetCandlesDto): Promise<GetCandlesResultDto> {
    const { interval, limit = 1000 } = request;
    const result = {
      symbol: request.symbol,
      interval,
      candles: [],
      prevCandle: null,
      nextCandle: null,
    };

    try {
      const [exchange, symbol] = request.symbol.split(':');
      const url = `${this.apiEndpoint}/get_data`;
      const response = await axios.post<ICandle[]>(url, { symbol, exchange, interval, limit });
      if (response.status !== 200) {
        return result;
      }

      return {
        ...result,
        candles: response.data.map((c) => ({
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          time: new Date(c.datetime).getTime() / 1000,
        })),
      };
    } catch (e) {
      console.error('Fail to get candles', request.symbol);
    }

    return result;
  }

  getIdentifier(): string {
    return 'TV';
  }

  async getQuote(request: GetQuoteDto): Promise<GetQuoteResultDto> {
    const { symbols } = request;

    const promises = symbols.map((s) => this.getCandles({ symbol: s, interval: 'D', limit: 1 }));
    const candleResult = await Promise.all(promises);

    const quotes = candleResult
      .map((candleResult, i) => {
        const { candles } = candleResult;
        if (!candles.length) return null;
        const candle = candles[0];
        return {
          symbol: symbols[i],
          price: candle.close,
          date: candle.time,
        };
      })
      .filter((r) => r) as QuoteResult[];

    return {
      quotes,
    };
  }
}
