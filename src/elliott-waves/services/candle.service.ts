import { Injectable, NotAcceptableException, PreconditionFailedException, UnprocessableEntityException } from '@nestjs/common';
import { Pivot } from '../class';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { getHHBeforeBreak, getLLBeforeBreak, getTrend } from '../class/utils/pivot.utils';
import { PivotType, Trend } from '../enums';
import { Candle, PivotTest } from '../types';

// Interface to represent a wave retracement
interface WaveRetracement {
  p1: Pivot;
  p2: Pivot;
  retracement: number;
}

@Injectable()
export class CandleService {
  // Method to calculate ZigZag pivots from an array of candles
  getZigZag(candles: Candle[]): Pivot[] {
    // Check if there are enough candles to process
    if (candles.length < 2) {
      throw new PreconditionFailedException(`${this.constructor.name}:getZigZag: The candles array must have at least 2 elements.`);
    }

    // Initialize arrays to mark all pivot as highs and lows
    const pivotHigh = new Array(candles.length).fill(1);
    const pivotLow = new Array(candles.length).fill(1);

    // Determine the trend based on initial candle break
    const trend = getTrend(candles);

    if (trend === Trend.UP && this.isRedCandle(candles[0])) {
      pivotHigh[0] = 0;
    }

    if (trend === Trend.DOWN && this.isGreenCandle(candles[0])) {
      pivotLow[0] = 0;
    }

    // Iterate through candles to remove unwanted pivots
    /*     for (let i = 1; i < candles.length - 1; i++) {
      const prevCandle = candles[i - 1];
      const currCandle = candles[i];

      if (currCandle.low >= prevCandle.high) {
        pivotHigh[i - 1] = 0;
        pivotLow[i] = 0;
        continue;
      }

      if (currCandle.high <= prevCandle.low) {
        pivotHigh[i] = 0;
        pivotLow[i - 1] = 0;
        continue;
      }
    }
 */
    // Create pivot objects based on the identified pivot points
    const pivots = [];

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      if (pivotHigh[i] && pivotLow[i]) {
        // Create two pivots for a spike
        const p1 = this.createPivot(candle, i, PivotType.HIGH);
        const p2 = this.createPivot(candle, i, PivotType.LOW);
        if (this.isRedCandle(candle)) {
          pivots.push(p1);
          pivots.push(p2);
        }
        if (this.isGreenCandle(candle)) {
          pivots.push(p2);
          pivots.push(p1);
        }
      } else if (pivotHigh[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.HIGH));
      } else if (pivotLow[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.LOW));
      }
    }

    let i = 0;
    while (i < pivots.length - 1) {
      const p1 = pivots[i];
      const p2 = pivots[i + 1];
      if (p1.isHigh() === p2.isHigh() || p1.isLow() === p2.isLow()) {
        // Found two consecutive pivots of the same type
        console.log(`Found consecutive pivots at indices ${i} and ${i + 1}`);

        if (p1.isHigh()) {
          if (p2.price >= p1.price) {
            pivots.splice(i, 1);
          } else {
            pivots.splice(i + 1, 1);
          }
        }
        if (p1.isLow()) {
          if (p2.price <= p1.price) {
            pivots.splice(i, 1);
          } else {
            pivots.splice(i + 1, 1);
          }
        }
      } else {
        i++;
      }
    }

    // Validate the sequence of pivots
    for (let i = 1; i < pivots.length - 1; i++) {
      const lastPivot = pivots[i - 1];
      const currentPivot = pivots[i];
      if ((lastPivot.isHigh() && currentPivot.isHigh()) || (lastPivot.isLow() && currentPivot.isLow())) {
        console.error('found pivots out of sequence');
        //throw new Error('found pivots out of sequence');
      }
    }

    return pivots;
  }

  // Method to get wave pivot retracements based on a minimum number of waves
  getWavePivotRetracementsByNumberOfWaves(pivots: Pivot[], minWaves: number): Pivot[] {
    const detailDecrement = 5;
    const minDetail = 0;
    let detail = 90;
    let waveRetracements: WaveRetracement[] = [];

    // Adjust the detail level until the desired number of waves is found
    while (detail >= minDetail && (waveRetracements.length === 0 || waveRetracements.length < minWaves)) {
      waveRetracements = this.analyzeWaveRetracements(pivots, detail);
      detail -= detailDecrement;
    }

    return waveRetracements.flatMap((w) => [w.p1, w.p2]);
  }

  // Method to get wave pivot retracements based on a specific retracement percentage
  getWavePivotRetracementsByRetracement(pivots: Pivot[], retracement: number): Pivot[] {
    const waveRetracements: WaveRetracement[] = this.analyzeWaveRetracements(pivots, retracement);
    return waveRetracements.flatMap((w) => [w.p1, w.p2]);
  }

  // Protected method to analyze wave retracements
  protected analyzeWaveRetracements(pivots: Pivot[], threshold: number): WaveRetracement[] {
    const retracements: WaveRetracement[] = [];
    const fibonacci = new Fibonacci();
    let index = 0;

    let lastMax = -Infinity;
    // Iterate through pivots to find retracements
    while (index < pivots.length) {
      const pivot = pivots[index];
      let pivotSearchResult: PivotTest;

      // Search for the next pivot based on the trend
      if (pivot.isHigh() && pivot.price > lastMax && index + 1 < pivots.length) {
        lastMax = pivot.price;
        pivotSearchResult = getLLBeforeBreak(pivots.slice(index + 1), pivot);
      } else {
        index += 1;
        continue;
      }

      const { pivot: nextPivot } = pivotSearchResult;

      if (!nextPivot) {
        index += 1;
        continue;
      }

      // Calculate retracement and add to the list if it exceeds the threshold
      const retracementValue = fibonacci.calculatePercentageDecrease(pivot.price, nextPivot.price);
      retracementValue > 90 && console.log(retracementValue);
      if (retracementValue >= threshold) {
        retracements.push({ p1: pivot, p2: nextPivot, retracement: retracementValue });
      }
      index = pivots.indexOf(nextPivot) + 1;
    }

    return retracements;
  }

  // Helper method to create a Pivot object
  protected createPivot(candle: Candle, index: number, type: PivotType): Pivot {
    return new Pivot(index, type, type === PivotType.HIGH ? candle.high : candle.low, candle.time);
  }

  // Helper methods to determine candle types
  protected isRedCandle(candle: Candle): boolean {
    return candle.close < candle.open;
  }

  protected isGreenCandle(candle: Candle): boolean {
    return candle.close > candle.open;
  }

  findFirstImpulsiveWave(pivots: Pivot[]): [Pivot, Pivot, Pivot][] {
    if (!Array.isArray(pivots) || pivots.length < 3) {
      return [];
    }

    const fibs = new Fibonacci();
    const validWaves: [Pivot, Pivot, Pivot][] = [];

    // Start with the first candle as the first pivot (P0)
    const p0 = pivots[0].copy();

    const trendIsUp = p0.isLow() ? true : false;

    let lastMax = trendIsUp ? -Infinity : Infinity;
    for (let i = 1; i < pivots.length - 1; i++) {
      const p1 = pivots[i];

      // Find potential wave 2 bottoms (P2)
      const remainingCandles = pivots.slice(i + 1);
      const { type, pivot } = trendIsUp ? getLLBeforeBreak(remainingCandles, p1) : getHHBeforeBreak(remainingCandles, p1);

      if ((trendIsUp && p1.price > lastMax) || (!trendIsUp && p1.price < lastMax)) {
        lastMax = p1.price;
      } else {
        continue;
      }

      if (type === 'FOUND-WITH-BREAK' && pivot) {
        const p2 = pivot;

        const wave1Time = p1.time - p0.time;
        const wave2Time = p2.time - p1.time;
        const consolidationRatio = Math.abs(wave2Time / wave1Time);

        if (consolidationRatio >= 0.03) {
          const retracementLevel = fibs.getRetracementPercentage(p0.price, p1.price, p2.price);

          if (retracementLevel >= 10 && retracementLevel <= 99.999) {
            validWaves.push([p0, p1, p2]);
          }
        }
      }
    }

    // Filter out waves with lower P2
    const filteredWaves: [Pivot, Pivot, Pivot][] = [];
    for (let i = 0; i < validWaves.length; i++) {
      const currentP2 = validWaves[i][2].price;
      const hasLowerP2 = validWaves
        .slice(i + 1)
        .some((wave) => (trendIsUp && wave[2].price < currentP2) || (!trendIsUp && wave[2].price > currentP2));

      if (!hasLowerP2) {
        filteredWaves.push(validWaves[i]);
      }
    }

    return filteredWaves;
  }
}
