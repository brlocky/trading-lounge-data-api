import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Body, Controller, Inject, Param, Post, Res, Sse } from '@nestjs/common';
import { Response } from 'express';
import { EMPTY, map, Observable } from 'rxjs';
import { ChatRequestDto } from 'src/dto/chat.dto';
import { ChatService } from 'src/services/chat.service';
import { v4 } from 'uuid';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly service: ChatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Not working in google cloud
  @Post('/message')
  async chatMessage(@Body() chatDto: ChatRequestDto, @Res() res: Response): Promise<void> {
    const stream = this.service.inferenceModel(chatDto);

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

  /*
   * Start Chat
   * receive a chat DTO and store it memory
   */
  @Post('/')
  chatEndPoint(@Body() chatDto: ChatRequestDto): string {
    const chatId = v4();
    this.cacheManager.set(chatId, chatDto);

    return chatId;
  }

  @Sse('/messages/:chatId')
  async feedDeviceStatus(@Param('chatId') chatId: string): Promise<Observable<MessageEvent> | null> {
    const storedQuery = await this.cacheManager.get<ChatRequestDto>(chatId);

    if (!storedQuery) return EMPTY;

    return this.service.getInferenceStream(storedQuery).pipe(
      map((event) => {
        return new MessageEvent('message', {
          data: JSON.stringify(event),
        });
      }),
    );
  }
}
