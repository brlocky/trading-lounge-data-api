import { Wave } from '../class';
import { mapScoreToWaveScore, reverseTrend, Trend, WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveContractingDiagonal extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_CONTRACTING_DIAGONAL);
  }

  public allowWave4Overlap(): boolean {
    return true;
  }

  public validateChannel(waves: [Wave, Wave, Wave, Wave, Wave], useLogScale: boolean): WaveScore {
    const [w1, w2, w3, w4, w5] = waves;
    const { base, temporary, final } = this.channelService.createChannels(waves, useLogScale);
    const trend = w1.trend();
    const isUpTrend = trend === Trend.UP;

    const wave3BreakOut = this.channelService.isBeyondLine(w3.pEnd, isUpTrend ? base.upperLine : base.lowerLine, trend, useLogScale);
    const wave3BreakOutMiddle = this.channelService.isBeyondLine(w3.pEnd, base.middleLine, trend, useLogScale);
    if (!wave3BreakOut && !wave3BreakOutMiddle) return WaveScore.INVALID;

    const wave4BreakTemporaryBottom = this.channelService.isBeyondLine(
      w4.pEnd,
      isUpTrend ? temporary.lowerLine : temporary.upperLine,
      reverseTrend(trend),
      useLogScale,
    );
    const wave4BreakTemporaryMiddle = this.channelService.isBeyondLine(
      w4.pEnd,
      isUpTrend ? temporary.middleLine : temporary.middleLine,
      reverseTrend(trend),
      useLogScale,
    );
    const wave5InisideTemporaryChannel = this.channelService.isBeyondLine(
      w5.pEnd,
      isUpTrend ? temporary.lowerLine : temporary.upperLine,
      trend,
      useLogScale,
    );

    const wave5InsideFinalChannel = this.channelService.isBeyondLine(
      w5.pEnd,
      isUpTrend ? final.lowerLine : final.upperLine,
      trend,
      useLogScale,
    );

    const wave5BrealTopFinalChannel = this.channelService.isBeyondLine(
      w5.pEnd,
      isUpTrend ? final.upperLine : final.lowerLine,
      trend,
      useLogScale,
    );

    let score = 0;
    if (wave3BreakOut || wave3BreakOutMiddle) score += 1;
    if (wave4BreakTemporaryBottom) score += 1;
    if (wave4BreakTemporaryMiddle) score += 1;
    if (wave5InisideTemporaryChannel) score += 1;
    if (wave5InsideFinalChannel) score += 1;
    if (wave5BrealTopFinalChannel) score += 1;

    return mapScoreToWaveScore(score);
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
      { range: [38.2, 50], score: WaveScore.WORK },
      { range: [50, 55.9], score: WaveScore.GOOD },
      { range: [55.9, 61.8], score: WaveScore.PERFECT },
      { range: [61.8, 70.2], score: WaveScore.PERFECT },
      { range: [70.2, 78.6], score: WaveScore.GOOD },
      { range: [78.6, 88.6], score: WaveScore.WORK },
      { range: [88.6, 99.9], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [50, 78.6], score: WaveScore.WORSTCASESCENARIO },
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
      { range: [83.6, 94.3], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [38.2, 50], score: WaveScore.WORSTCASESCENARIO },
      { range: [50, 78.6], score: WaveScore.PERFECT },
      { range: [78.6, 90], score: WaveScore.GOOD },
      { range: [90, 99], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
