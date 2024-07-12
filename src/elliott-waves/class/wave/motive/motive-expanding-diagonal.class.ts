import { Degree, WaveType } from 'src/elliott-waves/enums';
import { MotiveWaveInterface } from 'src/elliott-waves/interfaces/motive-wave.interface';
import { Pivot } from '../../pivot.class';

export class MotiveExpandingDiagonal extends MotiveWaveInterface {
  constructor(degree: Degree) {
    super(degree, WaveType.MOTIVE_EXPANDING_DIAGONAL);
  }

  allowWave4BreakWave1Support(): boolean {
    return true;
  }

  isValidWave3Stucture(p0: Pivot, p1: Pivot, p2: Pivot, p3: Pivot): boolean {
    const w1Gains = this.fibonacci.calculatePercentageGain(p0.price, p1.price);
    const w3Gains = this.fibonacci.calculatePercentageGain(p2.price, p3.price);
    return w3Gains > w1Gains;
  }

  isValidWave4Stucture(p0: Pivot, p1: Pivot, p2: Pivot, p3: Pivot, p4: Pivot): boolean {
    const w2Gains = this.fibonacci.calculatePercentageDecrease(p1.price, p2.price);
    const w4Gains = this.fibonacci.calculatePercentageDecrease(p3.price, p4.price);
    return w4Gains > w2Gains;
  }

  isValidWave5Stucture(p0: Pivot, p1: Pivot, p2: Pivot, p3: Pivot, p4: Pivot, p5: Pivot): boolean {
    const w3Gains = this.fibonacci.calculatePercentageGain(p2.price, p3.price);
    const w5Gains = this.fibonacci.calculatePercentageGain(p4.price, p5.price);
    return w5Gains > w3Gains;
  }

  getWave2RetracementPercentages(): [number, number, number] {
    return [50, 78.6, 99.9];
  }
  getWave3ProjectionPercentages(): [number, number, number] {
    return [127.2, 161.8, 181.8];
  }
  getWave4RetracementPercentages(): [number, number, number] {
    return [61.8, 78.6, 100];
  }
  getWave5ProjectionPercentages(): [number, number, number] {
    return [100, 161.8, 181.8];
  }
}
