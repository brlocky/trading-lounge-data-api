import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import moment from 'moment';
import { SearchResultDto, GetCandlesDto, GetCandlesResultDto, CandleDto } from 'src/search/dto';
import { SearchProvider } from 'src/search/search-provider.interface';
import { Readable } from 'stream';
import * as fastCsv from 'fast-csv';

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
interface AlphaSearchResults {
  bestMatches: AlphaSearchResult[];
}

interface CompanyOverview {
  Symbol: string;
  AssetType: string;
  Name: string;
  Description: string;
  CIK: string;
  Exchange: string;
  Currency: string;
  Country: string;
  Sector: string;
  Industry: string;
  Address: string;
  FiscalYearEnd: string;
  LatestQuarter: string;
  MarketCapitalization: string;
  EBITDA: string;
  PERatio: string;
  PEGRatio: string;
  BookValue: string;
  DividendPerShare: string;
  DividendYield: string;
  EPS: string;
  RevenuePerShareTTM: string;
  ProfitMargin: string;
  OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string;
  ReturnOnEquityTTM: string;
  RevenueTTM: string;
  GrossProfitTTM: string;
  DilutedEPSTTM: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string;
  AnalystRatingStrongBuy: string;
  AnalystRatingBuy: string;
  AnalystRatingHold: string;
  AnalystRatingSell: string;
  AnalystRatingStrongSell: string;
  TrailingPE: string;
  ForwardPE: string;
  PriceToSalesRatioTTM: string;
  PriceToBookRatio: string;
  EVToRevenue: string;
  EVToEBITDA: string;
  Beta: string;
  '52WeekHigh': string;
  '52WeekLow': string;
  '50DayMovingAverage': string;
  '200DayMovingAverage': string;
  SharesOutstanding: string;
  DividendDate: string;
  ExDividendDate: string;
}

@Injectable()
export class AlphaVantageService implements SearchProvider {
  apiKey: string;
  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('APIKEY') || 'demo';
  }

  getIdentifier(): string {
    return 'AV';
  }

  getExchange(): string {
    return 'Alphavantage';
  }

  async search(query: string): Promise<SearchResultDto[]> {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${this.apiKey}`;
    const response = await axios.get<AlphaSearchResults>(url);
    if (response.status !== 200) {
      return [];
    }
    const { bestMatches } = response.data;
    if (!bestMatches) {
      return [];
    }

    const promises = bestMatches.map((m: AlphaSearchResult) => this.getCompanyOverview(m['1. symbol']));
    const getAllResultsCompanyInformation = await Promise.all(promises);

    return bestMatches.map((m: AlphaSearchResult) => {
      return {
        identifier: this.getIdentifier(),
        exchange: this.getExchange(),
        symbol: m['1. symbol'],
        name: m['2. name'],
        type: m['3. type'],
        region: m['4. region'],
      };
    });
  }

  async getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKey}`;
    const response = await axios.get<CompanyOverview>(url);
    if (response.status !== 200) {
      return null;
    }
    return response.data;
  }

  async getCandles(getCandlesDto: GetCandlesDto): Promise<GetCandlesResultDto> {
    const { symbol, interval, end } = getCandlesDto;
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
    if (end && end.time) {
      candles = candles.filter((c) => {
        return c.time <= end.time;
      });
    }

    const prevCandle = candles[0]
      ? {
          symbol: symbol,
          interval: interval,
          time: candles[0].time,
        }
      : null;

    const nextCandle =
      candles.length > 1
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
    const { symbol, interval, end } = getCandlesDto;
    const isIntraday = !['M', 'W', 'D'].includes(interval);
    if (isIntraday) {
      const alphavanteInterval = this.convertInterval(interval);
      const month = end
        ? moment(new Date(end.time * 1000))
            .subtract(1, 'months')
            .format('YYYY-MM')
        : undefined;

      return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&datatype=csv&interval=${alphavanteInterval}&outputsize=full&apikey=${this.apiKey}&month=${month}`;
    }

    return `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&datatype=csv&apikey=${this.apiKey}`;
  }

  convertInterval(interval: string) {
    switch (interval) {
      case '5m':
        return '5min';
      case '30m':
        return '30min';
      case '1h':
        return '60min';
      case '4h':
        return '60min';
    }

    return interval;
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
        return this.aggregateCandlesByInterval(candles, 'W'); // 7 days in a week
      case 'M':
        return this.aggregateCandlesByInterval(candles, 'M'); // Assuming 30 days in a month
      // You can add more cases for other intervals if needed
      default:
        return candles;
    }
  }

  aggregateCandlesByInterval(candles: CandleDto[], interval: string): CandleDto[] {
    const result: CandleDto[] = [];
    let currentInterval: CandleDto[] = [];
    let lastCandleTime: number | null = null;

    const isNextWeekStart = (currentDate: Date, lastDate: Date): boolean => {
      const currentWeekNumber = moment(currentDate).isoWeek();
      const lastWeekNumber = moment(lastDate).isoWeek();

      return currentWeekNumber !== lastWeekNumber;
    };

    const isNextMonthStart = (currentDate: Date, lastDate: Date): boolean => {
      return moment(currentDate).month() !== moment(lastDate).month();
    };

    for (const candle of candles) {
      const currentDate = new Date(candle.time * 1000);

      if (lastCandleTime !== null) {
        const lastCandleDate = new Date(lastCandleTime * 1000);
        // Check if the current candle time exceeds the next interval start
        if (
          (interval === 'W' && isNextWeekStart(currentDate, lastCandleDate)) ||
          (interval === 'M' && isNextMonthStart(currentDate, lastCandleDate))
        ) {
          // Start a new interval before adding the candle
          if (currentInterval.length > 0) {
            result.push(this.aggregateCandles(currentInterval));
            currentInterval = [];
          }
        }
      }

      currentInterval.push(candle);
      lastCandleTime = candle.time;
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
