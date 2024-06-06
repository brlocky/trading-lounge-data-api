import { Injectable, Logger } from '@nestjs/common';
import moment from 'moment';
import { ElliottWavesService } from 'src/elliott-waves/elliott-waves.service';
import { Pivot } from 'src/elliott-waves/types';
import { SearchService } from 'src/search/search.service';

interface RagPivot {
  index: number;
  type: string;
  price: number;
  date: string;
}

interface RagData {
  degree: string;
  symbol: string;
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

  async loadRagData(symbol: string): Promise<RagData | null> {
    try {
      const candlesResult = await this.searchService.candles({
        symbol,
        interval: 'D',
        limit: 5000,
      });

      if (candlesResult?.candles.length) {
        const {
          degree: { title: degree },
          retracements,
        } = this.elliottWavesService.getPivotsInfo({
          candles: candlesResult.candles,
          definition: 30,
        });

        return this.prepareRagData(symbol, degree, retracements);
      }
    } catch (error) {
      console.log('Error loading Rag Data', error);
    }

    return null;
  }

  private prepareRagData(symbol: string, degree: string, retracements: Pivot[]): RagData | null {
    if (!retracements.length) return null;
    const pivots = retracements.map((r) => ({
      index: r.candleIndex,
      type: r.type === 1 ? 'H' : 'L',
      price: r.price,
      date: moment(new Date(r.time * 1000)).toString(),
    }));

    const lastPivot = retracements[retracements.length - 1];
    return {
      degree,
      symbol,
      date: moment(new Date(lastPivot.time * 1000)).toString(),
      price: lastPivot.price,
      pivots,
    };
  }
}
