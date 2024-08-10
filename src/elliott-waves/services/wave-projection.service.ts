import { Injectable } from '@nestjs/common';
import { ClusterPivot, Pivot, Wave } from '../class';
import { TimeProjection } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { WaveName } from '../enums';

@Injectable()
export class WaveProjectionService {
  protected fibonacci: Fibonacci;

  constructor() {
    this.fibonacci = new Fibonacci();
  }

  /**
   * Projects an impulse wave pattern based on wave1 and wave2
   * @param wave1 The first wave of the impulse
   * @param wave2 The second wave of the impulse
   * @param useLogScale Whether to use logarithmic scale for calculations
   * @returns An array of projected waves [wave3, wave4, wave5]
   */
  projectImpulse(wave1: Wave, wave2: Wave, useLogScale: boolean): Wave[] {
    this.fibonacci.setLogScale(useLogScale);

    // Calculate retracement and determine if it's a deep retracement
    const retracement = this.fibonacci.getRetracementPercentage(wave1.pStart.price, wave1.pEnd.price, wave2.pEnd.price);
    const isDeepRetracement = retracement >= 50;

    const wave3 = this.projectWave3(wave1, wave2, useLogScale);
    const wave4 = this.projectWave4(wave1, wave2, wave3, isDeepRetracement, useLogScale);
    const wave5 = this.projectWave5(wave1, wave2, wave4, useLogScale);

    return [wave3, wave4, wave5];
  }

  /**
   * Projects wave 3 based on wave 1 and wave 2
   * @param wave1 The first wave of the impulse
   * @param wave2 The second wave of the impulse
   * @param useLogScale Whether to use logarithmic scale for calculations
   * @returns Projected wave 3
   */
  projectWave3(wave1: Wave, wave2: Wave, useLogScale: boolean): Wave {
    this.fibonacci.setLogScale(useLogScale);
    const wave3Target = this.fibonacci.getProjectionPrice(wave1.pStart.price, wave1.pEnd.price, wave2.pEnd.price, 161.8);
    const wave3ProjectedTime = TimeProjection.projectTime(wave1.pStart.time, wave1.pEnd.time, wave2.pEnd.time, 161.8);
    const p3 = new ClusterPivot(new Pivot(-1, wave1.pEnd.type, wave3Target, wave3ProjectedTime), 'PROJECTED');
    return new Wave(WaveName._3, wave1.degree, wave2.pEnd, p3);
  }

  /**
   * Projects wave 4 based on previous waves and retracement depth
   * @param wave1 The first wave of the impulse
   * @param wave2 The second wave of the impulse
   * @param wave3 The projected third wave
   * @param isDeepRetracement Whether the second wave had a deep retracement
   * @param useLogScale Whether to use logarithmic scale for calculations
   * @returns Projected wave 4
   */
  projectWave4(wave1: Wave, wave2: Wave, wave3: Wave, isDeepRetracement: boolean, useLogScale: boolean): Wave {
    this.fibonacci.setLogScale(useLogScale);
    const wave4Retracement = isDeepRetracement ? 38.2 : 50;
    const wave4Target = this.fibonacci.getRetracementPrice(wave2.pEnd.price, wave3.pEnd.price, wave4Retracement);
    const wave4ProjectedTime = TimeProjection.projectTime(
      wave2.pStart.time,
      wave2.pEnd.time,
      wave3.pEnd.time,
      isDeepRetracement ? 200 : 100,
    );
    const p4 = new ClusterPivot(new Pivot(-1, wave2.pEnd.type, wave4Target, wave4ProjectedTime), 'PROJECTED');
    return new Wave(WaveName._4, wave1.degree, wave3.pEnd, p4);
  }

  /**
   * Projects wave 5 based on previous waves
   * @param wave1 The first wave of the impulse
   * @param wave2 The second wave of the impulse
   * @param wave4 The projected fourth wave
   * @param useLogScale Whether to use logarithmic scale for calculations
   * @returns Projected wave 5
   */
  projectWave5(wave1: Wave, wave2: Wave, wave4: Wave, useLogScale: boolean): Wave {
    this.fibonacci.setLogScale(useLogScale);
    const wave5Target = this.fibonacci.getProjectionPrice(wave1.pStart.price, wave1.pEnd.price, wave4.pEnd.price, 100);
    const wave5ProjectedTime = TimeProjection.projectTime(wave1.pStart.time, wave1.pEnd.time, wave4.pEnd.time, 100);
    const p5 = new ClusterPivot(new Pivot(-1, wave1.pEnd.type, wave5Target, wave5ProjectedTime), 'PROJECTED');
    return new Wave(WaveName._5, wave1.degree, wave4.pEnd, p5);
  }
}
