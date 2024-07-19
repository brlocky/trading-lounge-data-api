import { degreeToString, WaveDegree } from 'src/elliott-waves/enums';

export interface WaveDegreeNode {
  degree: WaveDegree;
  minDays: number;
  maxDays: number;
  useLogScale: boolean;
}

export interface CandleTime {
  time: number; // time in milliseconds since Unix epoch
}

export class WaveDegreeCalculator {
  private static waveDegrees: WaveDegreeNode[] = [
    { degree: WaveDegree.SUPERMILLENNIUM, minDays: 365000, maxDays: Infinity, useLogScale: true }, // minDays: ~1000 years, maxDays: Forever
    { degree: WaveDegree.MILLENNIUM, minDays: 73000, maxDays: 365000, useLogScale: true }, // minDays: ~200 years, maxDays: ~1000 years
    { degree: WaveDegree.SUBMILLENNIUM, minDays: 18250, maxDays: 73000, useLogScale: true }, // minDays: ~50 years, maxDays: ~200 years
    { degree: WaveDegree.GRANDSUPERCYCLE, minDays: 7300, maxDays: 18250, useLogScale: true }, // minDays: ~20 years, maxDays: ~50 years
    { degree: WaveDegree.SUPERCYCLE, minDays: 3650, maxDays: 7300, useLogScale: true }, // minDays: ~10 years, maxDays: ~20 years
    { degree: WaveDegree.CYCLE, minDays: 365, maxDays: 3650, useLogScale: true }, // minDays: ~1 year, maxDays: ~10 years
    { degree: WaveDegree.PRIMARY, minDays: 30, maxDays: 365, useLogScale: false }, // minDays: ~1 month, maxDays: ~1 year
    { degree: WaveDegree.INTERMEDIATE, minDays: 7, maxDays: 30, useLogScale: false }, // minDays: ~1 week, maxDays: ~1 month
    { degree: WaveDegree.MINOR, minDays: 1, maxDays: 7, useLogScale: false }, // minDays: 1 day, maxDays: ~1 week
    { degree: WaveDegree.MINUTE, minDays: 0.04, maxDays: 1, useLogScale: false }, // minDays: ~1 hour, maxDays: 1 day
    { degree: WaveDegree.MINUETTE, minDays: 0.0008, maxDays: 0.04, useLogScale: false }, // minDays: ~1 minute, maxDays: ~1 hour
    { degree: WaveDegree.SUBMINUETTE, minDays: 0.0001, maxDays: 0.0008, useLogScale: false }, // minDays: ~10 seconds, maxDays: ~1 minute
    { degree: WaveDegree.MICRO, minDays: 0.00001, maxDays: 0.0001, useLogScale: false }, // minDays: ~1 second, maxDays: ~10 seconds
    { degree: WaveDegree.SUBMICRO, minDays: 0.000001, maxDays: 0.00001, useLogScale: false }, // minDays: ~0.1 second, maxDays: ~1 second
    { degree: WaveDegree.MINISCULE, minDays: 0, maxDays: 0.000001, useLogScale: false }, // minDays: 0 seconds, maxDays: ~0.1 second
  ];

  public static getConfig(): WaveDegreeNode[] {
    return this.waveDegrees;
  }

  public static getDegreeConfig(degree: WaveDegree): WaveDegreeNode {
    const config = this.waveDegrees.find((d) => d.degree === degree);

    if (!config) throw new Error(`Could not find Wave Degree config ${degree}`);
    return config;
  }

  public static calculateWaveDegreeFromCandles(candles: CandleTime[], type: 'full' | 'wave1' = 'full'): WaveDegreeNode {
    const days = WaveDegreeCalculator.getNumberOfDays(candles);
    return WaveDegreeCalculator.getWaveDegree(days, type);
  }

  public static calculateWaveDegreeFromDays(days: number, type: 'full' | 'wave1' = 'full'): WaveDegreeNode {
    return WaveDegreeCalculator.getWaveDegree(days, type);
  }

  private static getNumberOfDays(candles: CandleTime[]): number {
    const commonInterval = this.determineCommonInterval(candles);

    if (commonInterval === 0) {
      throw new Error('Could not identify Degree.');
    }

    return candles.length * commonInterval;
  }

  private static getWaveDegree(days: number, type: 'full' | 'wave1'): WaveDegreeNode {
    const adjustedDays = type === 'wave1' ? days * 8 : days; // Multiply by 8 for wave1 type to represent full cycle
    const degreeRanges = WaveDegreeCalculator.waveDegrees.slice().reverse();
    for (const degreeRange of degreeRanges) {
      if (adjustedDays >= degreeRange.minDays && adjustedDays <= degreeRange.maxDays) {
        console.info('found degree:', degreeToString(degreeRange.degree));
        return degreeRange;
      }
    }

    throw new Error('Could not identify Degree.');
  }

  // Analyze the candles param and return the common interval in Days
  public static determineCommonInterval(candles: { time: number }[]): number {
    const intervals = (): number[] => {
      const intervals: number[] = [];
      for (let i = 1; i < candles.length; i++) {
        const interval = (candles[i].time - candles[i - 1].time) / (60 * 60 * 24); // Convert seconds to days
        intervals.push(interval);
      }
      return intervals;
    };

    const intervalCounts: { [key: string]: number } = {};
    for (const interval of intervals()) {
      const roundedInterval = interval.toFixed(6); // Round to six decimal places for better accuracy
      if (!intervalCounts[roundedInterval]) {
        intervalCounts[roundedInterval] = 0;
      }
      intervalCounts[roundedInterval]++;
    }

    let commonInterval = 0;
    let maxCount = 0;
    for (const interval in intervalCounts) {
      if (intervalCounts[interval] > maxCount) {
        maxCount = intervalCounts[interval];
        commonInterval = parseFloat(interval);
      }
    }
    return commonInterval; // The result is in days
  }
}
