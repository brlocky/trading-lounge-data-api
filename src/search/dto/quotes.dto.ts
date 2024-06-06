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
}

export class GetQuoteResultDto {
  @ApiProperty()
  quotes: QuoteResult[];
}
