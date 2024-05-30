import { PreconditionFailedException } from '@nestjs/common';
import { CandleDto } from 'src/dto';
import { PivotType, Trend } from 'src/elliott-waves/enums';
import { Pivot, PivotSearchResult } from 'src/elliott-waves/types';

/**
 * Get next Low before it breaks the Resistance
 * @param pivots
 * @param pivot
 * @returns
 */
export const getLLBeforeBreak = (pivots: Pivot[], pivot: Pivot): PivotSearchResult => {
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
      type: 'NOT-FOUND',
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
export const getHHBeforeBreak = (pivots: Pivot[], pivot: Pivot): PivotSearchResult => {
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
      type: 'NOT-FOUND',
    };
  }

  return { pivot: nextHigh, type: didBreak ? 'FOUND-WITH-BREAK' : 'FOUND-NO-BREAK' };
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
