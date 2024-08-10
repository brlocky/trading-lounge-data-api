import { Wave } from '../class';
import { Trend, WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveContractingDiagonal extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_CONTRACTING_DIAGONAL);
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
    // Wave 3 is bigger than wave5
    const wave3IsBiggerThanWave5 = wave3.length(useLogScale) > wave5.length(useLogScale);
    if (!wave3IsBiggerThanWave5) return false;

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
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 99], score: WaveScore.PERFECT },
      { range: [99, 161.8], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 90], score: WaveScore.PERFECT },
      { range: [90, 99.9], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 90], score: WaveScore.PERFECT },
      { range: [90, 161.8], score: WaveScore.WORSTCASESCENARIO },
      { range: [161.8, 200], score: WaveScore.INVALID },
    ];
  }

  public getWave5TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 78.6], score: WaveScore.PERFECT },
      { range: [78.6, 99.9], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [30.9, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 44.1], score: WaveScore.WORK },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 55.9], score: WaveScore.GOOD },
      { range: [55.9, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 70.2], score: WaveScore.PERFECT },
      { range: [70.2, 78.6], score: WaveScore.GOOD },
      { range: [78.6, 88.6], score: WaveScore.WORK },
      { range: [88.6, 99], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [68.1, 78.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [78.6, 88.6], score: WaveScore.PERFECT },
      { range: [88.6, 90], score: WaveScore.GOOD },
      { range: [90, 99], score: WaveScore.WORK },
      { range: [99, 110], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4RetracementConfig(): ScoreRange[] {
    return [
      { range: [23.6, 30.9], score: WaveScore.WORSTCASESCENARIO },
      { range: [30.9, 38.2], score: WaveScore.WORK },
      { range: [38.2, 44.1], score: WaveScore.GOOD },
      { range: [44.1, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 70.2], score: WaveScore.GOOD },
      { range: [70.2, 83.6], score: WaveScore.WORK },
      { range: [83.6, 88.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [88.6, 94.3], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [68.1, 78.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [78.6, 88.6], score: WaveScore.PERFECT },
      { range: [88.6, 90], score: WaveScore.GOOD },
      { range: [90, 99], score: WaveScore.WORK },
      { range: [99, 110], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
