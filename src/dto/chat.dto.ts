import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty()
  prompt: string;
  messages: ChatMessage[];
}

export class ChatMessage {
  @ApiProperty()
  role: string;
  content: string;
}
