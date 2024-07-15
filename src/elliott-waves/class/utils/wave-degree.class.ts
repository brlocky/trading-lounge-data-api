import { degreeToString, WaveDegree } from 'src/elliott-waves/enums';

interface WaveDegreeLocal {
  degree: WaveDegree;
  minCandles: number;
  maxCandles: number;
}

export interface CandleTime {
  time: number; // time in milliseconds since Unix epoch
}

export class WaveDegreeCalculator {
  private static waveDegrees: WaveDegreeLocal[] = [
    { degree: WaveDegree.SUPERMILLENNIUM, minCandles: 2000 * 365, maxCandles: Infinity },
    { degree: WaveDegree.MILLENNIUM, minCandles: 300 * 365, maxCandles: 2000 * 365 },
    { degree: WaveDegree.GRANDSUPERCYCLE, minCandles: 40 * 365, maxCandles: 300 * 365 },
    { degree: WaveDegree.SUPERCYCLE, minCandles: 8 * 365, maxCandles: 40 * 365 },
    { degree: WaveDegree.CYCLE, minCandles: 2 * 365, maxCandles: 8 * 365 },
    { degree: WaveDegree.PRIMARY, minCandles: 3 * 30, maxCandles: 2 * 365 },
    { degree: WaveDegree.INTERMEDIATE, minCandles: 7 * 7, maxCandles: 3 * 30 },
    { degree: WaveDegree.MINOR, minCandles: 1 * 7, maxCandles: 7 * 7 },
    { degree: WaveDegree.MINUTE, minCandles: 1, maxCandles: 1 * 7 },
    { degree: WaveDegree.MINUETTE, minCandles: 1 / 24, maxCandles: 0.99 },
    { degree: WaveDegree.SUBMINUETTE, minCandles: 0, maxCandles: 1 / 24 },
  ];

  public static calculateWaveDegreeFromCandles(candles: CandleTime[], type: 'full' | 'wave1' = 'full'): WaveDegree {
    const multiplier = type === 'full' ? 1 : 3;
    const days = WaveDegreeCalculator.getNumberOfDays(candles);
    return WaveDegreeCalculator.getWaveDegree(days * multiplier);
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
      if (days >= degreeRange.minCandles && days <= degreeRange.maxCandles) {
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
