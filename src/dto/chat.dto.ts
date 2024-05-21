import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty()
  prompt: string;
}
