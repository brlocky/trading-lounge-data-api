import { BadRequestException, Injectable, PreconditionFailedException } from '@nestjs/common';
import { Pivot } from '../class';
import { CandleTime, WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { findPivotIndex, getHHBeforeBreak, getLLBeforeBreak, getTrend } from '../class/utils/pivot.utils';
import { PivotType, Trend } from '../enums';
import { Candle } from '../types';

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
        throw new BadRequestException('found pivots out of sequence');
      }
    }

    return pivots;
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

  protected getMarketStructurePivots2(pivots: Pivot[], retracementThreshold: number, extremePivotsOnly: boolean = false): Pivot[] {
    const significantPivots: Pivot[] = [];
    const fibonacci = new Fibonacci();
    let trend: 'up' | 'down' | null = null;
    let lastSignificantHigh: Pivot | null = null;
    let lastSignificantLow: Pivot | null = null;
    let currentHigh: Pivot | null = null;
    let currentLow: Pivot | null = null;

    for (let i = 0; i < pivots.length; i++) {
      const currentPivot = pivots[i];

      if (trend === null || trend === 'up') {
        if (!currentHigh || currentPivot.price > currentHigh.price) {
          currentHigh = currentPivot;
        } else if (currentHigh) {
          const retracement = fibonacci.calculatePercentageDecrease(currentHigh.price, currentPivot.price);
          const retracement2 = lastSignificantLow?.price
            ? fibonacci.getRetracementPercentage(lastSignificantLow.price, currentHigh.price, currentPivot.price)
            : 0;
          if (retracement >= retracementThreshold || retracement2 >= retracementThreshold) {
            if (lastSignificantHigh !== currentHigh) {
              significantPivots.push(currentHigh);
              lastSignificantHigh = currentHigh;
            }
            trend = 'down';
            currentLow = currentPivot;
          }
        }
      }

      if (trend === null || trend === 'down') {
        if (!currentLow || currentPivot.price < currentLow.price) {
          currentLow = currentPivot;
        } else if (currentLow) {
          const retracement = fibonacci.calculatePercentageDecrease(currentPivot.price, currentLow.price);
          const retracement2 = lastSignificantHigh?.price
            ? fibonacci.getRetracementPercentage(lastSignificantHigh.price, currentLow.price, currentPivot.price)
            : 0;
          if (retracement >= retracementThreshold || retracement2 >= retracementThreshold) {
            if (lastSignificantLow !== currentLow) {
              significantPivots.push(currentLow);
              lastSignificantLow = currentLow;
            }
            trend = 'up';
            currentHigh = currentPivot;
          }
        }
      }
    }

    // Add the last significant high or low if it exists
    if (trend === 'up' && currentHigh && lastSignificantHigh !== currentHigh) {
      significantPivots.push(currentHigh);
    } else if (trend === 'down' && currentLow && lastSignificantLow !== currentLow) {
      significantPivots.push(currentLow);
    }

    if (extremePivotsOnly) {
      return this.getExtremePivotsOnly(significantPivots);
    }

    return significantPivots;
  }
  protected getMarketStructurePivots(pivots: Pivot[], retracementThreshold: number, extremePivotsOnly: boolean = false): Pivot[] {
    const significantPivots: Pivot[] = [];
    const fibonacci = new Fibonacci();
    fibonacci.setLogScale(false);
    let trend: 'up' | 'down' | null = null;
    let lastSignificantHigh: Pivot | null = null;
    let lastSignificantLow: Pivot | null = null;
    let currentHigh: Pivot | null = null;
    let currentLow: Pivot | null = null;

    for (let i = 0; i < pivots.length; i++) {
      const currentPivot = pivots[i];

      // Initialize trend and first high/low if not set
      if (trend === null) {
        if (i === 0) {
          currentHigh = currentLow = currentPivot;
          continue;
        } else if (i === 1) {
          trend = currentPivot.price > currentHigh!.price ? 'up' : 'down';
          if (trend === 'up') {
            currentHigh = currentPivot;
            significantPivots.push(currentLow!);
            lastSignificantLow = currentLow;
          } else {
            currentLow = currentPivot;
            significantPivots.push(currentHigh!);
            lastSignificantHigh = currentHigh;
          }
          continue;
        }
      }

      if (trend === 'up') {
        if (currentPivot.price > currentHigh!.price) {
          currentHigh = currentPivot;
        } else {
          const retracement = currentHigh ? fibonacci.calculatePercentageDecrease(currentHigh.price, currentPivot.price) : 0;
          const retracement2 =
            lastSignificantLow && currentHigh
              ? fibonacci.getRetracementPercentage(lastSignificantLow.price, currentHigh.price, currentPivot.price)
              : 0;

          if (retracement >= retracementThreshold || retracement2 >= retracementThreshold) {
            if (lastSignificantHigh !== currentHigh) {
              significantPivots.push(currentHigh!);
              lastSignificantHigh = currentHigh;
            }
            trend = 'down';
            currentLow = currentPivot;
          }
        }
      } else if (trend === 'down') {
        if (currentPivot.price < currentLow!.price) {
          currentLow = currentPivot;
        } else {
          const retracement = currentLow ? fibonacci.calculatePercentageIncrease(currentLow.price, currentPivot.price) : 0;
          const retracement2 =
            lastSignificantHigh && currentLow
              ? fibonacci.getRetracementPercentage(lastSignificantHigh.price, currentLow.price, currentPivot.price)
              : 0;

          if (retracement >= retracementThreshold || retracement2 >= retracementThreshold) {
            if (lastSignificantLow !== currentLow) {
              significantPivots.push(currentLow!);
              lastSignificantLow = currentLow;
            }
            trend = 'up';
            currentHigh = currentPivot;
          }
        }
      }
    }

    // Add the last significant high or low if it exists
    if (trend === 'up' && currentHigh && lastSignificantHigh !== currentHigh) {
      significantPivots.push(currentHigh);
    } else if (trend === 'down' && currentLow && lastSignificantLow !== currentLow) {
      significantPivots.push(currentLow);
    }

    if (extremePivotsOnly) {
      return this.getExtremePivotsOnly(significantPivots);
    }

    return significantPivots;
  }

  protected getExtremePivotsOnly(pivots: Pivot[]): Pivot[] {
    if (pivots.length < 2) return pivots;
    const extremePivots: Pivot[] = [];
    let currentHigh: Pivot | null = null;
    let currentLow: Pivot | null = null;
    const trend = pivots[1].price > pivots[0].price ? Trend.UP : Trend.DOWN;

    for (const pivot of pivots) {
      if (trend === Trend.UP) {
        if (!currentHigh || pivot.price > currentHigh.price) {
          if (currentHigh && currentLow) {
            extremePivots.push(currentHigh, currentLow);
          }
          currentHigh = pivot;
          currentLow = null;
        } else if (!currentLow || pivot.price < currentLow.price) {
          currentLow = pivot;
        }
      } else {
        // Trend.DOWN
        if (!currentLow || pivot.price < currentLow.price) {
          if (currentLow && currentHigh) {
            extremePivots.push(currentLow, currentHigh);
          }
          currentLow = pivot;
          currentHigh = null;
        } else if (!currentHigh || pivot.price > currentHigh.price) {
          currentHigh = pivot;
        }
      }
    }

    // Add the last extreme pivot pair if it exists
    if (trend === Trend.UP && currentHigh && currentLow) {
      extremePivots.push(currentHigh, currentLow);
    } else if (trend === Trend.DOWN && currentLow && currentHigh) {
      extremePivots.push(currentLow, currentHigh);
    }

    return extremePivots;
  }

  /*  protected analyzeWaveRetracements(pivots: Pivot[], threshold: number): WaveRetracement[] {
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
      if (retracementValue >= threshold) {
        retracements.push({ p1: pivot, p2: nextPivot, retracement: retracementValue });
      }
      index = pivots.indexOf(nextPivot) + 1;
    }

    return retracements;
  } */

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
