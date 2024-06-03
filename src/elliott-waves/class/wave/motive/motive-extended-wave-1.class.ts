import { MotiveWaveInterface } from 'src/elliott-waves/interfaces/motive-wave.interface';
import { ClusterWaves, Pivot } from 'src/elliott-waves/types';
import { Fibonacci } from '../../utils/fibonacci.class';
import { Degree, WaveName, WaveType } from 'src/elliott-waves/enums';
import { CandleDto } from 'src/search/dto';

export class MotiveExtendedWave1 extends MotiveWaveInterface {
  constructor(candles: CandleDto[], pivots: Pivot[], fibs: Fibonacci, degree: Degree) {
    super(candles, pivots, fibs, degree, WaveType.MOTIVE_EXTENDED_1);
  }

  // Find and validate correction
  find(): ClusterWaves[] {
    return this.getImpulseWaves();
  }

  getExtendedWave(): WaveName {
    return WaveName._1;
  }

  calculateWave5ProjectionFromWave3Lenght(): boolean {
    return true;
  }

  getWave2RetracementPercentages(): [number, number, number] {
    return [14.6, 50, 99.9];
  }
  getWave3ProjectionPercentages(): [number, number, number] {
    return [38.2, 50, 99.9];
  }
  getWave4RetracementPercentages(): [number, number, number] {
    return [14.6, 38.2, 50];
  }
  getWave5ProjectionPercentages(): [number, number, number] {
    return [14.6, 38.2, 99.9];
  }
}
