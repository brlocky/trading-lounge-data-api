import { ApiProperty } from '@nestjs/swagger';

export class CandlePointer {
  @ApiProperty()
  symbol: string;
  @ApiProperty()
  interval: string;
  @ApiProperty()
  time: number;
}

export class GetCandlesDto {
  @ApiProperty()
  symbol: string;
  @ApiProperty()
  interval: string;
  @ApiProperty()
  to?: CandlePointer;
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
  open: number;
  @ApiProperty()
  high: number;
  @ApiProperty()
  low: number;
  @ApiProperty()
  close: number;
  @ApiProperty()
  volume: number;
}
