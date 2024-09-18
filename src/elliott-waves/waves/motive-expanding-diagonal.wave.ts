import { Wave } from '../class';
import { Trend, WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExpandingDiagonal extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXPANDING_DIAGONAL);
  }

  public allowWave4Overlap(): boolean {
    return true;
  }

  public calculateWave5Projection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getProjectionPercentage(wave3.pStart.price, wave3.pEnd.price, wave4.pEnd.price, wave5.pEnd.price);
  }

  public calculateWave5ProjectionTime(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, commonInterval: number): number {
    return this.calculateTimeRetracement(wave3, wave5, commonInterval);
  }

  public validateWaveStructure(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): boolean {
    // Wave 4 longer than wave 2
    const wave4IsLongerThanWave2 = wave4.length(useLogScale) > wave2.length(useLogScale);
    const wave4IsMoreTimeThanWave2 = wave4.duration() > wave2.duration();
    if (!wave4IsLongerThanWave2 && !wave4IsMoreTimeThanWave2) return false;

    // Wave 3 is shorter than wave 5 ( we allow 88.6 to be valid)
    const wave3IsShorterThanWave5 = wave3.length(useLogScale) < wave5.length(useLogScale);
    if (!wave3IsShorterThanWave5) {
      if (this.calculateWave5Projection(wave1, wave2, wave3, wave4, wave5, useLogScale) <= 88.6) {
        return false;
      }
    }

    if (wave1.trend() === Trend.UP && wave5.pEnd.price < wave3.pEnd.price) {
      return false;
    }
    if (wave1.trend() === Trend.DOWN && wave5.pEnd.price > wave3.pEnd.price) {
      return false;
    }

    return true;
  }

  public getWave2TimeConfig(): ScoreRange[] {
    return [
      { range: [23.6, 38.2], score: WaveScore.WORK },
      { range: [38.2, 300], score: WaveScore.PERFECT },
      { range: [300, 400], score: WaveScore.WORK },
      { range: [400, 600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3TimeConfig(): ScoreRange[] {
    return [
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 99], score: WaveScore.WORK },
      { range: [99, 110], score: WaveScore.GOOD },
      { range: [110, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 268.1], score: WaveScore.WORK },
      { range: [268.1, 800], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4TimeConfig(): ScoreRange[] {
    return [
      { range: [70, 99], score: WaveScore.WORSTCASESCENARIO },
      { range: [99, 100], score: WaveScore.WORK },
      { range: [100, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 300], score: WaveScore.WORK },
      { range: [300, 1000], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5TimeConfig(): ScoreRange[] {
    return [
      { range: [14.2, 88.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [88.6, 100], score: WaveScore.WORK },
      { range: [100, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 200], score: WaveScore.WORK },
      { range: [200, 250], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [38.2, 44.1], score: WaveScore.WORSTCASESCENARIO },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 88.6], score: WaveScore.PERFECT },
      { range: [88.6, 90], score: WaveScore.WORK },
      { range: [90, 99.9], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [90, 99], score: WaveScore.WORSTCASESCENARIO },
      { range: [99, 100], score: WaveScore.WORK },
      { range: [100, 138.1], score: WaveScore.PERFECT },
      { range: [138.1, 161.8], score: WaveScore.GOOD },
      { range: [161.8, 361.8], score: WaveScore.WORK },
      { range: [361.8, 461.8], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4RetracementConfig(): ScoreRange[] {
    return [
      { range: [38.2, 44.1], score: WaveScore.WORSTCASESCENARIO },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 88.6], score: WaveScore.PERFECT },
      { range: [88.6, 90], score: WaveScore.WORK },
      { range: [90, 94.3], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [88.6, 100], score: WaveScore.WORSTCASESCENARIO },
      { range: [100, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 261.8], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
