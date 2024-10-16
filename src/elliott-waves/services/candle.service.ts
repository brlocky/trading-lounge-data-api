import { BadRequestException, Injectable, InternalServerErrorException, PreconditionFailedException } from '@nestjs/common';
import { Pivot } from '../class';
import { CandleTime, WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { findPivotIndex, getHHBeforeBreak, getLLBeforeBreak, getPivotsAfter, getTrend } from '../class/utils/pivot.utils';
import { PivotType, Trend } from '../enums';
import { Candle, PivotTest } from '../types';
import { uniqBy } from 'lodash';

interface PivotInfo {
  startPivot: Pivot;
  endPivot: Pivot;
  distance: number;
}

@Injectable()
export class CandleService {
  getZigZag(candles: Candle[]): Pivot[] {
    // Check if there are enough candles to process
    if (candles.length < 2) {
      throw new PreconditionFailedException(`${this.constructor.name}:getZigZag: The candles array must have at least 2 elements.`);
    }

    // Initialize arrays to mark all candles as potential highs and lows
    const pivotHigh = new Array(candles.length).fill(1);
    const pivotLow = new Array(candles.length).fill(1);

    // Determine the initial trend based on the first candle
    const trend = getTrend(candles);
    if (trend === Trend.UP && this.isRedCandle(candles[0])) {
      pivotHigh[0] = 0; // First candle can't be a high in an uptrend if it's red
    }
    if (trend === Trend.DOWN && this.isGreenCandle(candles[0])) {
      pivotLow[0] = 0; // First candle can't be a low in a downtrend if it's green
    }

    // Create pivot objects based on the identified pivot points
    const pivots = [];
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      if (pivotHigh[i] && pivotLow[i]) {
        // Create two pivots for a spike (both high and low)
        const p1 = this.createPivot(candle, i, PivotType.HIGH);
        const p2 = this.createPivot(candle, i, PivotType.LOW);
        if (this.isRedCandle(candle)) {
          pivots.push(p1, p2); // For red candles, high comes before low
        }
        if (this.isGreenCandle(candle)) {
          pivots.push(p2, p1); // For green candles, low comes before high
        }
      } else if (pivotHigh[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.HIGH));
      } else if (pivotLow[i]) {
        pivots.push(this.createPivot(candle, i, PivotType.LOW));
      }
    }

    this.cleanPivots(pivots);

    return pivots;
  }

  protected cleanPivots(pivots: Pivot[]) {
    // Clean up consecutive pivots of the same type
    let i = 0;
    while (i < pivots.length - 1) {
      const p1 = pivots[i];
      const p2 = pivots[i + 1];
      if (p1.isHigh() === p2.isHigh() || p1.isLow() === p2.isLow()) {
        // Found two consecutive pivots of the same type
        if (p1.isHigh()) {
          if (p2.price >= p1.price) {
            pivots.splice(i, 1); // Remove the lower high
          } else {
            pivots.splice(i + 1, 1); // Remove the lower high
          }
        }
        if (p1.isLow()) {
          if (p2.price <= p1.price) {
            pivots.splice(i, 1); // Remove the higher low
          } else {
            pivots.splice(i + 1, 1); // Remove the higher low
          }
        }
      } else {
        i++; // Move to next pivot if no cleanup needed
      }
    }

    // Clean up consecutive pivots with wrong prices
    i = 0;
    while (i < pivots.length - 1) {
      const p1 = pivots[i];
      const p2 = pivots[i + 1];
      if ((p1.isHigh() && p1.price <= p2.price) || (p1.isLow() && p1.price >= p2.price)) {
        pivots.splice(i, 2);
      } else {
        i++; // Move to next pivot if no cleanup needed
      }
    }

    // Validate the sequence of pivots
    for (let i = 1; i < pivots.length - 1; i++) {
      const lastPivot = pivots[i - 1];
      const currentPivot = pivots[i];
      if ((lastPivot.isHigh() && currentPivot.isHigh()) || (lastPivot.isLow() && currentPivot.isLow())) {
        console.error('Found pivots out of sequence');
        throw new InternalServerErrorException('Found pivots out of sequence');
      }
      if ((lastPivot.isHigh() && lastPivot.price <= currentPivot.price) || (lastPivot.isLow() && lastPivot.price >= currentPivot.price)) {
        console.error('Found wrong pivots pivots prices');
        throw new BadRequestException('Found wrong pivots pivots prices');
      }
    }
  }

  // Method to get wave pivot retracements based on a minimum number of waves
  getWavePivotRetracementsByNumberOfWaves(pivots: Pivot[], minWaves: number, extremePivotsOnly: boolean = false): Pivot[] {
    const detailDecrement = 5;
    const minDetail = 0;
    let detail = 90;
    //let waveRetracements: WaveRetracement[] = [];
    let marketPivots: Pivot[] = [];
    let waveCount = 0;
    //let waveRetracements: WaveRetracement[] = [];

    if (pivots.length < 4) {
      return [];
    }

    while (detail > minDetail && waveCount < minWaves) {
      marketPivots = this.getMarketStructurePivots(pivots, detail, extremePivotsOnly);

      // Calculate wave count
      waveCount = marketPivots.length / 2;

      detail -= detailDecrement;
    }

    return marketPivots;
  }

  getWavePivotRetracementsByRetracementValue(pivots: Pivot[], retracementValue: number, extremePivotsOnly: boolean = false): Pivot[] {
    return this.getMarketStructurePivots(pivots, retracementValue, extremePivotsOnly);
  }

  getMarketStructureTimePivots(pivots: Pivot[], retracementThreshold: number): Pivot[] {
    const structurePivots = this.getMarketStructurePivots(pivots, retracementThreshold, true);
    const pivotInfo: PivotInfo[] = [];

    // First pass: Calculate maximum values
    let maxTimeDuration = 0;
    let maxLogPriceChange = 0;

    for (let i = 0; i < structurePivots.length - 1; i++) {
      const timeDuration = structurePivots[i + 1].candleIndex - structurePivots[i].candleIndex + 1;
      const startPrice = structurePivots[i].price;
      const endPrice = structurePivots[i + 1].price;

      maxTimeDuration = Math.max(maxTimeDuration, timeDuration);
      const logPriceChange = Math.abs(Math.log(endPrice / startPrice));
      maxLogPriceChange = Math.max(maxLogPriceChange, logPriceChange);
    }

    // Second pass: Calculate normalized distances
    for (let i = 0; i < structurePivots.length - 1; i += 2) {
      const timeDuration = structurePivots[i + 1].candleIndex - structurePivots[i].candleIndex + 1;
      const startPrice = structurePivots[i].price;
      const endPrice = structurePivots[i + 1].price;

      // Normalize time component
      const normalizedTime = timeDuration / maxTimeDuration;

      // Normalize price component using log scale
      const logPriceChange = Math.abs(Math.log(endPrice / startPrice));
      const normalizedPrice = logPriceChange / maxLogPriceChange;

      // Calculate the distance using normalized components
      const distance = Math.sqrt(Math.pow(normalizedTime, 2) + Math.pow(normalizedPrice, 2));

      pivotInfo.push({
        startPivot: structurePivots[i],
        endPivot: structurePivots[i + 1],
        distance,
      });
    }

    // Calculate mean and standard deviation
    const distances = pivotInfo.map((p) => p.distance);
    const mean = distances.reduce((sum, val) => sum + val, 0) / distances.length;
    const variance = distances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    // Adjust this value to control sensitivity
    const sensitivityFactor = 0.2;
    const threshold = mean + sensitivityFactor * stdDev;

    const significantPairs = pivotInfo.filter((p) => p.distance >= threshold);

    // Create a set of significant pivots to easily check for inclusion
    const significantPivotsSet = new Set(significantPairs.flatMap((p) => [p.startPivot, p.endPivot]));

    // Filter the original structurePivots to keep only significant ones, maintaining order
    return structurePivots.filter((pivot) => significantPivotsSet.has(pivot));
  }

  getMarketStructureTimePivots2(pivots: Pivot[], retracementThreshold: number): Pivot[] {
    const structurePivots = this.getMarketStructurePivots(pivots, retracementThreshold, true);

    const pivotInfo: PivotInfo[] = [];
    const scaleFactor = 100; // Adjust this value to balance time and price scales

    for (let i = 0; i < structurePivots.length - 1; i += 2) {
      const timeDuration = structurePivots[i + 1].candleIndex - structurePivots[i].candleIndex + 1;
      const startPrice = structurePivots[i].price;
      const endPrice = structurePivots[i + 1].price;

      // Calculate price difference in log scale and adjust it with the scale factor
      const priceDifference = Math.abs(Math.log(endPrice) - Math.log(startPrice)) * scaleFactor;

      // Calculate the distance using Pythagorean theorem
      const distance = Math.sqrt(Math.pow(timeDuration, 2) + Math.pow(priceDifference, 2));

      pivotInfo.push({
        startPivot: structurePivots[i],
        endPivot: structurePivots[i + 1],
        distance,
      });
    }

    const distances = pivotInfo.map((p) => p.distance);
    const mean = distances.reduce((sum, val) => sum + val, 0) / distances.length;
    const variance = distances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);

    const threshold = mean + 0.2 * stdDev; // Using 0.2 as the standard deviation multiplier
    const significantPairs = pivotInfo.filter((p) => p.distance >= threshold);

    return significantPairs.map((p) => [p.startPivot, p.endPivot]).flat();
  }

  getMarketStructurePivots(pivots: Pivot[], retracementThreshold: number, extremePivotsOnly: boolean = false): Pivot[] {
    const significantPivots: Pivot[] = [];
    const fibonacci = new Fibonacci();
    let pivot1: Pivot | null = null;

    let i = 0;
    while (true) {
      if (i >= pivots.length) break;
      pivot1 = pivots[i];

      const { pivot } = this.getOppositePivot(pivot1, pivots);

      if (!pivot) {
        break;
      }

      let foundRetracement = false;
      const retracements = this.getRetracements(pivot1, pivot, pivots);

      if (!retracements.length) {
        i = pivots.findIndex((p) => p.id === pivot.id);
        continue;
      }

      fibonacci.setLogScale(false);

      for (let j = 2; j < retracements.length; j += 2) {
        const pivot2 = retracements[j - 2];
        const pivot3 = retracements[j - 1];
        const retracement = fibonacci.getRetracementPercentage(pivot1.price, pivot2.price, pivot3.price);
        const retracement2 = pivot1.isLow()
          ? fibonacci.calculatePercentageDecrease(pivot3.price, pivot2.price)
          : fibonacci.calculatePercentageDecrease(pivot3.price, pivot2.price);
        if (retracement >= retracementThreshold || retracement2 >= retracementThreshold) {
          significantPivots.push(pivot1, pivot2, pivot3);
          i = pivots.findIndex((p) => p.id === pivot3.id);
          foundRetracement = true;
          break;
        }
      }

      if (!foundRetracement) {
        significantPivots.push(pivot1, pivot);
        i = pivots.findIndex((p) => p.id === pivot.id);
        continue;
      }
    }

    const uniquePivots = uniqBy(significantPivots, 'id');
    this.cleanPivots(uniquePivots);

    // Return only extreme pivots if requested
    if (extremePivotsOnly && uniquePivots.length > 1) {
      const trend = uniquePivots[0].price < uniquePivots[uniquePivots.length - 1].price ? Trend.UP : Trend.DOWN;
      const clearPivots = this.clearCorrectiveTrend(uniquePivots, trend);
      this.cleanPivots(clearPivots);
      return clearPivots;
    }

    return uniquePivots;
  }

  protected getOppositePivot(initialPivot: Pivot, pivots: Pivot[]): PivotTest {
    const filteredPivots = getPivotsAfter(pivots, initialPivot, false);

    let test: PivotTest | null = null;
    if (initialPivot.isHigh()) {
      test = getLLBeforeBreak(filteredPivots, initialPivot);
    } else {
      test = getHHBeforeBreak(filteredPivots, initialPivot);
    }

    return test;
  }

  protected getRetracements(from: Pivot, to: Pivot, pivots: Pivot[]): Pivot[] {
    const filteredPivots = getPivotsAfter(pivots, from, true).filter((p) => p.time <= to.time);
    const trend = from.isLow() ? Trend.UP : Trend.DOWN;
    const extremePivots = this.clearCorrectiveTrend(filteredPivots, trend);

    return extremePivots;
  }

  protected clearCorrectiveTrend(pivots: Pivot[], trend: Trend): Pivot[] {
    if (pivots.length < 2) return [];

    const extremePivots: Pivot[] = [];
    const goodType = trend === Trend.UP ? PivotType.HIGH : PivotType.LOW; // We look for the opposite pivots, for a low pivot we look for a high

    let i = 0;
    while (i < pivots.length) {
      const currentPivot = pivots[i];
      if (currentPivot.type === goodType) {
        const { pivot } = this.getOppositePivot(currentPivot, pivots);
        if (!pivot) {
          break;
        }
        extremePivots.push(currentPivot);
        extremePivots.push(pivot);
        i = pivots.findIndex((p) => p.id === pivot.id) + 1;
      } else {
        i++;
      }
    }

    return uniqBy(extremePivots, 'id');
  }

  protected getExtremePivotsOnly2(pivots: Pivot[]): Pivot[] {
    if (pivots.length < 2) return pivots;

    const extremePivots: Pivot[] = [];
    let currentPivot: Pivot | undefined = pivots[1];
    const isUpTrend = currentPivot.isHigh(); // Assume trend is determined by whether the first pivot is a low.

    while (currentPivot) {
      if (isUpTrend) {
        // Get the next pivots after the current one for the search
        const remainingPivots = getPivotsAfter(pivots, currentPivot);
        if (remainingPivots.length === 0) break;

        // Get the next low before the current high breaks the resistance
        const { pivot: nextLow, type } = getLLBeforeBreak(remainingPivots, currentPivot);

        if (type === 'NOT-FOUND-WITH-BREAK' || type === 'NOT-FOUND-NO-BREAK') break;

        // Add the current high and the next low if found
        extremePivots.push(currentPivot);
        if (nextLow) {
          extremePivots.push(nextLow);
          // Now, we need to continue from the next high after the found low
          currentPivot = getPivotsAfter(pivots, nextLow).find((p) => p.isHigh());
        } else {
          break;
        }
      } else {
        // Get the next pivots after the current one for the search
        const remainingPivots = getPivotsAfter(pivots, currentPivot);
        if (remainingPivots.length === 0) break;

        // Get the next high before the current low breaks the support
        const { pivot: nextHigh, type } = getHHBeforeBreak(remainingPivots, currentPivot);

        if (type === 'NOT-FOUND-WITH-BREAK' || type === 'NOT-FOUND-NO-BREAK') break;

        // Add the current low and the next high if found
        extremePivots.push(currentPivot);
        if (nextHigh) {
          extremePivots.push(nextHigh);
          // Now, we need to continue from the next high after the found low
          currentPivot = getPivotsAfter(pivots, nextHigh).find((p) => p.isLow());
        } else {
          break;
        }
      }
    }

    return extremePivots;
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

  findFirstImpulsiveWave(pivots: Pivot[], candles: Candle[]): [Pivot, Pivot, Pivot][] {
    console.log('candles', candles);
    if (!Array.isArray(pivots) || pivots.length < 3) {
      return [];
    }

    const fibs = new Fibonacci();
    const validWaves: [Pivot, Pivot, Pivot][] = [];
    // Start with the first candle as the first pivot (P0)
    const p0 = pivots[0];

    const trendIsUp = p0.isLow() ? true : false;

    let lastMax = trendIsUp ? -Infinity : Infinity;
    for (let i = 1; i < pivots.length - 1; i++) {
      const p1 = pivots[i];
      if (trendIsUp && p1.price <= p0.price) break;
      if (!trendIsUp && p1.price >= p0.price) break;

      if (trendIsUp && p1.type === PivotType.LOW) continue;
      if (!trendIsUp && p1.type === PivotType.HIGH) continue;

      if ((trendIsUp && p1.price >= lastMax) || (!trendIsUp && p1.price <= lastMax)) {
        lastMax = p1.price;
      } else {
        continue;
      }

      // Find potential wave 2 bottoms (P2)
      const index = findPivotIndex(pivots, p1) + 1;
      const remainingPivots = pivots.slice(index);
      const { pivot } = trendIsUp ? getLLBeforeBreak(remainingPivots, p1) : getHHBeforeBreak(remainingPivots, p1);

      if (pivot) {
        const p2 = pivot;

        const { useLogScale } = WaveDegreeCalculator.calculateWaveDegreeFromCandles([p0 as CandleTime, p1 as CandleTime], 'wave1');
        /*         const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);

        const wave1Time = p1.time === p0.time ? commonInterval * 24 * 3600 : p1.time - p0.time;
        const wave2Time = p2.time === p1.time ? commonInterval * 24 * 3600 : p2.time - p1.time;

        const consolidationRatio = Math.abs(wave2Time / wave1Time); */

        fibs.setLogScale(useLogScale);
        const retracementLevel = fibs.getRetracementPercentage(p0.price, p1.price, p2.price);

        if (retracementLevel > 99.999) {
          break;
        }

        if (retracementLevel >= 14.2) {
          validWaves.push([p0, p1, p2]);
        }
      }
    }

    return validWaves;
  }
}
