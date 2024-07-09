import { ApiProperty } from '@nestjs/swagger';
import { Degree } from '../enums';
import { Pivot, ClusterPivot } from '../types';

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

  @ApiProperty()
  children: WaveResponse[];

  constructor(id: string, wave: EnumStruct, degree: EnumStruct, pStart: PivotResponse, pEnd: PivotResponse, children: WaveResponse[]) {
    this.id = id;
    this.wave = wave;
    this.degree = degree;
    this.pStart = pStart;
    this.pEnd = pEnd;
    this.children = children;
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
