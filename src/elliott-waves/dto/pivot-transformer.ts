import { PivotDto } from 'src/search/dto';
import { Pivot } from '../class';
import { Candle } from '../types';

export class PivotTransformer {
  static transform(candles: Candle[], pivots: PivotDto[] | Pivot[]): Pivot[] {
    return pivots.map((pivot) => {
      const index = candles.findIndex((c) => c.time === pivot.time);
      return new Pivot(index, pivot.type, pivot.price, pivot.time, pivot.id);
    });
  }
}
