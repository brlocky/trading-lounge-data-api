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
    if (candles.length < 2) {
      throw new PreconditionFailedException(`${this.constructor.name}:getZigZag: The candles array must have at least 2 elements.`);
    }

    // Initialize arrays to mark potential pivot highs and lows
    const pivotHigh = new Array(candles.length).fill(1);
    const pivotLow = new Array(candles.length).fill(1);

    // Determine the overall trend
    const trend = getTrend(candles);

    // Set the first pivot based on the trend
    if (trend === Trend.UP) {
      pivotHigh[0] = 0;
    } else {
      pivotLow[0] = 0;
    }

    // Iterate through candles to identify potential pivots
    for (let i = 1; i < candles.length - 1; i++) {
      const prevCandle = candles[i - 1];
      const currCandle = candles[i];

      // Check for doji candles (open = close = high = low)
      if (currCandle.open === currCandle.low && currCandle.open === currCandle.high && currCandle.open === currCandle.close) {
        pivotHigh[i] = 0;
        pivotLow[i] = 0;
      }

      // Check for gaps between candles
      if (currCandle.low >= prevCandle.high) {
        pivotLow[i] = 0;
        pivotHigh[i - 1] = 0;
      }

      if (currCandle.high <= prevCandle.low) {
        pivotHigh[i] = 0;
        pivotLow[i - 1] = 0;
      }

      // Check for potential pivot highs and lows based on candle patterns
      if (pivotHigh[i - 1] && !pivotLow[i - 1] && prevCandle.high > currCandle.high && this.isRedCandle(currCandle)) {
        pivotHigh[i] = 0;
      }

      if (pivotLow[i - 1] && !pivotHigh[i - 1] && prevCandle.low < currCandle.low && this.isGreenCandle(currCandle)) {
        pivotLow[i] = 0;
      }

      // Additional checks for pivot high/low based on candle patterns
      if (i > 1 && this.isGreenCandle(prevCandle) && this.isRedCandle(currCandle) && candles[i - 1].high < currCandle.high) {
        pivotHigh[i - 1] = 0;
      }

      if (i > 1 && this.isRedCandle(prevCandle) && this.isGreenCandle(currCandle) && candles[i - 1].low > currCandle.low) {
        pivotLow[i - 1] = 0;
      }

      // Check for potential pivot changes based on candle patterns and previous pivots
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

    // Create pivot objects based on the identified pivot points
    const pivots = [];
    let lastTrend: Trend | null = trend;
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      if (pivotHigh[i] && pivotLow[i]) {
        // Create two pivots for a spike
        const p1 = this.createPivot(candle, i, PivotType.HIGH);
        const p2 = this.createPivot(candle, i, PivotType.LOW);

        if (lastTrend === Trend.UP) {
          pivots.push(p1);
          pivots.push(p2);
        } else if (lastTrend === Trend.DOWN) {
          pivots.push(p2);
          pivots.push(p1);
        } else {
          throw new NotAcceptableException('Lost track of the trend');
        }
      } else if (pivotHigh[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.HIGH));
        lastTrend = Trend.DOWN;
      } else if (pivotLow[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.LOW));
        lastTrend = Trend.UP;
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
