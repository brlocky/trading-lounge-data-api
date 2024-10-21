import { Wave } from '../class';
import { mapScoreToWaveScore, reverseTrend, Trend, WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { ScoreRange } from '../types';

export class MotiveExtended3 extends MotiveInterface {
  constructor() {
    super(WaveType.MOTIVE_EXTENDED_3);
  }

  public allowWave4Overlap(): boolean {
    return false;
  }

  public validateChannel(waves: [Wave, Wave, Wave, Wave, Wave], useLogScale: boolean): WaveScore {
    const [w1, w2, w3, w4, w5] = waves;
    const { base, temporary, final } = this.channelService.createChannels(waves, useLogScale);
    const trend = w1.trend();
    const isUpTrend = trend === Trend.UP;

    const wave3BreakOut = this.channelService.isBeyondLine(w3.pEnd, isUpTrend ? base.lowerLine : base.upperLine, trend, useLogScale);
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

  calculateWave5Projection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getProjectionPercentage(wave1.pStart.price, wave1.pEnd.price, wave4.pEnd.price, wave5.pEnd.price);
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
    return this.calculateLengthRetracement(wave1, wave5, commonInterval, useLogScale);
  }

  public validateWaveStructure(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): boolean {
    // Wave 3 is bigger
    /*     const wave3isBigger = wave3.length(useLogScale) >= wave1.length(useLogScale) && wave3.length(useLogScale) >= wave5.length(useLogScale);
    if (!wave3isBigger) return false;
 */
    // Wave 3 is not the sortest
    const wave3IsNotTheShortest =
      wave3.length(useLogScale) >= wave1.length(useLogScale) || wave3.length(useLogScale) >= wave5.length(useLogScale);
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
      /*       { range: [1, 5], score: WaveScore.WORSTCASESCENARIO },
      { range: [5, 10], score: WaveScore.WORK }, */
      { range: [10, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 300], score: WaveScore.PERFECT },
      { range: [300, 400], score: WaveScore.WORK },
      { range: [400, 10000], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3TimeConfig(): ScoreRange[] {
    return [
      { range: [23.6, 38.2], score: WaveScore.WORSTCASESCENARIO },
      { range: [38.2, 100], score: WaveScore.WORK },
      { range: [100, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 350], score: WaveScore.GOOD },
      { range: [350, 800], score: WaveScore.WORK },
      { range: [800, 10000], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4TimeConfig(): ScoreRange[] {
    return [
      { range: [0, 30], score: WaveScore.INVALID },
      { range: [30, 100], score: WaveScore.WORK },
      { range: [100, 125], score: WaveScore.GOOD },
      { range: [125, 250], score: WaveScore.PERFECT },
      { range: [250, 300], score: WaveScore.GOOD },
      { range: [300, 500], score: WaveScore.WORK },
      { range: [500, 600], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4LongTimeConfig(): ScoreRange[] {
    return [
      { range: [0, 5], score: WaveScore.INVALID },
      { range: [5, 100], score: WaveScore.WORK },
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
      { range: [61.8, 161.8], score: WaveScore.PERFECT },
      { range: [161.8, 200], score: WaveScore.WORK },
      { range: [200, 1000], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave2RetracementConfig(): ScoreRange[] {
    return [
      { range: [10, 23.6], score: WaveScore.WORSTCASESCENARIO },
      { range: [23.6, 50], score: WaveScore.WORK },
      { range: [50, 78.6], score: WaveScore.PERFECT },
      { range: [78.6, 88], score: WaveScore.WORK },
      { range: [88, 99.9], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave3ProjectionConfig(): ScoreRange[] {
    return [
      { range: [100, 110], score: WaveScore.WORSTCASESCENARIO },
      { range: [110, 138.2], score: WaveScore.WORK },
      { range: [138.2, 160], score: WaveScore.GOOD },
      { range: [160, 368.1], score: WaveScore.PERFECT },
      { range: [368.1, 468.1], score: WaveScore.WORK },
      { range: [468.1, 861.8], score: WaveScore.WORSTCASESCENARIO },
    ];
  }

  public getWave4RetracementConfig(): ScoreRange[] {
    return [
      { range: [10, 18.9], score: WaveScore.WORSTCASESCENARIO },
      { range: [18.9, 23.6], score: WaveScore.WORK },
      { range: [23.6, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 42], score: WaveScore.GOOD },
      { range: [42, 50], score: WaveScore.WORK },
      { range: [50, 61.8], score: WaveScore.WORSTCASESCENARIO }, // we can use the candles to see the close and check if was a wick test of a close.
    ];
  }

  public getWave4DeepRetracementConfig(): ScoreRange[] {
    return [
      { range: [10, 18.9], score: WaveScore.WORSTCASESCENARIO },
      { range: [18.9, 23.6], score: WaveScore.WORK },
      { range: [23.6, 38.2], score: WaveScore.PERFECT },
      { range: [38.2, 42], score: WaveScore.PERFECT },
      { range: [42, 50], score: WaveScore.WORK },
      { range: [50, 61.8], score: WaveScore.WORSTCASESCENARIO }, // we can use the candles to see the close and check if was a wick test of a close.
    ];
  }

  public getWave5ProjectionConfig(): ScoreRange[] {
    return [
      { range: [0.236, 38.2], score: WaveScore.GOOD },
      { range: [38.2, 50], score: WaveScore.PERFECT },
      { range: [50, 78.6], score: WaveScore.GOOD },
      { range: [78.6, 300], score: WaveScore.WORSTCASESCENARIO },
    ];
  }
}
