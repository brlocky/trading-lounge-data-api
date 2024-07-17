import { degreeToString, WaveDegree } from 'src/elliott-waves/enums';

interface WaveDegreeLocal {
  degree: WaveDegree;
  minDays: number;
  maxDays: number;
  useLogScale: boolean;
}

export interface CandleTime {
  time: number; // time in milliseconds since Unix epoch
}

export class WaveDegreeCalculator {
  private static waveDegrees: WaveDegreeLocal[] = [
    { degree: WaveDegree.SUPERMILLENNIUM, minDays: 125 * 365, maxDays: Infinity, useLogScale: true },
    { degree: WaveDegree.MILLENNIUM, minDays: 62.5 * 365, maxDays: 125 * 365, useLogScale: true },
    { degree: WaveDegree.SUBMILLENNIUM, minDays: 12.5 * 365, maxDays: 62.5 * 365, useLogScale: true },
    { degree: WaveDegree.GRANDSUPERCYCLE, minDays: 6.25 * 365, maxDays: 12.5 * 365, useLogScale: true },
    { degree: WaveDegree.SUPERCYCLE, minDays: 3.75 * 365, maxDays: 12.5 * 365, useLogScale: true },
    { degree: WaveDegree.CYCLE, minDays: 1.25 * 365, maxDays: 2.5 * 365, useLogScale: true },
    { degree: WaveDegree.PRIMARY, minDays: 45, maxDays: 228, useLogScale: false },
    { degree: WaveDegree.INTERMEDIATE, minDays: 4, maxDays: 91, useLogScale: false },
    { degree: WaveDegree.MINOR, minDays: 1, maxDays: 11, useLogScale: false },
    { degree: WaveDegree.MINUTE, minDays: 0.125, maxDays: 1.75, useLogScale: false },
    { degree: WaveDegree.MINUETTE, minDays: 0.005, maxDays: 0.375, useLogScale: false },
    { degree: WaveDegree.SUBMINUETTE, minDays: 0.0001, maxDays: 0.005, useLogScale: false },
    { degree: WaveDegree.MICRO, minDays: 0.000012, maxDays: 0.0001, useLogScale: false },
    { degree: WaveDegree.SUBMICRO, minDays: 0.0000012, maxDays: 0.000012, useLogScale: false },
    { degree: WaveDegree.MINISCULE, minDays: 0, maxDays: 0.0000012, useLogScale: false },
  ];

  public static calculateWaveDegreeFromCandles(candles: CandleTime[], type: 'full' | 'wave1' = 'full'): WaveDegree {
    const divider = type === 'full' ? 8 : 64;
    const days = WaveDegreeCalculator.getNumberOfDays(candles);
    return WaveDegreeCalculator.getWaveDegree(days / divider);
  }

  public static calculateWaveDegreeFromDays(days: number): WaveDegree {
    return WaveDegreeCalculator.getWaveDegree(days);
  }

  private static getNumberOfDays(candles: CandleTime[]): number {
    const commonInterval = this.determineCommonInterval(candles);

    if (commonInterval === 0) {
      throw new Error('Could not identify Degree.');
    }

    return candles.length * commonInterval;
  }

  private static getWaveDegree(days: number): WaveDegree {
    const degreeRanges = WaveDegreeCalculator.waveDegrees.reverse();
    for (const degreeRange of degreeRanges) {
      if (days >= degreeRange.minDays && days <= degreeRange.maxDays) {
        console.info('found degree:', degreeToString(degreeRange.degree));
        return degreeRange.degree;
      }
    }

    throw new Error('Could not identify Degree.');
  }

  // Analyze the candles param and return the common interval in Days
  public static determineCommonInterval(candles: CandleTime[]): number {
    const intervals = (): number[] => {
      const intervals: number[] = [];
      for (let i = 1; i < candles.length; i++) {
        const interval = (candles[i].time - candles[i - 1].time) / (60 * 60 * 24);
        intervals.push(interval);
      }
      return intervals;
    };

    const intervalCounts: { [key: number]: number } = {};
    for (const interval of intervals()) {
      if (!intervalCounts[interval]) {
        intervalCounts[interval] = 0;
      }
      intervalCounts[interval]++;
    }
    let commonInterval = 0;
    let maxCount = 0;
    for (const interval in intervalCounts) {
      if (intervalCounts[interval] > maxCount) {
        maxCount = intervalCounts[interval];
        commonInterval = parseFloat(interval);
      }
    }
    return commonInterval;
  }
}
