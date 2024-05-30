import { CandleDto } from 'src/dto';
import { MotiveWaveInterface } from 'src/elliott-waves/interfaces/motive-wave.interface';
import { ClusterWaves, Pivot } from 'src/elliott-waves/types';
import { Fibonacci } from '../../utils/fibonacci.class';
import { Degree, WaveName, WaveType } from 'src/elliott-waves/enums';

export class MotiveExtendedWave3 extends MotiveWaveInterface {
  constructor(candles: CandleDto[], pivots: Pivot[], fibs: Fibonacci, degree: Degree) {
    super(candles, pivots, fibs, degree, WaveType.MOTIVE_EXTENDED_3);
  }

  // Find and validate correction
  find(): ClusterWaves[] {
    return this.getImpulseWaves();
  }

  getExtendedWave(): WaveName {
    return WaveName._3;
  }

  calculateWave5ProjectionFromWave3Lenght(): boolean {
    return true;
  }

  getWave2RetracementPercentages(): [number, number] {
    return [14.6, 88.6];
  }
  getWave3ProjectionPercentages(): [number, number] {
    return [141.4, 861.8];
  }
  getWave4RetracementPercentages(): [number, number] {
    return [14.6, 55];
  }
  getWave5ProjectionPercentages(): [number, number] {
    return [23.6, 99.9];
  }
}
