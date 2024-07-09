import { CandleDto } from 'src/search/dto';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { getTrend } from '../class/utils/pivot.utils';
import { Trend } from '../enums';
import { Pivot } from '../types';

export abstract class BaseWaveInterface {
  protected candles: CandleDto[] = [];
  protected pivots: Pivot[] = [];
  protected trend: Trend;
  protected fibonacci: Fibonacci;
  protected targetPivot: Pivot | null;

  public load(candles: CandleDto[], pivots: Pivot[], fibonacci: Fibonacci) {
    this.candles = candles;
    this.pivots = pivots;
    this.fibonacci = fibonacci;
    this.trend = getTrend(this.candles);
  }

  public setTargetPivot(pivot: Pivot) {
    this.targetPivot = pivot;
  }

  protected useTargetPivot() {
    return !!this.targetPivot;
  }

  public isSupportBroken(support: Pivot | number, test: Pivot | number): boolean {
    const supportPrice = this.isPivot(support) ? support.price : support;
    const testPrice = this.isPivot(test) ? test.price : test;
    return this.trend === Trend.UP ? testPrice < supportPrice : testPrice > supportPrice;
  }

  public isResistanceBroken(resistance: Pivot | number, test: Pivot | number): boolean {
    const resistancePrice = this.isPivot(resistance) ? resistance.price : resistance;
    const testPrice = this.isPivot(test) ? test.price : test;
    return this.trend === Trend.UP ? testPrice > resistancePrice : testPrice < resistancePrice;
  }

  private isPivot(test: any): test is Pivot {
    return typeof test === 'object';
  }

  public getPivotsAfter(pivot: Pivot): Pivot[] {
    const index = this.pivots.findIndex((p) => p.id === pivot.id);
    if (index === -1 || index + 1 >= this.pivots.length) {
      return [];
    }
    return this.pivots.slice(index + 1);
  }

  // Some time functions to avoid expose candles and pivotsd
  public getRemainingCandlesAfter(pivot: Pivot): number {
    if (pivot.candleIndex + 1 >= this.candles.length) return 0;
    const remainingCandles = this.candles.slice(pivot.candleIndex + 1);
    return remainingCandles.length;
  }
}
