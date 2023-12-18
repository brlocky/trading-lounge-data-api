import { Injectable } from '@nestjs/common';
import { SearchDto } from '../dto/search.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CandleDto, GetCandlesDto, GetCandlesResultDto, SearchResultDto } from 'src/dto';
import * as fastCsv from 'fast-csv';
import { Readable } from 'stream';
import * as moment from 'moment';

interface AlphaCandle {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  adjusted_close?: string;
  ['adjusted close']?: string;
}

interface AlphaSearchResult {
  '1. symbol': string;
  '2. name': string;
  '3. type': string;
  '4. region': string;
  '5. marketOpen': string;
  '6. marketClose': string;
  '7. timezone': string;
  '8. currency': string;
  '9. matchScore': string;
}

interface AlphaSearchResults {
  bestMatches: AlphaSearchResult[];
}

@Injectable()
export class DataService {
  apiKey: string;
  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('APIKEY') || 'demo';
  }

  async getCandles(getCandlesDto: GetCandlesDto): Promise<GetCandlesResultDto> {
    const { symbol, interval, to } = getCandlesDto;
    const emptyResponse = {
      symbol: symbol,
      interval: interval,
      candles: [],
      prevCandle: null,
      nextCandle: null,
    };

    const url = this.buildCandlesEndpoint(getCandlesDto);
    const response = await axios.get(url);

    if (response.status !== 200) {
      return emptyResponse;
    }
    const csvData = await this.parseCsvData(response.data);

    let candles = this.mapAlphaCandles(csvData, interval);
    if (to && to.time) {
      candles = candles.filter((c) => {
        return c.time < to.time;
      });
    }

    const prevCandle =
      candles[0] && Number(interval) > 0
        ? {
            symbol: symbol,
            interval: interval,
            time: candles[0].time,
          }
        : null;

    const nextCandle =
      candles.length > 1 && Number(interval) > 0
        ? {
            symbol: symbol,
            interval: interval,
            time: candles[candles.length - 1].time,
          }
        : null;

    return {
      ...emptyResponse,
      candles: candles,
      prevCandle: prevCandle,
      nextCandle: nextCandle,
    };
  }

  buildCandlesEndpoint(getCandlesDto: GetCandlesDto) {
    const { symbol, interval, to } = getCandlesDto;
    const isIntraday = Number(interval) > 0;

    if (isIntraday) {
      const month = to
        ? moment(new Date(to.time * 1000))
            .subtract(1, 'months')
            .format('YYYY-MM')
        : moment().format('YYYY-MM');
      return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&datatype=csv&interval=${interval}min&outputsize=full&apikey=${this.apiKey}&month=${month}`;
    }

    return `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&datatype=csv&apikey=${this.apiKey}`;
  }

  async search(executeSearchDto: SearchDto): Promise<SearchResultDto[]> {
    const url = this.buildSearchEndpoint(executeSearchDto);
    const response = await axios.get<AlphaSearchResults>(url);
    if (response.status !== 200) {
      return [];
    }
    const { bestMatches } = response.data;
    if (!bestMatches) {
      return [];
    }

    return bestMatches.map((m: AlphaSearchResult) => {
      return {
        symbol: m['1. symbol'],
        name: m['2. name'],
        type: m['3. type'],
        region: m['4. region'],
      };
    });
  }

  buildSearchEndpoint(executeSearchDto: SearchDto) {
    const { text } = executeSearchDto;
    return `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${text}&apikey=${this.apiKey}`;
  }

  async parseCsvData(csvData: string): Promise<AlphaCandle[]> {
    return new Promise((resolve) => {
      const jsonArray: AlphaCandle[] = [];

      const readableStream = Readable.from([csvData]);

      const csvStream = fastCsv
        .parse({ headers: true })
        .on('data', (row) => {
          jsonArray.push(row);
        })
        .on('end', () => {
          resolve(jsonArray);
        })
        .on('error', () => {
          resolve([]);
        });

      readableStream.pipe(csvStream);
    });
  }

  mapAlphaCandles(csvData: AlphaCandle[], interval: string): CandleDto[] {
    const candles = csvData.map((c) => {
      const x = c.adjusted_close || c['adjusted close'] || 0;
      const mult = Number(x) > 0 ? Number(x) / Number(c.close) : 1;

      return {
        time: new Date(c.timestamp).getTime() / 1000,
        open: Number(c.open) * mult,
        high: Number(c.high) * mult,
        low: Number(c.low) * mult,
        close: Number(c.close) * mult,
        volume: Number(c.volume),
      };
    });

    candles.sort((a, b) => {
      return a.time - b.time;
    });

    switch (interval) {
      case 'W':
        return this.aggregateCandlesByInterval(candles, 7); // 7 days in a week
      case 'M':
        return this.aggregateCandlesByInterval(candles, 30); // Assuming 30 days in a month
      // You can add more cases for other intervals if needed
      default:
        return candles;
    }
  }

  aggregateCandlesByInterval(candles: CandleDto[], interval: number): CandleDto[] {
    const result: CandleDto[] = [];
    let currentInterval: CandleDto[] = [];

    for (const candle of candles) {
      currentInterval.push(candle);

      if (currentInterval.length === interval) {
        result.push(this.aggregateCandles(currentInterval));
        currentInterval = [];
      }
    }

    // Handle the remaining candles if they don't fit perfectly into intervals
    if (currentInterval.length > 0) {
      result.push(this.aggregateCandles(currentInterval));
    }

    return result;
  }

  aggregateCandles(candles: CandleDto[]): CandleDto {
    const firstCandle = candles[0];
    const lastCandle = candles[candles.length - 1];

    return {
      time: firstCandle.time,
      open: firstCandle.open,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      close: lastCandle.close,
      volume: candles.reduce((total, c) => total + c.volume, 0),
    };
  }
}
