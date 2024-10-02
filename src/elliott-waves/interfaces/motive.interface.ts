import { Wave } from '../class';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { WaveScore, WaveType } from '../enums';
import { ChannelValidationService } from '../services';
import { ScoreRange, WaveConfig } from '../types';

export abstract class MotiveInterface {
  protected waveType: WaveType;
  protected fibonacci: Fibonacci;
  protected channelService: ChannelValidationService;
  constructor(waveType: WaveType) {
    this.waveType = waveType;
    this.fibonacci = new Fibonacci();
    this.channelService = new ChannelValidationService();
  }

  // Configuration methods
  protected abstract getWave2TimeConfig(): ScoreRange[];
  protected abstract getWave3TimeConfig(): ScoreRange[];
  protected abstract getWave4TimeConfig(): ScoreRange[];
  protected abstract getWave5TimeConfig(): ScoreRange[];
  protected abstract getWave2RetracementConfig(): ScoreRange[];
  protected abstract getWave3ProjectionConfig(): ScoreRange[];
  protected abstract getWave4RetracementConfig(): ScoreRange[];
  protected abstract getWave5ProjectionConfig(): ScoreRange[];
  public abstract validateChannel(waves: Wave[], useLogScale: boolean): WaveScore;
  public abstract allowWave4Overlap(): boolean;

  public abstract calculateWave5Projection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): number;
  public abstract calculateWave5ProjectionTime(
    wave1: Wave,
    wave2: Wave,
    wave3: Wave,
    wave4: Wave,
    wave5: Wave,
    commonInterval: number,
  ): number;
  public abstract validateWaveStructure(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): boolean;

  public getWaveType(): WaveType {
    return this.waveType;
  }

  public getWave4DeepRetracementConfig(): ScoreRange[] {
    return this.getWave4RetracementConfig();
  }

  public getWave4LongTimeConfig(): ScoreRange[] {
    return this.getWave4TimeConfig();
  }

  public calculateTimeRetracement(waveA: Wave, waveB: Wave, commonInterval: number): number {
    const waveATime = waveA.duration() || commonInterval * 24 * 3600;
    const waveBTime = waveB.duration() || commonInterval * 24 * 3600;
    return Math.abs(waveBTime / waveATime) * 100;
  }

  public calculateWave2Retracement(wave1: Wave, wave2: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getRetracementPercentage(wave1.pStart.price, wave1.pEnd.price, wave2.pEnd.price);
  }

  public calculateWave3Projection(wave1: Wave, wave2: Wave, wave3: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getProjectionPercentage(wave1.pStart.price, wave1.pEnd.price, wave2.pEnd.price, wave3.pEnd.price);
  }

  public calculateWave4Retracement(wave3: Wave, wave4: Wave, useLogScale: boolean): number {
    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getRetracementPercentage(wave3.pStart.price, wave3.pEnd.price, wave4.pEnd.price);
  }

  public validateWave2Retracement(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave2RetracementConfig());
  }

  public validateWave3Projection(projection: number): WaveScore {
    return this.getScore(projection, this.getWave3ProjectionConfig());
  }

  public validateWave4Retracement(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave4RetracementConfig());
  }

  public validateWave4DeepRetracement(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave4DeepRetracementConfig());
  }

  public validateWave5Projection(projection: number): WaveScore {
    return this.getScore(projection, this.getWave5ProjectionConfig());
  }

  public validateWave2Time(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave2TimeConfig());
  }

  public validateWave3Time(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave3TimeConfig());
  }

  public validateWave4Time(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave4TimeConfig());
  }

  public validateWave4DeepTime(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave4LongTimeConfig());
  }

  public validateWave5Time(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave5TimeConfig());
  }

  protected getScore(value: number, config: ScoreRange[]): WaveScore {
    const range = config.find((r) => value >= r.range[0] && value <= r.range[1]);
    return range ? range.score : WaveScore.INVALID;
  }

  public getDefaultRetracementRange(): ScoreRange[] {
    return [
      { range: [14.2, 23.6], score: WaveScore.INVALID },
      { range: [23.6, 38.2], score: WaveScore.INVALID },
      { range: [38.2, 50], score: WaveScore.INVALID },
      { range: [50, 61.8], score: WaveScore.INVALID },
      { range: [61.8, 78.6], score: WaveScore.INVALID },
      { range: [78.6, 88.6], score: WaveScore.INVALID },
      { range: [88.6, 100], score: WaveScore.INVALID },
    ];
  }

  public getDefaultProjectionRange(): ScoreRange[] {
    return [
      { range: [50, 61.8], score: WaveScore.INVALID },
      { range: [61.8, 78.6], score: WaveScore.INVALID },
      { range: [78.6, 88.6], score: WaveScore.INVALID },
      { range: [88.6, 123], score: WaveScore.INVALID },
      { range: [123.6, 138.2], score: WaveScore.INVALID },
      { range: [138.2, 161.8], score: WaveScore.INVALID },
      { range: [161.8, 261.8], score: WaveScore.INVALID },
    ];
  }

  public getDefaultTimeRange(): ScoreRange[] {
    return [
      { range: [0, 5], score: WaveScore.INVALID },
      { range: [5, 38.2], score: WaveScore.INVALID },
      { range: [38.2, 61.8], score: WaveScore.INVALID },
      { range: [61.8, 100], score: WaveScore.INVALID },
      { range: [100, 200], score: WaveScore.INVALID },
      { range: [200, 300], score: WaveScore.INVALID },
    ];
  }

  public getWaveConfig(): WaveConfig {
    return {
      waveType: this.waveType,
      allowWave4Break: this.allowWave4Overlap(),
      wave2: {
        time: this.getWave2TimeConfig(),
        retracement: this.getWave2RetracementConfig(),
      },
      wave3: {
        time: this.getWave3TimeConfig(),
        projection: this.getWave3ProjectionConfig(),
      },
      wave4: {
        time: this.getWave4TimeConfig(),
        retracement: this.getWave4RetracementConfig(),
        deepRetracement: this.getWave4DeepRetracementConfig(),
      },
      wave5: {
        time: this.getWave5TimeConfig(),
        projection: this.getWave5ProjectionConfig(),
      },
    };
  }
}
