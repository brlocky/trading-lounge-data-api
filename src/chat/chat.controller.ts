import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatDto } from 'src/dto/chat.dto';
import { ChatService } from 'src/services/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post('/')
  async chatEndPoint(@Body() chatDto: ChatDto, @Res() res: Response) {
    const stream = this.service.inferenceModel(chatDto.prompt);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    for await (const event of stream) {
      if (event.event === 'done') {
        res.end();
      } else {
        res.write(event.data);
      }
    }

    res.end();
  }
}
