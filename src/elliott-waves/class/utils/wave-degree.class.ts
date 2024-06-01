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

  private candles: CandleTime[];

  constructor(candles: CandleTime[]) {
    this.candles = candles;
  }

  public calculateWaveDegree(): Degree {
    const commonInterval = determineCommonInterval(this.candles);

    if (commonInterval === 0) {
      throw new Error('Could not identify Degree.');
    }

    const totalDays = this.candles.length * commonInterval;
    const degrees = WaveDegreeCalculator.waveDegrees.reverse();
    for (const degree of degrees) {
      if (totalDays >= degree.minCandles && totalDays <= degree.maxCandles) {
        return degree.name;
      }
    }

    throw new Error('Could not identify Degree.');
  }
}
