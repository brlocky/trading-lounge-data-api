import { ApiProperty } from '@nestjs/swagger';
import { CandleDto } from 'src/search/dto';
import { Pivot } from '../class';
import { WaveDegree } from '../enums';
import { Candle } from '../types';

export class BaseRequest {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  logScale: boolean;

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
  pivots: Pivot[];
}
