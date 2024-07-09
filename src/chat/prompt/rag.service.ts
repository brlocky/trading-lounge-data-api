import { Injectable, Logger } from '@nestjs/common';
import moment from 'moment';
import { ElliottWavesService } from 'src/elliott-waves/elliott-waves.service';
import { Pivot } from 'src/elliott-waves/types';
import { SearchService } from 'src/search/search.service';
import { AITickerInfo } from '../dto';

interface RagPivot {
  index: number;
  type: string;
  price: number;
  date: string;
}

interface RagData {
  degree: string;
  symbol: string;
  interval: string;
  date: string;
  price: number;
  pivots: RagPivot[];
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
      const dailyInfo = await this.getPivotsInfo(ticker, 'D');

      if (!dailyInfo) return null;

      const ragData: RagData[] = [];
      const dailyRagData = this.prepareRagData(ticker, 'D', dailyInfo.degree, dailyInfo.retracements);
      ragData.push(dailyRagData);
      if (interval === 'D') {
        return ragData;
      }

      const intradayInfo = await this.getPivotsInfo(ticker, '1h', 50);
      if (!intradayInfo) return ragData;
      const intradayRagData = this.prepareRagData(ticker, '1h', intradayInfo.degree, intradayInfo.retracements);
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
  ): Promise<{ degree: string; retracements: Pivot[] } | null> {
    const candlesResult = await this.searchService.candles({
      symbol: ticker,
      interval: interval,
      limit: 5000,
    });

    if (!candlesResult?.candles.length) {
      return null;
    }

    const {
      degree: { title: degree },
      retracements,
    } = this.elliottWavesService.getCandlesInfo(candlesResult.candles, definition);

    return {
      degree,
      retracements,
    };
  }

  private prepareRagData(ticker: string, interval: string, degree: string, retracements: Pivot[]): RagData {
    const pivots = retracements.map((r) => ({
      index: r.candleIndex,
      type: r.type === 1 ? 'H' : 'L',
      price: r.price,
      date: moment(new Date(r.time * 1000)).toString(),
    }));

    const lastPivot = retracements[retracements.length - 1];
    return {
      degree,
      interval,
      symbol: ticker,
      date: moment(new Date(lastPivot.time * 1000)).toString(),
      price: lastPivot.price,
      pivots,
    };
  }
}
