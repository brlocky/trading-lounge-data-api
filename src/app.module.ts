import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ChatController } from './chat/chat.controller';
import { RedisOptions } from './config/app-options.contants';
import { ElliottWavesModule } from './elliott-waves/elliott-waves.module';
import { AlphaVantageService, TradingViewService } from './search/providers';
import { SearchModule } from './search/search.module';
import { ChatService } from './services';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync(RedisOptions),
    ElliottWavesModule,
    SearchModule.register([AlphaVantageService, TradingViewService]),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
