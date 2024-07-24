import { Injectable, Logger } from '@nestjs/common';
import moment from 'moment';
import { ElliottWavesService } from 'src/elliott-waves/elliott-waves.service';
import { SearchService } from 'src/search/search.service';
import { AITickerInfo } from '../dto';
import { Pivot } from 'src/elliott-waves/class';
import { Candle } from 'src/elliott-waves/types';
import { CandleDto } from 'src/search/dto';

interface RagPivot {
  type: string;
  price: number;
  date: string;
}

interface RagData {
  degree: string;
  symbol: string;
  interval: string;
  lastDate: string;
  lastPrice: number;
  lastPivotTime: number;
  pivots: RagPivot[];
  lastCandles: CandleDto[];
}

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly elliottWavesService: ElliottWavesService,
  ) {}

  async loadRagData(tickerInfo: AITickerInfo): Promise<RagData[] | null> {
    const { ticker, interval } = tickerInfo;
    try {
      const weeklyInfo = await this.getPivotsInfo(ticker, 'M', 13);

      if (!weeklyInfo) return null;

      const ragData: RagData[] = [];
      const dailyRagData = this.prepareRagData(ticker, 'M', weeklyInfo.degree, weeklyInfo.retracements, weeklyInfo.candles);
      ragData.push(dailyRagData);
      if (interval === 'D') {
        return ragData;
      }

      const intradayInfo = await this.getPivotsInfo(ticker, 'D', 7, dailyRagData.lastPivotTime);
      if (!intradayInfo) return ragData;
      const intradayRagData = this.prepareRagData(ticker, 'D', intradayInfo.degree, intradayInfo.retracements, intradayInfo.candles);
      ragData.push(intradayRagData);

      return ragData;
    } catch (error) {
      console.log('Error loading Rag Data', error);
    }

    return null;
  }

  private async getPivotsInfo(
    ticker: string,
    interval: string,
    definition: number = 30,
    filterAfter: number | undefined = undefined,
  ): Promise<{ degree: string; retracements: Pivot[]; candles: CandleDto[] } | null> {
    const candlesResult = await this.searchService.candles({
      symbol: ticker,
      interval: interval,
      limit: 5000,
      from: filterAfter,
    });

    if (!candlesResult?.candles.length) {
      return null;
    }

    const candles = candlesResult.candles;

    const {
      degree: { title: degree },
      retracements,
    } = this.elliottWavesService.getCandlesInfo(candles as Candle[], definition);

    const lastRetracement = retracements[retracements.length - 1];
    return {
      degree,
      retracements,
      candles: !lastRetracement ? [] : candles.filter((c) => c.time >= lastRetracement.time),
    };
  }

  private prepareRagData(ticker: string, interval: string, degree: string, retracements: Pivot[], remainingCandles: CandleDto[]): RagData {
    const pivots = retracements.map((r) => ({
      type: r.type === 1 ? 'H' : 'L',
      price: r.price,
      date: moment(new Date(r.time * 1000)).format('YYYY-MM-DD HH:mm'),
    }));

    const lastRetracement = retracements[retracements.length - 1];
    const lastCandle = remainingCandles[remainingCandles.length - 1];
    return {
      degree,
      interval,
      symbol: ticker,
      lastDate: moment(new Date(lastCandle.time * 1000)).format('YYYY-MM-DD HH:mm'),
      lastPrice: lastCandle.close,
      lastPivotTime: lastRetracement.time,
      pivots,
      lastCandles: remainingCandles.slice(-30),
    };
  }
}
