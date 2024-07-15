import { CandleDto } from 'src/search/dto';
import { Candle } from '../types';

export class CandleTransformer {
  private static readonly RSI_PERIOD = 14;
  private static readonly STOCHASTIC_PERIOD = 14;

  static transform(candles: CandleDto[]): Candle[] {
    return candles.map((candle, index, array) => {
      const pastCandles = array.slice(0, index + 1);
      return {
        ...candle,
        rsi: this.calculateRSI(pastCandles),
        stochastic: this.calculateStochastic(pastCandles),
      };
    });
  }

  private static calculateRSI(candles: CandleDto[]): number {
    if (candles.length <= this.RSI_PERIOD) return 0;

    let gains = 0;
    let losses = 0;

    for (let i = candles.length - this.RSI_PERIOD; i < candles.length; i++) {
      const difference = candles[i].close - candles[i - 1].close;
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    const avgGain = gains / this.RSI_PERIOD;
    const avgLoss = losses / this.RSI_PERIOD;
    const rs = avgLoss !== 0 ? avgGain / avgLoss : 0;
    return 100 - 100 / (1 + rs);
  }

  private static calculateStochastic(candles: CandleDto[]): number {
    if (candles.length < this.STOCHASTIC_PERIOD) return 0;

    const relevantCandles = candles.slice(-this.STOCHASTIC_PERIOD);
    const currentClose = relevantCandles[relevantCandles.length - 1].close;
    const lowestLow = Math.min(...relevantCandles.map((c) => c.low));
    const highestHigh = Math.max(...relevantCandles.map((c) => c.high));

    return highestHigh - lowestLow !== 0 ? ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100 : 0;
  }
}
