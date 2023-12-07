import { ApiProperty } from '@nestjs/swagger';

export class SearchDto {
  @ApiProperty()
  text: string;
}

export class SearchResultDto {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  country: string;
}
