import { ApiProperty } from '@nestjs/swagger';
import { WaveType, Degree, PivotType, WaveName, WaveScore } from './enums';
import { v4 } from 'uuid';

export interface ScoreRange {
  range: [number, number];
  score: WaveScore;
}

export interface ScoreRangeValue {
  value: number;
  score: number;
}

export interface WaveInfoResult {
  time?: ScoreRangeValue | undefined;
  retracement?: ScoreRangeValue | undefined;
  projection?: ScoreRangeValue | undefined;
}

export interface WaveInfo {
  waveType: WaveType;
  score: {
    wave: number;
    time: number;
  };
  isValid: {
    wave: boolean;
    time: boolean;
  };
  wave2: WaveInfoResult;
  wave3: WaveInfoResult;
  wave4: WaveInfoResult;
  wave5: WaveInfoResult;
}

export interface WaveConfigResult {
  time?: ScoreRange[];
  retracement?: ScoreRange[];
  projection?: ScoreRange[];
}

export interface WaveConfig {
  waveType: WaveType;
  allowWave4Break: boolean;
  projectWave5WithWave1: boolean;
  projectWave5WithWave3: boolean;
  projectWave5FromWave1: boolean;
  projectWave5FromWave4: boolean;
  wave2: WaveConfigResult;
  wave3: WaveConfigResult;
  wave4: WaveConfigResult;
  wave5: WaveConfigResult;
}

export interface WavesConfig {
  base: {
    retracements: ScoreRange[];
    projections: ScoreRange[];
    time: ScoreRange[];
  };
  waveConfigs: WaveConfig[];
}

// TODO MOVE TO CLASSES
export class ClusterWaves {
  constructor(waves: Wave[] = [], waveType: WaveType = WaveType.UNKNOWN, degree: Degree = Degree.SUPERMILLENNIUM) {
    this.id = v4();
    this.degree = degree;
    this.waveType = waveType;
    this.waves = waves;
  }

  public addWave(wave: Wave): void {
    this.waves.push(wave);
  }

  public duplicate(): ClusterWaves {
    return new ClusterWaves([...this.waves], this.waveType, this.degree);
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  degree: Degree;
  @ApiProperty()
  waveType: WaveType;
  @ApiProperty()
  waves: Wave[];
}

export type PivotStatus = 'CONFIRMED' | 'WAITING' | 'PROJECTED';

export interface CandlesInfo {
  degree: {
    title: string;
    value: number;
  };
  pivots: Pivot[];
  retracements: Pivot[];
}

export class Pivot {
  constructor(candleIndex: number, type: PivotType, price: number, time: number) {
    this.id = v4();
    this.candleIndex = candleIndex;
    this.type = type;
    this.price = price;
    this.time = time;
  }

  public copy(): Pivot {
    const copyPivot = new Pivot(this.candleIndex, this.type, this.price, this.time);
    copyPivot.id = this.id;
    return copyPivot;
  }

  public isHigh(): boolean {
    return this.type === PivotType.HIGH;
  }

  public isLow(): boolean {
    return this.type === PivotType.LOW;
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  candleIndex: number;
  @ApiProperty()
  type: PivotType;
  @ApiProperty()
  price: number;
  @ApiProperty()
  time: number;
}

export class ClusterPivot extends Pivot {
  constructor(pivot: Pivot, status: PivotStatus) {
    super(pivot.candleIndex, pivot.type, pivot.price, pivot.time);
    this.id = pivot.id;
    this.status = status;
  }

  @ApiProperty()
  status: PivotStatus;

  confirmPivot(): void {
    this.status = 'CONFIRMED';
  }
}

export interface PivotSearchResult {
  pivot: Pivot | null;
  type: 'FOUND-WITH-BREAK' | 'FOUND-NO-BREAK' | 'NOT-FOUND';
}

export class Wave {
  constructor(wave: WaveName, degree: Degree, pStart: Pivot | ClusterPivot, pEnd: Pivot | ClusterPivot) {
    this.id = v4();
    this.wave = wave;
    this.degree = degree;
    this.pStart = this.ensureClusterPivot(pStart);
    this.pEnd = this.ensureClusterPivot(pEnd);
    this.children = [];
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  wave: WaveName;
  @ApiProperty()
  degree: Degree;
  @ApiProperty()
  pStart: ClusterPivot;
  @ApiProperty()
  pEnd: ClusterPivot;
  @ApiProperty()
  children: Wave[];

  public copy(): Wave {
    return new Wave(this.wave, this.degree, this.pStart, this.pEnd);
  }

  public addChidren(wave: Wave) {
    this.children.push(wave);
  }

  public setChidren(waves: Wave[]) {
    this.children = waves;
  }

  public length(useLogScale: boolean): number {
    return useLogScale ? Math.abs(Math.log(this.pEnd.price) - Math.log(this.pStart.price)) : Math.abs(this.pEnd.price - this.pStart.price);
  }

  public duration(): number {
    return this.pEnd.time - this.pStart.time;
  }

  private ensureClusterPivot(pivot: Pivot | ClusterPivot): ClusterPivot {
    if (this.isClusterPivot(pivot)) {
      return pivot;
    } else {
      return new ClusterPivot(pivot, 'CONFIRMED');
    }
  }

  private isClusterPivot(pivot: Pivot | ClusterPivot): pivot is ClusterPivot {
    return (pivot as ClusterPivot).status !== undefined;
  }
}
