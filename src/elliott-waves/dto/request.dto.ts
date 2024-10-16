import { ApiProperty } from '@nestjs/swagger';
import { CandleDto, PivotDto } from 'src/search/dto';
import { Pivot } from '../class';
import { WaveDegree } from '../enums';
import { Candle } from '../types';

export class BaseRequest {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  candles: CandleDto[] | Candle[];
}

export class WaveCountClusterRequest extends BaseRequest {
  @ApiProperty()
  degree: WaveDegree;

  @ApiProperty()
  subCounts: number;

  @ApiProperty()
  definition: number;
}

export class SubWaveCountClusterRequest extends BaseRequest {
  @ApiProperty()
  degree: WaveDegree;

  @ApiProperty()
  startIndex: number;

  @ApiProperty()
  endIndex: number | undefined;
}

export class WaveInfoRequest {
  @ApiProperty()
  candles: CandleDto[] | Candle[];

  @ApiProperty()
  pivots: PivotDto[] | Pivot[];

  @ApiProperty()
  degree: WaveDegree;
}

export class PivotsInfoRequest {
  @ApiProperty()
  candles: CandleDto[] | Candle[];

  @ApiProperty()
  clearTrend: boolean;

  @ApiProperty()
  complete: boolean;

  @ApiProperty()
  timed: boolean;

  @ApiProperty()
  retracement: number;
}
