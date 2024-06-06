import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Inject, Param, Post, Sse } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EMPTY, map, Observable } from 'rxjs';
import { ChatRequestDto } from 'src/chat/dto/chat.dto';
import { v4 } from 'uuid';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly service: ChatService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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
    const inference = await this.service.getInferenceStream(storedQuery);
    return inference.pipe(
      map((event) => {
        return new MessageEvent('message', {
          data: JSON.stringify(event),
        });
      }),
    );
  }
}
