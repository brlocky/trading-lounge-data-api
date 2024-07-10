import { Injectable, PreconditionFailedException } from '@nestjs/common';
import { Pivot, PivotSearchResult } from '../types';
import { getLLBeforeBreak, getTrend } from '../class/utils/pivot.utils';
import { PivotType, Trend } from '../enums';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { CandleDto } from 'src/search/dto';

// Interface to represent a wave retracement
interface WaveRetracement {
  p1: Pivot;
  p2: Pivot;
  retracement: number;
}

@Injectable()
export class CandleService {
  // Method to calculate ZigZag pivots from an array of candles
  getZigZag(candles: CandleDto[]): Pivot[] {
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
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      if (pivotHigh[i] && pivotLow[i]) {
        // Create two pivots for a spike
        const p1 = this.createPivot(candle, i, PivotType.HIGH);
        const p2 = this.createPivot(candle, i, PivotType.LOW);

        // Determine the order of pivots based on candle type and trend
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
      let pivotSearchResult: PivotSearchResult;

      // Search for the next pivot based on the trend
      if (pivot.isHigh() && pivot.price > lastMax && index + 1 < pivots.length) {
        lastMax = pivot.price;
        pivotSearchResult = getLLBeforeBreak(pivots.slice(index + 1), pivot);
      } else {
        index += 1;
        continue;
      }

      const { pivot: nextPivot, type } = pivotSearchResult;

      if (type === 'NOT-FOUND' || !nextPivot) {
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
  protected createPivot(candle: CandleDto, index: number, type: PivotType): Pivot {
    return new Pivot(index, type, type === PivotType.HIGH ? candle.high : candle.low, candle.time);
  }

  // Helper methods to determine candle types
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
