import { Module } from '@nestjs/common';
import { SearchController } from './search/search.controller';
import { CandlesController } from './candles/candles.controller';
import { DataService } from './services';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './services/chat.service';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { RedisOptions } from './config/app-options.contants';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [ConfigModule.forRoot(), CacheModule.registerAsync(RedisOptions)],
  controllers: [SearchController, CandlesController, ChatController],
  providers: [
    DataService,
    ChatService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
