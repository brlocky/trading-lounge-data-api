// src/search/dto/search-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SearchResultDto {
  @ApiProperty()
  identifier: string;

  @ApiProperty()
  exchange: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  region: string;
}
