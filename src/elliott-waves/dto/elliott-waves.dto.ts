import { ApiProperty } from '@nestjs/swagger';
import { CandleDto } from 'src/search/dto';
import { Degree } from '../enums';
import { ClusterPivot, Pivot } from '../types';

export class BaseRequest {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  interval: 'M' | 'W' | 'D';

  @ApiProperty()
  degree: number;

  @ApiProperty()
  logScale: boolean;
}

export class WaveCountClusterRequest extends BaseRequest {
  @ApiProperty()
  candles: CandleDto[];

  @ApiProperty()
  subCounts: number;

  @ApiProperty()
  definition: number;
}

export class SubWaveCountClusterRequest extends BaseRequest {
  @ApiProperty()
  candles: CandleDto[];

  @ApiProperty()
  startPivot: Pivot;

  @ApiProperty()
  endPivot: Pivot;
}

export class EnumStruct {
  @ApiProperty()
  title: string;

  @ApiProperty()
  value: number;
}

export class WaveClusterResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  degree: EnumStruct;

  @ApiProperty()
  waveType: EnumStruct;

  @ApiProperty()
  waves: WaveResponse[];

  constructor(id: string, degree: EnumStruct, waveType: EnumStruct, waves: WaveResponse[]) {
    this.id = id;
    this.degree = degree;
    this.waveType = waveType;
    this.waves = waves;
  }
}

export class PivotResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  degree: Degree;

  @ApiProperty()
  time: number;

  @ApiProperty()
  status: string;

  constructor(pivot: Pivot | ClusterPivot, degree: Degree) {
    this.id = pivot.id;
    this.type = pivot.type;
    this.price = pivot.price;
    this.degree = degree;
    this.time = pivot.time;
    this.status = (pivot as ClusterPivot)?.status || 'WAITING';
  }
}

export class WaveResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  wave: EnumStruct;

  @ApiProperty()
  degree: EnumStruct;

  @ApiProperty()
  pStart: PivotResponse;

  @ApiProperty()
  pEnd: PivotResponse;

  constructor(id: string, wave: EnumStruct, degree: EnumStruct, pStart: PivotResponse, pEnd: PivotResponse) {
    this.id = id;
    this.wave = wave;
    this.degree = degree;
    this.pStart = pStart;
    this.pEnd = pEnd;
  }
}

export class WaveCountClusterResponse {
  @ApiProperty()
  clusters: WaveClusterResponse[];
}

export function mapEnumToStruct(title: string, value: number): EnumStruct {
  return {
    title,
    value,
  };
}
