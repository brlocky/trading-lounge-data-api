import { WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExtended1 extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXTENDED_1);
  }

  public allowWave1Break(): boolean {
    return false;
  }

  public projectWave5WithWave1(): boolean {
    return true;
  }

  public projectWave5FromWave1(): boolean {
    return true;
  }

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
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 100], score: WaveScore.WORK },
      { range: [100, 125], score: WaveScore.GOOD },
      { range: [125, 250], score: WaveScore.PERFECT },
      { range: [250, 300], score: WaveScore.GOOD },
      { range: [300, 500], score: WaveScore.WORK },
      { range: [500, 600], score: WaveScore.WORSTCASESCENARIO },
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
      { range: [38.2, 45], score: WaveScore.GOOD },
      { range: [45, 61.8], score: WaveScore.WORK },
      { range: [61.8, 70], score: WaveScore.WORSTCASESCENARIO },
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

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [10, 14.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [14.2, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 80], score: WaveScore.WORK },
      { range: [80, 99.9], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
