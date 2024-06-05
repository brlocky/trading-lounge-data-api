import { ApiProperty } from '@nestjs/swagger';
import { WaveType, Degree, PivotType, WaveName } from './enums';

export class ClusterWaves {
  constructor(id: string, waves: Wave[], waveType: WaveType, degree: Degree) {
    this.id = id;
    this.degree = degree;
    this.waveType = waveType;
    this.waves = waves;
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
  constructor(id: string, candleIndex: number, type: PivotType, price: number, time: number) {
    this.id = id;
    this.candleIndex = candleIndex;
    this.type = type;
    this.price = price;
    this.time = time;
  }

  public copy(): Pivot {
    return new Pivot(this.id, this.candleIndex, this.type, this.price, this.time);
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
    super(pivot.id, pivot.candleIndex, pivot.type, pivot.price, pivot.time);
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
  constructor(id: string, wave: WaveName, degree: Degree, pStart: Pivot | ClusterPivot, pEnd: Pivot | ClusterPivot) {
    this.id = id;
    this.wave = wave;
    this.degree = degree;
    this.pStart = this.ensureClusterPivot(pStart);
    this.pEnd = this.ensureClusterPivot(pEnd);
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
