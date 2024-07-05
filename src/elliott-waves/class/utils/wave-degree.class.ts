import { Degree } from 'src/elliott-waves/enums';
import { CandleTime, determineCommonInterval } from './candle.utils';

interface WaveDegree {
  name: Degree;
  minCandles: number;
  maxCandles: number;
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
    const commonInterval = determineCommonInterval(candles);

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
}
