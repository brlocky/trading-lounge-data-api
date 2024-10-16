// src/search/dto/search-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PivotDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  parentId: string;
  @ApiProperty()
  degree: number;
  @ApiProperty()
  type: number;
  @ApiProperty()
  time: number;
  @ApiProperty()
  price: number;
}
