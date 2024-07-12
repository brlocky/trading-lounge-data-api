import { PreconditionFailedException } from '@nestjs/common';
import { Degree, PivotType, Trend, WaveName } from 'src/elliott-waves/enums';
import { CandleDto } from 'src/search/dto';
import { Pivot } from '../pivot.class';
import { Wave } from '../wave.class';
import { ClusterWaves } from '../cluster-wave.class';
import { PivotTest } from 'src/elliott-waves/types';

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

export const getTrend = (data: CandleDto[] | Pivot[]): Trend => {
  if (data.length < 2) {
    throw new PreconditionFailedException(`getTrend: The candles array must have at least 2 elements.`);
  }

  const isPivot = (item: any): item is Pivot => item.price !== undefined;
  const startItem = data[0];
  const endItem = data[data.length - 1];
  const startPrice = isPivot(startItem) ? startItem.price : (startItem as CandleDto).low;
  const endPrice = isPivot(endItem) ? endItem.price : (endItem as CandleDto).low;

  return startPrice < endPrice ? Trend.UP : Trend.DOWN;
};

export const calculateAngle = (pivot1: { price: number; time: number }, pivot2: { price: number; time: number }): number => {
  const deltaPrice = pivot2.price - pivot1.price;
  const deltaTime = (pivot2.time - pivot1.time) / 10000000;

  const angleInRadians = Math.atan(deltaPrice / deltaTime);
  const angleInDegrees = angleInRadians * (180 / Math.PI);

  return Math.abs(angleInDegrees);
};

export const convertPivotsToWaves = (pivots: Pivot[]): Wave[] => {
  let waveName = WaveName._1;
  const waves: Wave[] = [];
  if (pivots.length !== 6) {
    throw new Error('Pivots array must have an even number of elements');
  }

  for (let i = 0; i < pivots.length - 1; i++) {
    const p1 = pivots[i];
    const p2 = pivots[i + 1];
    const wave = new Wave(waveName, Degree.SUPERMILLENNIUM, p1, p2);
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
      let matches = true;

      for (let i = 0; i < waveCount; i++) {
        if (targetWaves[i].id !== groupWaves[i].id) {
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
