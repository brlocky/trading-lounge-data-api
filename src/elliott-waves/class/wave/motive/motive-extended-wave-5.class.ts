import { WaveDegree, WaveName, WaveType } from 'src/elliott-waves/enums';
import { MotiveWaveInterface } from 'src/elliott-waves/interfaces/motive-wave.interface';

export class MotiveExtendedWave5 extends MotiveWaveInterface {
  constructor(degree: WaveDegree) {
    super(degree, WaveType.MOTIVE_EXTENDED_5);
  }

  getExtendedWave(): WaveName {
    return WaveName._5;
  }

  calculateWave5ProjectionFromWave3Lenght(): boolean {
    return true;
  }

  getWave2RetracementPercentages(): [number, number, number] {
    return [14.6, 68.1, 99.9];
  }
  getWave3ProjectionPercentages(): [number, number, number] {
    return [68.1, 161.8, 268.1];
  }
  getWave4RetracementPercentages(): [number, number, number] {
    return [14.6, 38.2, 50];
  }
  getWave5ProjectionPercentages(): [number, number, number] {
    return [100, 161.8, 423.6];
  }
}
