import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CandlesController } from './candles/candles.controller';
import { ChatController } from './chat/chat.controller';
import { ElliottWavesModule } from './elliott-waves/elliott-waves.module';
import { DataService, ChatService } from './services';
import { RedisOptions } from './config/app-options.contants';

@Module({
  imports: [ConfigModule.forRoot(), CacheModule.registerAsync(RedisOptions), ElliottWavesModule],
  controllers: [CandlesController, ChatController],
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
