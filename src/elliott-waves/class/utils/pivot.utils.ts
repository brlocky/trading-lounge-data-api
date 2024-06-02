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

export const calculateAngle = (pivot1: { price: number; time: number }, pivot2: { price: number; time: number }): number => {
  const deltaPrice = pivot2.price - pivot1.price;
  const deltaTime = (pivot2.time - pivot1.time) / 10000000;

  const angleInRadians = Math.atan(deltaPrice / deltaTime);
  const angleInDegrees = angleInRadians * (180 / Math.PI);

  return Math.abs(angleInDegrees);
};

export const projectTime = (
  pivot: { price: number; time: number },
  targetPrice: number,
  angleDegrees: number,
  useLogScale: boolean = false,
): number => {
  // Ensure prices are positive for logarithmic scale
  if (useLogScale && (pivot.price <= 0 || targetPrice <= 0)) {
    throw new Error('Prices must be greater than zero when using logarithmic scale');
  }

  const angleRadians = angleDegrees * (Math.PI / 180);

  let deltaPrice: number;

  if (useLogScale) {
    // Use logarithmic scale for prices
    const logPivotPrice = Math.log(pivot.price);
    const logTargetPrice = Math.log(targetPrice);
    deltaPrice = logTargetPrice - logPivotPrice;
  } else {
    // Use linear scale for prices
    deltaPrice = targetPrice - pivot.price;
  }

  // Calculate the time difference
  const deltaTime = Math.abs(deltaPrice) / Math.tan(angleRadians);

  // Convert deltaTime back to the original scale if you used a scale factor previously
  const projectedTime = pivot.time + deltaTime * 10000000;

  return projectedTime;
};
