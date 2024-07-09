import { WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExpandingDiagonal extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXPANDING_DIAGONAL);
  }

  public allowWave1Break(): boolean {
    return true;
  }

  public projectWave5WithWave1(): boolean {
    return false;
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
      { range: [110, 168.1], score: WaveScore.PERFECT },
      { range: [168.1, 268.1], score: WaveScore.WORK },
      { range: [268.1, 800], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4TimeConfig(): ScoreRange[] {
    return [
      { range: [38.2, 99], score: WaveScore.WORSTCASESCENARIO },
      { range: [99, 100], score: WaveScore.WORK },
      { range: [100, 300], score: WaveScore.PERFECT },
      { range: [300, 600], score: WaveScore.WORK },
      { range: [600, 1000], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5TimeConfig(): ScoreRange[] {
    return [
      { range: [38.2, 88.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [88.6, 100], score: WaveScore.WORK },
      { range: [100, 168.1], score: WaveScore.PERFECT },
      { range: [168.1, 200], score: WaveScore.WORK },
      { range: [200, 250], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [38.2, 44.1], score: WaveScore.WORSTCASESCENARIO },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 88.6], score: WaveScore.PERFECT },
      { range: [88.6, 90], score: WaveScore.WORK },
      { range: [90, 94.3], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [90, 99], score: WaveScore.WORSTCASESCENARIO },
      { range: [99, 100], score: WaveScore.WORK },
      { range: [100, 138.1], score: WaveScore.PERFECT },
      { range: [138.1, 168.1], score: WaveScore.GOOD },
      { range: [168.1, 368.1], score: WaveScore.WORK },
      { range: [368.1, 468.1], score: WaveScore.WORSTCASESCENARIO },
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
      { range: [90, 99], score: WaveScore.WORSTCASESCENARIO },
      { range: [99, 100], score: WaveScore.WORK },
      { range: [100, 168.1], score: WaveScore.PERFECT },
      { range: [168.1, 268.1], score: WaveScore.WORK },
      { range: [268.1, 500], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
