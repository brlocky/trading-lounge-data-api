import { ApiProperty } from '@nestjs/swagger';
import { CandleDto } from 'src/dto';
import { Degree, degreeToString, waveNameToString, waveTypeToString } from './enums';
import { ClusterPivot, ClusterWaves, Pivot, Wave } from './types';

export class EnumStruct {
  @ApiProperty()
  title: string;
  @ApiProperty()
  value: number;
}

export function mapEnumToStruct(title: string, value: number): EnumStruct {
  return {
    title,
    value,
  };
}

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

export class WaveCounClustertRequest extends BaseRequest {
  @ApiProperty()
  candles: CandleDto[];
  @ApiProperty()
  subCounts: number;
  @ApiProperty()
  definition: number;
}

export class PivotResponse {
  constructor(pivot: Pivot | ClusterPivot, degree: Degree) {
    this.id = pivot.id;
    this.type = pivot.type;
    this.price = pivot.price;
    this.degree = degree;
    this.time = pivot.time;
    this.status = (pivot as ClusterPivot)?.status || 'WAITING';
  }

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
}

export class SubWaveCounClustertRequest extends BaseRequest {
  @ApiProperty()
  candles: CandleDto[];
  @ApiProperty()
  startPivot: Pivot;
  @ApiProperty()
  endPivot: Pivot;
}

export class WaveClusterResponse {
  constructor(cluster: ClusterWaves) {
    this.id = cluster.id;
    this.degree = mapEnumToStruct(degreeToString(cluster.degree), cluster.degree);
    this.waveType = mapEnumToStruct(waveTypeToString(cluster.waveType), cluster.waveType);
    this.waves = cluster.waves.map((w) => new WaveResponse(w));
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  degree: EnumStruct;
  @ApiProperty()
  waveType: EnumStruct;
  @ApiProperty()
  waves: WaveResponse[];
}

export class WaveResponse {
  constructor(wave: Wave) {
    this.id = wave.id;
    this.wave = mapEnumToStruct(waveNameToString(wave.wave), wave.wave);
    this.degree = mapEnumToStruct(degreeToString(wave.degree), wave.degree);
    this.pStart = new PivotResponse(wave.pStart, wave.degree);
    this.pEnd = new PivotResponse(wave.pEnd, wave.degree);
  }

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
}

export class WaveCountClusterResponse {
  @ApiProperty()
  clusters: WaveClusterResponse[];
}
