import { Fibonacci } from '../class/utils/fibonacci.class';
import { WaveScore, WaveType } from '../enums';
import { Pivot, ScoreRange, Wave, WaveConfig } from '../types';

export abstract class MotiveInterface {
  protected waveType: WaveType;
  protected fibonacci: Fibonacci;
  constructor(waveType: WaveType) {
    this.waveType = waveType;
    this.fibonacci = new Fibonacci();

    if (!this.configCheck()) {
      throw new Error(`Warning configuration Error on ${this.waveType}`);
    }
  }

  configCheck() {
    if (!this.projectWave5WithWave1() && !this.projectWave5WithWave3()) {
      return false;
    }

    if (!this.projectWave5FromWave1 && !this.projectWave5FromWave4) {
      return false;
    }

    return true;
  }

  protected abstract getWave2TimeConfig(): ScoreRange[];
  protected abstract getWave3TimeConfig(): ScoreRange[];
  protected abstract getWave4TimeConfig(): ScoreRange[];
  protected abstract getWave5TimeConfig(): ScoreRange[];

  protected abstract getWave2RetracementConfig(): ScoreRange[];
  protected abstract getWave3ProjectionConfig(): ScoreRange[];
  protected abstract getWave4RetracementConfig(): ScoreRange[];
  protected abstract getWave4RetracementConfig(): ScoreRange[];
  protected abstract getWave5ProjectionConfig(): ScoreRange[];

  public abstract allowWave1Break(): boolean;

  public projectWave5WithWave1(): boolean {
    return false;
  }

  public projectWave5WithWave3(): boolean {
    return false;
  }

  public projectWave5FromWave1(): boolean {
    return false;
  }

  public projectWave5FromWave4(): boolean {
    return false;
  }

  public getWaveType(): WaveType {
    return this.waveType;
  }

  public getWave5PercentageProjection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, useLogScale: boolean): number {
    let p1: Pivot | null = null;
    let p2: Pivot | null = null;

    if (this.projectWave5WithWave1() && this.projectWave5WithWave3()) {
      p1 = wave1.pStart;
      p2 = wave1.pEnd;
    } else if (this.projectWave5WithWave1()) {
      p1 = wave1.pStart;
      p2 = wave1.pEnd;
    } else {
      p1 = wave3.pStart;
      p2 = wave3.pEnd;
    }

    const projectFrom = this.projectWave5FromWave4() ? { p4: wave4.pEnd } : { p4: wave2.pEnd };

    this.fibonacci.setLogScale(useLogScale);
    return this.fibonacci.getProjectionPercentage(p1.price, p2.price, projectFrom.p4.price, wave5.pEnd.price);
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

  public validateWave5Time(retracement: number): WaveScore {
    return this.getScore(retracement, this.getWave5TimeConfig());
  }

  protected getScore(value: number, config: ScoreRange[]): WaveScore {
    const range = config.find((r) => value >= r.range[0] && value < r.range[1]);
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
      { range: [30.9, 38.2], score: WaveScore.INVALID },
      { range: [38.2, 50], score: WaveScore.INVALID },
      { range: [50, 61.8], score: WaveScore.INVALID },
      { range: [61.8, 78.6], score: WaveScore.INVALID },
      { range: [78.6, 88.6], score: WaveScore.INVALID },
      { range: [88.6, 123], score: WaveScore.INVALID },
      { range: [123.6, 138.2], score: WaveScore.INVALID },
      { range: [138.2, 161.8], score: WaveScore.INVALID },
      { range: [200, 261.8], score: WaveScore.INVALID },
      { range: [300, 361.8], score: WaveScore.INVALID },
      { range: [400, 461.8], score: WaveScore.INVALID },
    ];
  }

  public getDefaultTimeRange(): ScoreRange[] {
    return [
      { range: [38.2, 61.8], score: WaveScore.INVALID },
      { range: [61.8, 100], score: WaveScore.INVALID },
      { range: [100, 168.1], score: WaveScore.INVALID },
      { range: [168.1, 200], score: WaveScore.INVALID },
      { range: [200, 300], score: WaveScore.INVALID },
      { range: [300, 500], score: WaveScore.INVALID },
      { range: [500, 600], score: WaveScore.INVALID },
    ];
  }

  public getWaveConfig(): WaveConfig {
    return {
      waveType: this.waveType,
      allowWave4Break: this.allowWave1Break(),
      projectWave5WithWave1: this.projectWave5WithWave1(),
      projectWave5FromWave4: this.projectWave5FromWave4(),
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
      },
      wave5: {
        time: this.getWave5TimeConfig(),
        projection: this.getWave5ProjectionConfig(),
      },
    };
  }
}
