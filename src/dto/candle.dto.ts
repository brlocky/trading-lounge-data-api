export class GetCandlesDto {
  symbol: string;
  interval: string;
  from?: string;
  to?: string;
}

export class CandlePointer {
  symbol: string;
  interval: string;
  time: string;
}

export class GetCandlesResultDto {
  symbol: string;
  interval: string;
  candles: CandleDto[];
  prevCandle: CandlePointer | null;
  nextCandle: CandlePointer | null;
}

export class CandleDto {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}
