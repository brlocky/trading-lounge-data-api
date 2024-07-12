import { ApiProperty } from '@nestjs/swagger';
import { CandleDto } from 'src/search/dto';
import { Pivot } from '../class';

export class BaseRequest {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  interval: 'M' | 'W' | 'D';

  @ApiProperty()
  logScale: boolean;
}

export class WaveCountClusterRequest extends BaseRequest {
  @ApiProperty()
  degree: number;

  @ApiProperty()
  candles: CandleDto[];

  @ApiProperty()
  subCounts: number;

  @ApiProperty()
  definition: number;
}

export class SubWaveCountClusterRequest extends BaseRequest {
  @ApiProperty()
  degree: number;

  @ApiProperty()
  candles: CandleDto[];

  @ApiProperty()
  startPivot: Pivot;

  @ApiProperty()
  endPivot: Pivot;
}

export class WaveInfoRequest extends BaseRequest {
  @ApiProperty()
  pivots: Pivot[];
}
