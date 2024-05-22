import { Body, Controller, Param, Post, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';
import { ChatDto } from 'src/dto/chat.dto';
import { ChatService } from 'src/services/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Post('/')
  async chatEndPoint(@Body() chatDto: ChatDto, @Res() res: Response): Promise<void> {
    const stream = this.service.inferenceModel(chatDto.prompt);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const event of stream) {
      if (event.event === 'done') {
        res.end();
      } else {
        res.write(event.data);
      }
    }

    res.end();
  }

  @Sse('/messages/:prompt')
  feedDeviceStatus(@Param('prompt') prompt: string): Observable<MessageEvent> {
    return this.service.getInferenceStream(prompt).pipe(
      map((event) => {
        return new MessageEvent('message', {
          data: JSON.stringify(event),
        });
      }),
    );
  }
}
