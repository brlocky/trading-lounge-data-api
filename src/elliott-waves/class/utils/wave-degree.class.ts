import { Degree } from 'src/elliott-waves/enums';

interface WaveDegree {
  name: Degree;
  minCandles: number;
  maxCandles: number;
}

export interface CandleTime {
  time: number; // time in milliseconds since Unix epoch
}

export class WaveDegreeCalculator {
  private static waveDegrees: WaveDegree[] = [
    { name: Degree.SUPERMILLENNIUM, minCandles: 2000 * 365, maxCandles: Infinity },
    { name: Degree.MILLENNIUM, minCandles: 300 * 365, maxCandles: 2000 * 365 },
    { name: Degree.GRANDSUPERCYCLE, minCandles: 40 * 365, maxCandles: 300 * 365 },
    { name: Degree.SUPERCYCLE, minCandles: 8 * 365, maxCandles: 40 * 365 },
    { name: Degree.CYCLE, minCandles: 2 * 365, maxCandles: 8 * 365 },
    { name: Degree.PRIMARY, minCandles: 3 * 30, maxCandles: 2 * 365 },
    { name: Degree.INTERMEDIATE, minCandles: 7 * 7, maxCandles: 3 * 30 },
    { name: Degree.MINOR, minCandles: 1 * 7, maxCandles: 7 * 7 },
    { name: Degree.MINUTE, minCandles: 1, maxCandles: 1 * 7 },
    { name: Degree.MINUETTE, minCandles: 1 / 24, maxCandles: 0.99 },
    { name: Degree.SUBMINUETTE, minCandles: 0, maxCandles: 1 / 24 },
  ];

  public static calculateWaveDegree(candles: CandleTime[]): Degree {
    const totalDays = this.getNumberOfDays(candles);
    return this.getWaveDegree(totalDays);
  }

  public static getNumberOfDays(candles: CandleTime[]): Degree {
    const commonInterval = this.determineCommonInterval(candles);

    if (commonInterval === 0) {
      throw new Error('Could not identify Degree.');
    }

    return candles.length * commonInterval;
  }

  public static getWaveDegree(days: number): Degree {
    const degrees = WaveDegreeCalculator.waveDegrees.reverse();
    for (const degree of degrees) {
      if (days >= degree.minCandles && days <= degree.maxCandles) {
        return degree.name;
      }
    }

    throw new Error('Could not identify Degree.');
  }

  private static determineCommonInterval(candles: CandleTime[]): number {
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
