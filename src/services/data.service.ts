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

    let candles = this.mapAlphaCandles(csvData);
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
    } else {
      switch (interval) {
        case 'W':
          return `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${symbol}&datatype=csv&apikey=${this.apiKey}`;
        case 'D':
          return `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&datatype=csv&apikey=${this.apiKey}`;
      }
    }

    // Montly is fallback
    return `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${symbol}&datatype=csv&apikey=${this.apiKey}`;
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

  mapAlphaCandles(csvData: AlphaCandle[]): CandleDto[] {
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

    return candles;
  }
}
