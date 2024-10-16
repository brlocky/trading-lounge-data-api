import { BadRequestException, PreconditionFailedException } from '@nestjs/common';
import { WaveDegree, PivotType, Trend, WaveName } from 'src/elliott-waves/enums';
import { Pivot } from '../pivot.class';
import { Wave } from '../wave.class';
import { ClusterWaves } from '../cluster-wave.class';
import { Candle, PivotTest } from 'src/elliott-waves/types';
import { ClusterPivot } from '..';

/**
 * Get next Low before it breaks the Resistance
 * @param pivots
 * @param pivot
 * @returns
 */
export const getLLBeforeBreak = (pivots: Pivot[], pivot: Pivot): PivotTest => {
  const breakPrice = pivot.price;
  let nextLow: Pivot | null = null;

  let didBreak = false;
  for (const p of pivots) {
    if (p.price >= breakPrice) {
      didBreak = true;
      break;
    }

    if (p.type !== PivotType.LOW) {
      continue;
    }

    if (nextLow === null || (nextLow as Pivot).price >= p.price) {
      nextLow = p;
    }
  }

  if (!nextLow) {
    return {
      pivot: null,
      type: didBreak ? 'NOT-FOUND-WITH-BREAK' : 'NOT-FOUND-NO-BREAK',
    };
  }

  return { pivot: nextLow, type: didBreak ? 'FOUND-WITH-BREAK' : 'FOUND-NO-BREAK' };
};

/**
 * Get next High before it breaks the Support
 * @param pivots
 * @param pivot
 * @returns
 */
export const getHHBeforeBreak = (pivots: Pivot[], pivot: Pivot): PivotTest => {
  const breakPrice = pivot.price;
  let nextHigh: Pivot | null = null;
  let didBreak = false;

  for (const p of pivots) {
    if (p.price <= breakPrice) {
      didBreak = true;
      break;
    }

    if (p.type !== PivotType.HIGH) {
      continue;
    }

    if (nextHigh === null || (nextHigh as Pivot).price <= p.price) {
      nextHigh = p;
    }
  }

  if (!nextHigh) {
    return {
      pivot: null,
      type: didBreak ? 'NOT-FOUND-WITH-BREAK' : 'NOT-FOUND-NO-BREAK',
    };
  }

  return { pivot: nextHigh, type: didBreak ? 'FOUND-WITH-BREAK' : 'FOUND-NO-BREAK' };
};

export const getLocalHigh = (pivots: Pivot[], length: number = 3): Pivot | null => {
  if (pivots.length === 0) {
    return null; // Return null if the array is empty
  }

  let max = -Infinity;
  let localHigh = null;

  // Use the smaller of the array length and specified length
  const actualLength = Math.min(pivots.length, length);

  for (let i = 0; i < actualLength; i++) {
    if (pivots[i].price > max) {
      max = pivots[i].price;
      localHigh = pivots[i];
    }
  }

  return localHigh;
};

export const getLocalLow = (pivots: Pivot[], length: number = 3): Pivot | null => {
  if (pivots.length === 0) {
    return null; // Return null if the array is empty
  }

  let min = Infinity;
  let localLow = null;

  // Use the smaller of the array length and specified length
  const actualLength = Math.min(pivots.length, length);

  for (let i = 0; i < actualLength; i++) {
    if (pivots[i].price < min) {
      min = pivots[i].price;
      localLow = pivots[i];
    }
  }

  return localLow;
};

export const getTrend = (data: Candle[]): Trend => {
  if (data.length < 2) {
    console.error('Trend Error - getTrend: The data array must have at least 2 elements.');
    throw new PreconditionFailedException(`getTrend: The data array must have at least 2 elements.`);
  }

  const firstCandle = data[0];
  const firstHigh = firstCandle.high;
  const firstLow = firstCandle.low;

  for (let i = 1; i < data.length; i++) {
    const currentCandle = data[i];

    if (currentCandle.high > firstHigh) {
      return Trend.UP;
    }

    if (currentCandle.low < firstLow) {
      return Trend.DOWN;
    }
  }

  // If no break occurred, throw an error
  console.error("getTrend: Unable to determine trend. No break of the first candle's high or low occurred");
  throw new BadRequestException(`getTrend: Unable to determine trend. No break of the first candle's high or low occurred.`);
};

export const calculateAngle = (pivot1: { price: number; time: number }, pivot2: { price: number; time: number }): number => {
  const deltaPrice = pivot2.price - pivot1.price;
  const deltaTime = (pivot2.time - pivot1.time) / 10000000;

  const angleInRadians = Math.atan(deltaPrice / deltaTime);
  const angleInDegrees = angleInRadians * (180 / Math.PI);

  return Math.abs(angleInDegrees);
};

export const convertPivotsToWaves = (pivots: Pivot[], degree: WaveDegree): Wave[] => {
  let waveName = WaveName._1;
  const waves: Wave[] = [];
  if (pivots.length !== 6) {
    throw new BadRequestException('Pivots array must have exactly 6 elements');
  }

  for (let i = 0; i < pivots.length - 1; i++) {
    const p1 = pivots[i];
    const p2 = pivots[i + 1];
    const wave = new Wave(waveName, degree, p1, p2);
    waves.push(wave);
    waveName++;
  }

  return waves;
};

export function groupClustersByWaves(clusters: ClusterWaves[], waveCount: number): ClusterWaves[][] {
  const groups: ClusterWaves[][] = [];

  clusters.forEach((cluster) => {
    if (cluster.waves.length < waveCount) {
      return; // Skip clusters that do not reach the minimum waveCount
    }

    const targetWaves = cluster.waves.slice(0, waveCount);
    let foundGroup = false;

    for (const group of groups) {
      const groupWaves = group[0].waves.slice(0, waveCount);
      let matches = false;

      for (let i = 0; i < waveCount; i++) {
        if (targetWaves[i].pStart.price !== groupWaves[i].pStart.price || targetWaves[i].pEnd.price !== groupWaves[i].pEnd.price) {
          matches = false;
          break;
        }
      }

      if (matches) {
        group.push(cluster);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([cluster]);
    }
  });

  return groups;
}

export function findPivotIndex(pivots: Pivot[], targetPivot: Pivot | ClusterPivot): number {
  const index = pivots.findIndex((p) => p.id === targetPivot.id || (p.time === targetPivot.time && p.price === targetPivot.price));

  if (index === -1) {
    throw new BadRequestException(`Pivot not found: ${JSON.stringify(targetPivot)}`);
  }

  return index;
}

export function getPivotsAfter(pivots: Pivot[], pivot: Pivot, includeStart = false): Pivot[] {
  const index = pivots.findIndex((p) => p.id === pivot.id);
  if (index === -1) {
    return [];
  }
  return pivots.slice(index + (includeStart ? 0 : 1));
}
