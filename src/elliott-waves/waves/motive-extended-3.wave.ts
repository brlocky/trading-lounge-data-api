import { Wave } from '../class';
import { Trend, WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExtended3 extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXTENDED_3);
  }

  public allowWave4Overlap(): boolean {
    return false;
  }

  calculateWave5Projection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getProjectionPercentage(wave3.pStart.price, wave3.pEnd.price, wave4.pEnd.price, wave5.pEnd.price);
  }

  public calculateWave5ProjectionTime(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, commonInterval: number): number {
    return this.calculateTimeRetracement(wave1, wave5, commonInterval);
  }

  public validateWaveStructure(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): boolean {
    // Wave 3 is bigger
    const wave3isBigger = wave3.length(useLogScale) >= wave1.length(useLogScale) && wave3.length(useLogScale) >= wave5.length(useLogScale);
    if (!wave3isBigger) return false;

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
      { range: [1, 5], score: WaveScore.WORSTCASESCENARIO },
      { range: [5, 10], score: WaveScore.WORK },
      { range: [10, 38.2], score: WaveScore.GOOD },
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
      { range: [83.6, 88.6], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [101, 110], score: WaveScore.WORSTCASESCENARIO },
      { range: [110, 138.2], score: WaveScore.WORK },
      { range: [138.2, 160], score: WaveScore.GOOD },
      { range: [160, 268.1], score: WaveScore.PERFECT },
      { range: [268.1, 468.1], score: WaveScore.WORK },
      { range: [468.1, 1600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4RetracementConfig(): ScoreRange[] {
    return [
      { range: [10, 18.9], score: WaveScore.WORSTCASESCENARIO },
      { range: [18.9, 23.6], score: WaveScore.WORK },
      { range: [23.6, 30.9], score: WaveScore.GOOD },
      { range: [30.9, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 44.1], score: WaveScore.GOOD },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 61.8], score: WaveScore.WORSTCASESCENARIO }, // we can use the candles to see the close and check if was a wick test of a close.
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
      { range: [88.6, 138.2], score: WaveScore.WORK },
      { range: [138.2, 261.8], score: WaveScore.WORK },
      { range: [261.8, 861.8], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
