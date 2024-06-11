// src/search/dto/search-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class GetQuoteDto {
  @ApiProperty()
  symbols: string[];
}

export class QuoteResult {
  @ApiProperty()
  symbol: string;
  @ApiProperty()
  price: number;
  @ApiProperty()
  date: number;
  @ApiProperty()
  open: number;
  @ApiProperty()
  high: number;
  @ApiProperty()
  low: number;
  @ApiProperty()
  close: number;
}

export class GetQuoteResultDto {
  @ApiProperty()
  quotes: QuoteResult[];
}
