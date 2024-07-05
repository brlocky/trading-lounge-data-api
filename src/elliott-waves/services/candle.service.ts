import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { Pivot, PivotSearchResult } from '../types';
import { v4 } from 'uuid';
import { getHHBeforeBreak, getLLBeforeBreak, getTrend } from '../class/utils/pivot.utils';
import { PivotType, Trend } from '../enums';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { CandleDto } from 'src/search/dto';
interface WaveRetracement {
  p1: Pivot;
  p2: Pivot;
  retracement: number;
}
@Injectable()
export class CandleService {
  getZigZag(candles: CandleDto[]): Pivot[] {
    if (candles.length < 2) {
      throw new PreconditionFailedException(`${this.constructor.name}:getZigZag: The candles array must have at least 2 elements.`);
    }

    // All pivots will be marked as being a possibility
    const pivotHigh = new Array(candles.length).fill(1);
    const pivotLow = new Array(candles.length).fill(1);

    // Find candles Trend Direction
    const trend = getTrend(candles);

    if (trend === Trend.UP) {
      pivotHigh[0] = 0;
    } else {
      pivotLow[0] = 0;
    }

    for (let i = 1; i < candles.length - 1; i++) {
      const prevCandle = candles[i - 1];
      const currCandle = candles[i];

      if (currCandle.open === currCandle.low && currCandle.open === currCandle.high && currCandle.open === currCandle.close) {
        pivotHigh[i] = 0;
        pivotLow[i] = 0;
      }

      if (currCandle.low >= prevCandle.high) {
        pivotLow[i] = 0;
        pivotHigh[i - 1] = 0;
      }

      if (currCandle.high <= prevCandle.low) {
        pivotHigh[i] = 0;
        pivotLow[i - 1] = 0;
      }

      if (pivotHigh[i - 1] && !pivotLow[i - 1] && prevCandle.high > currCandle.high && this.isRedCandle(currCandle)) {
        pivotHigh[i] = 0;
      }

      if (pivotLow[i - 1] && !pivotHigh[i - 1] && prevCandle.low < currCandle.low && this.isGreenCandle(currCandle)) {
        pivotLow[i] = 0;
      }

      if (i > 1 && this.isGreenCandle(prevCandle) && this.isRedCandle(currCandle) && candles[i - 1].high < currCandle.high) {
        pivotHigh[i - 1] = 0;
      }

      if (i > 1 && this.isRedCandle(prevCandle) && this.isGreenCandle(currCandle) && candles[i - 1].low > currCandle.low) {
        pivotLow[i - 1] = 0;
      }

      if (
        this.isGreenCandle(prevCandle) &&
        pivotLow[i - 1] &&
        pivotHigh[i - 1] &&
        candles[i - 1].low > currCandle.low &&
        candles[i - 1].high > currCandle.high
      ) {
        pivotHigh[i] = 0;
      }

      if (
        this.isRedCandle(prevCandle) &&
        pivotLow[i - 1] &&
        pivotHigh[i - 1] &&
        candles[i - 1].low < currCandle.low &&
        candles[i - 1].high < currCandle.high
      ) {
        pivotLow[i] = 0;
      }
    }

    const pivots = [];
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      if (pivotHigh[i] && pivotLow[i]) {
        // we need to create 2 pivots for a spike
        const p1 = this.createPivot(candle, i, PivotType.HIGH);
        const p2 = this.createPivot(candle, i, PivotType.LOW);

        if (this.isNeutral(candle)) {
          if (trend === Trend.UP) {
            pivots.push(p1);
            pivots.push(p2);
          } else {
            pivots.push(p1);
            pivots.push(p2);
          }
        } else if (this.isGreenCandle(candle)) {
          pivots.push(p2);
          pivots.push(p1);
        } else {
          pivots.push(p1);
          pivots.push(p2);
        }
      } else if (pivotHigh[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.HIGH));
      } else if (pivotLow[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.LOW));
      }
    }

    return pivots;
  }

  generateRetracements(pivots: Pivot[], minWaves: number): Pivot[] {
    const detailDecrement = 3;
    let detail = 90;
    const minDetail = 1;
    let waveRetracements: WaveRetracement[] = [];

    while (detail > minDetail && (waveRetracements.length === 0 || waveRetracements.length < minWaves)) {
      waveRetracements = this.analyzeWaveRetracements(pivots, detail);
      detail -= detailDecrement;
    }

    const trend = getTrend(pivots);
    const looking4PivotType: PivotType = trend === Trend.UP ? PivotType.HIGH : PivotType.LOW;
    const pStart = pivots[0];
    const lastOptions = pivots.filter((p) => p.type === looking4PivotType);
    const pEnd = lastOptions[lastOptions.length - 1];

    const newPivots = waveRetracements.flatMap((w) => [w.p1, w.p2]);
    !newPivots.find((p) => p.id == pStart.id) && newPivots.unshift(pStart);
    !newPivots.find((p) => p.id === pEnd.id) && newPivots.push(pEnd);

    return newPivots;
  }

  protected analyzeWaveRetracements(pivots: Pivot[], threshold: number = 20): WaveRetracement[] {
    const trend = getTrend(pivots);

    const retracements: WaveRetracement[] = [];
    const fibonacci = new Fibonacci();
    let index = 0;
    while (index < pivots.length) {
      const pivot = pivots[index];
      let pivotSearchResult: PivotSearchResult;

      if (trend === Trend.UP && pivot.isHigh()) {
        pivotSearchResult = getLLBeforeBreak(pivots.slice(index + 1), pivot);
      } else if (trend === Trend.DOWN && pivot.isLow()) {
        pivotSearchResult = getHHBeforeBreak(pivots.slice(index + 1), pivot);
      } else {
        index += 1;
        continue;
      }

      const { pivot: nextPivot, type } = pivotSearchResult;

      if (type === 'NOT-FOUND' || !nextPivot) {
        index += 1;
        continue;
      }

      const retracementValue = fibonacci.calculatePercentageDecrease(pivot.price, nextPivot.price);
      if (retracementValue > threshold) {
        retracements.push({ p1: pivot, p2: nextPivot, retracement: retracementValue });
      }
      index = pivots.indexOf(nextPivot) + 1;
    }

    return retracements;
  }

  protected createPivot(candle: CandleDto, index: number, type: PivotType): Pivot {
    return new Pivot(v4(), index, type, type === PivotType.HIGH ? candle.high : candle.low, candle.time);
  }

  protected isRedCandle(candle: CandleDto): boolean {
    return candle.close < candle.open;
  }

  protected isGreenCandle(candle: CandleDto): boolean {
    return candle.close > candle.open;
  }

  protected isNeutral(candle: CandleDto): boolean {
    return candle.close === candle.open;
  }
}
