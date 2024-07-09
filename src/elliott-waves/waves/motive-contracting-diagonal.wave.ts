import { WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveContractingDiagonal extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_CONTRACTING_DIAGONAL);
  }

  public allowWave1Break(): boolean {
    return true;
  }

  public projectWave5WithWave1(): boolean {
    return false;
  }

  public getWave2TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 99], score: WaveScore.PERFECT },
      { range: [99, 168.1], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 90], score: WaveScore.PERFECT },
      { range: [90, 168.1], score: WaveScore.WORSTCASESCENARIO },
      { range: [168.1, 200], score: WaveScore.INVALID },
    ];
  }

  public getWave4TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 90], score: WaveScore.PERFECT },
      { range: [90, 168.1], score: WaveScore.WORSTCASESCENARIO },
      { range: [168.1, 200], score: WaveScore.INVALID },
    ];
  }

  public getWave5TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 61.8], score: WaveScore.GOOD },
      { range: [61.8, 90], score: WaveScore.PERFECT },
      { range: [90, 168.1], score: WaveScore.WORSTCASESCENARIO },
      { range: [168.1, 200], score: WaveScore.INVALID },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [0, 7.1], score: WaveScore.INVALID },
      { range: [7.1, 14.2], score: WaveScore.INVALID },
      { range: [14.2, 18.9], score: WaveScore.INVALID },
      { range: [18.9, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 30.9], score: WaveScore.INVALID },
      { range: [30.9, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 44.1], score: WaveScore.WORK },
      { range: [44.1, 50], score: WaveScore.WORK },
      { range: [50, 55.9], score: WaveScore.GOOD },
      { range: [55.9, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 70.2], score: WaveScore.PERFECT },
      { range: [70.2, 78.6], score: WaveScore.GOOD },
      { range: [78.6, 83.6], score: WaveScore.WORK },
      { range: [83.6, 88.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [88.6, 94.3], score: WaveScore.WORSTCASESCENARIO },
      { range: [94.3, 100], score: WaveScore.INVALID },
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
