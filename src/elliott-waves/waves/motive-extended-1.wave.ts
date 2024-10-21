import { Wave } from '../class';
import { Trend, WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExtended1 extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXTENDED_1);
  }

  public allowWave4Overlap(): boolean {
    return false;
  }

  public validateChannel(waves: Wave[], useLogScale: boolean): WaveScore {
    return WaveScore.INVALID;
  }

  public calculateWave5Projection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getProjectionPercentage(wave1.pStart.price, wave1.pEnd.price, wave2.pEnd.price, wave5.pEnd.price);
  }

  public calculateWave5ProjectionTime(
    wave1: Wave,
    wave2: Wave,
    wave3: Wave,
    wave4: Wave,
    wave5: Wave,
    commonInterval: number,
    useLogScale: boolean,
  ): number {
    return this.calculateLengthRetracement(wave3, wave5, commonInterval, useLogScale);
  }

  public validateWaveStructure(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): boolean {
    // Wave 1 is bigger
    const wave1isBigger = wave1.length(useLogScale) >= wave3.length(useLogScale) && wave3.length(useLogScale) >= wave5.length(useLogScale);
    if (!wave1isBigger) return false;

    // Wave 3 is not the sortest
    // Invalidation when wave 5 is bigger than 3
    const wave3IsNotTheShortest = wave3.length(useLogScale) >= wave5.length(useLogScale);
    if (!wave3IsNotTheShortest) return false;

    if (wave1.trend() === Trend.UP && wave5.pEnd.price < wave3.pEnd.price) {
      return false;
    }
    if (wave1.trend() === Trend.DOWN && wave5.pEnd.price > wave3.pEnd.price) {
      return false;
    }

    return true;
  }

  // Configurations
  public getWave2TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 14.2], score: WaveScore.INVALID },
      { range: [14.2, 38.2], score: WaveScore.GOOD },
      { range: [38.2, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 88.8], score: WaveScore.WORK },
      { range: [88.8, 138.2], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3TimeConfig(): ScoreRange[] {
    return [
      { range: [14.3, 23.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [23.6, 38.2], score: WaveScore.WORK },
      { range: [38.2, 68.1], score: WaveScore.PERFECT },
      { range: [68.1, 100], score: WaveScore.GOOD },
      { range: [100, 138.2], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4TimeConfig(): ScoreRange[] {
    return [
      { range: [23.6, 38.2], score: WaveScore.INVALID },
      { range: [38.2, 100], score: WaveScore.INVALID },
      { range: [100, 125], score: WaveScore.GOOD },
      { range: [125, 250], score: WaveScore.PERFECT },
      { range: [250, 300], score: WaveScore.GOOD },
      { range: [300, 500], score: WaveScore.WORK },
      { range: [500, 600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4LongTimeConfig(): ScoreRange[] {
    return [
      { range: [0, 14.2], score: WaveScore.INVALID },
      { range: [14.2, 38.2], score: WaveScore.GOOD },
      { range: [38.2, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 88.8], score: WaveScore.WORK },
      { range: [88.8, 138.2], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5TimeConfig(): ScoreRange[] {
    return [
      { range: [14.3, 23.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [23.6, 38.2], score: WaveScore.WORK },
      { range: [38.2, 68.1], score: WaveScore.PERFECT },
      { range: [68.1, 100], score: WaveScore.GOOD },
      { range: [100, 138.2], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [14.2, 23.6], score: WaveScore.WORK },
      { range: [23.6, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 45], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [38.2, 50], score: WaveScore.WORSTCASESCENARIO },
      { range: [50, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 70], score: WaveScore.GOOD },
      { range: [70, 80], score: WaveScore.WORK },
      { range: [80, 99], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4RetracementConfig(): ScoreRange[] {
    return [
      { range: [14.2, 23.6], score: WaveScore.WORK },
      { range: [23.6, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 50], score: WaveScore.WORK },
      { range: [50, 61.8], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4DeepRetracementConfig(): ScoreRange[] {
    return [
      { range: [10, 23.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [23.6, 50], score: WaveScore.WORK },
      { range: [50, 60], score: WaveScore.PERFECT },
      { range: [60, 64], score: WaveScore.GOOD },
      { range: [64, 78.6], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [14.2, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 60], score: WaveScore.WORK },
      { range: [60, 78.6], score: WaveScore.PERFECT },
      { range: [78.6, 88.6], score: WaveScore.GOOD },
      { range: [88.6, 138.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [138.2, 261.8], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
