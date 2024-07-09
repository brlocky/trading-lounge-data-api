import { WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExtended3 extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXTENDED_3);
  }

  public allowWave1Break(): boolean {
    return false;
  }

  public getWave2TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORK },
      { range: [38.2, 300], score: WaveScore.PERFECT },
      { range: [300, 400], score: WaveScore.WORK },
      { range: [400, 600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 68.1], score: WaveScore.WORK },
      { range: [68.1, 100], score: WaveScore.WORK },
      { range: [100, 168.1], score: WaveScore.PERFECT },
      { range: [168.1, 250], score: WaveScore.GOOD },
      { range: [250, 350], score: WaveScore.WORK },
      { range: [350, 800], score: WaveScore.WORSTCASESCENARIO },
      { range: [800, 1000], score: WaveScore.INVALID },
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
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.WORK },
      { range: [61.8, 168.1], score: WaveScore.PERFECT },
      { range: [168.1, 200], score: WaveScore.WORK },
      { range: [200, 300], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [0, 14.2], score: WaveScore.INVALID },
      { range: [14.2, 23.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [23.6, 50], score: WaveScore.WORK },
      { range: [50, 55.9], score: WaveScore.PERFECT },
      { range: [55.9, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 70.2], score: WaveScore.PERFECT },
      { range: [70.2, 78.6], score: WaveScore.GOOD },
      { range: [78.6, 83.6], score: WaveScore.WORK },
      { range: [83.6, 88.6], score: WaveScore.WORK },
      { range: [88.6, 100], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [100, 110], score: WaveScore.WORSTCASESCENARIO },
      { range: [110, 138.2], score: WaveScore.WORK },
      { range: [138.2, 160], score: WaveScore.GOOD },
      { range: [160, 268.1], score: WaveScore.PERFECT },
      { range: [268.1, 468.1], score: WaveScore.WORK },
      { range: [468.1, 600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4RetracementConfig(): ScoreRange[] {
    return [
      { range: [7.1, 14.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [14.2, 18.9], score: WaveScore.WORSTCASESCENARIO },
      { range: [18.9, 23.6], score: WaveScore.WORK },
      { range: [23.6, 30.9], score: WaveScore.GOOD },
      { range: [30.9, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 44.1], score: WaveScore.GOOD },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 61.8], score: WaveScore.WORSTCASESCENARIO },
      { range: [61.8, 88.6], score: WaveScore.WORSTCASESCENARIO }, // need to add alternation
    ];
  }

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [50, 68.1], score: WaveScore.WORSTCASESCENARIO },
      { range: [68.1, 100], score: WaveScore.PERFECT },
      { range: [100, 168.1], score: WaveScore.WORK },
      { range: [168.1, 468.1], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
