import { ApiProperty } from '@nestjs/swagger';

export class GetCandlesDto {
  @ApiProperty()
  symbol: string;
  @ApiProperty()
  interval: string;
  @ApiProperty()
  from?: string;
  @ApiProperty()
  to?: string;
}

export class CandlePointer {
  @ApiProperty()
  symbol: string;
  @ApiProperty()
  interval: string;
  @ApiProperty()
  time: string;
}

export class GetCandlesResultDto {
  @ApiProperty()
  symbol: string;
  @ApiProperty()
  interval: string;
  @ApiProperty()
  candles: CandleDto[];
  @ApiProperty()
  prevCandle: CandlePointer | null;
  @ApiProperty()
  nextCandle: CandlePointer | null;
}

export class CandleDto {
  @ApiProperty()
  time: number;
  @ApiProperty()
  open: string;
  @ApiProperty()
  high: string;
  @ApiProperty()
  low: string;
  @ApiProperty()
  close: string;
  @ApiProperty()
  volume: string;
}
