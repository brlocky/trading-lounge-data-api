import { CandleDto } from 'src/dto';
import { MotiveWaveInterface } from 'src/elliott-waves/interfaces/motive-wave.interface';
import { ClusterWaves, Pivot } from 'src/elliott-waves/types';
import { Fibonacci } from '../../utils/fibonacci.class';
import { Degree, WaveName, WaveType } from 'src/elliott-waves/enums';

export class MotiveExtendedWave5 extends MotiveWaveInterface {
  constructor(candles: CandleDto[], pivots: Pivot[], fibs: Fibonacci, degree: Degree) {
    super(candles, pivots, fibs, degree, WaveType.MOTIVE_EXTENDED_5);
  }

  find(): ClusterWaves[] {
    return this.getImpulseWaves();
  }

  getExtendedWave(): WaveName {
    return WaveName._5;
  }

  calculateWave5ProjectionFromWave3Lenght(): boolean {
    return true;
  }

  getWave2RetracementPercentages(): [number, number] {
    return [14.6, 99.9];
  }
  getWave3ProjectionPercentages(): [number, number] {
    return [100, 168.1];
  }
  getWave4RetracementPercentages(): [number, number] {
    return [14.6, 50];
  }
  getWave5ProjectionPercentages(): [number, number] {
    return [141.4, 861.8];
  }
}
