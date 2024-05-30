import { CandleDto } from 'src/dto';
import { MotiveWaveInterface } from 'src/elliott-waves/interfaces/motive-wave.interface';
import { ClusterWaves, Pivot } from 'src/elliott-waves/types';
import { Fibonacci } from '../../utils/fibonacci.class';
import { Degree, WaveType } from 'src/elliott-waves/enums';

export class MotiveExpandingDiagonal extends MotiveWaveInterface {
  constructor(candles: CandleDto[], pivots: Pivot[], fibs: Fibonacci, degree: Degree) {
    super(candles, pivots, fibs, degree, WaveType.MOTIVE_EXPANDING_DIAGONAL);
  }

  // Find and validate correction
  find(): ClusterWaves[] {
    return this.getImpulseWaves();
  }

  allowWave4BreakWave1Support(): boolean {
    return true;
  }

  getWave2RetracementPercentages(): [number, number] {
    return [50, 100];
  }
  getWave3ProjectionPercentages(): [number, number] {
    return [100, 181.8];
  }
  getWave4RetracementPercentages(): [number, number] {
    return [50, 100];
  }
  getWave5ProjectionPercentages(): [number, number] {
    return [100, 181.8];
  }
}
