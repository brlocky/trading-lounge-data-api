import { MotiveWaveInterface } from 'src/elliott-waves/interfaces/motive-wave.interface';
import { ClusterWaves, Pivot } from 'src/elliott-waves/types';
import { Fibonacci } from '../../utils/fibonacci.class';
import { Degree, WaveName, WaveType } from 'src/elliott-waves/enums';
import { CandleDto } from 'src/search/dto';

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
    return false;
  }

  getWave2RetracementPercentages(): [number, number, number] {
    return [14.6, 61.8, 99.9];
  }
  getWave3ProjectionPercentages(): [number, number, number] {
    //return [88.6, 423.6];
    return [141.4, 161.8, 423.6];
  }
  getWave4RetracementPercentages(): [number, number, number] {
    //return [14.6, 38.2, 61.8];
    // Allow deep wave 4
    return [14.6, 38.2, 78.6];
  }
  getWave5ProjectionPercentages(): [number, number, number] {
    //return [14.6, 99.9];
    return [14.6, 61.8, 423.6];
  }
}
