import { Wave } from '../class';
import { Trend, WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExtended5 extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXTENDED_5);
  }

  public allowWave4Overlap(): boolean {
    return false;
  }

  calculateWave5Projection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);

    // Low of wave 1 with High of Wave 3
    return this.fibonacci.getProjectionPercentage(wave1.pStart.price, wave3.pEnd.price, wave4.pEnd.price, wave5.pEnd.price);
  }

  public calculateWave5ProjectionTime(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, commonInterval: number): number {
    const wave1To3 = wave1.copy();
    wave1To3.pEnd = wave3.pEnd;
    return this.calculateTimeRetracement(wave1To3, wave5, commonInterval);
  }

  public validateWaveStructure(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): boolean {
    // Wave 5 is bigger
    const wave5isBigger = wave5.length(useLogScale) >= wave1.length(useLogScale) && wave5.length(useLogScale) >= wave3.length(useLogScale);
    if (!wave5isBigger) return false;

    // Wave 3 is not the sortest
    const wave3IsNotTheShortest = wave3.length(useLogScale) >= wave1.length(useLogScale);
    if (!wave3IsNotTheShortest) return false;

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
      { range: [38.2, 68.1], score: WaveScore.WORK },
      { range: [68.1, 100], score: WaveScore.WORK },
      { range: [100, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 250], score: WaveScore.GOOD },
      { range: [250, 350], score: WaveScore.GOOD },
      { range: [350, 800], score: WaveScore.WORK },
      { range: [800, 1000], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4TimeConfig(): ScoreRange[] {
    return [
      { range: [100, 125], score: WaveScore.GOOD },
      { range: [125, 250], score: WaveScore.PERFECT },
      { range: [250, 300], score: WaveScore.GOOD },
      { range: [300, 500], score: WaveScore.WORK },
      { range: [500, 600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4LongTimeConfig(): ScoreRange[] {
    return [
      { range: [14.2, 38.2], score: WaveScore.GOOD },
      { range: [38.2, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 88.8], score: WaveScore.WORK },
      { range: [88.8, 138.2], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.WORK },
      { range: [61.8, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 200], score: WaveScore.WORK },
      { range: [200, 300], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [14.2, 23.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [23.6, 50], score: WaveScore.WORK },
      { range: [50, 55.9], score: WaveScore.PERFECT },
      { range: [55.9, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 78.6], score: WaveScore.PERFECT },
      { range: [78.6, 83.6], score: WaveScore.WORK },
      { range: [83.6, 99.9], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [101, 138.2], score: WaveScore.PERFECT },
      { range: [138.2, 161.8], score: WaveScore.GOOD },
      { range: [161.8, 1600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4RetracementConfig(): ScoreRange[] {
    return [
      { range: [7.1, 18.9], score: WaveScore.WORSTCASESCENARIO },
      { range: [18.9, 23.6], score: WaveScore.WORK },
      { range: [23.6, 30.9], score: WaveScore.GOOD },
      { range: [30.9, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 44.1], score: WaveScore.GOOD },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 61.8], score: WaveScore.WORSTCASESCENARIO }, // need to add alternation
    ];
  }

  public getWave4DeepRetracementConfig(): ScoreRange[] {
    return [
      { range: [14.2, 23.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [23.6, 50], score: WaveScore.WORK },
      { range: [50, 60], score: WaveScore.PERFECT },
      { range: [60, 64], score: WaveScore.GOOD },
      { range: [64, 78.6], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [61.8, 78.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [78.6, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 261.8], score: WaveScore.GOOD },
      { range: [261.8, 361.8], score: WaveScore.WORK },
      { range: [361.8, 668.1], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
