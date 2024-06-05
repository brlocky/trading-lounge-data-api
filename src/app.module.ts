import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { RedisOptions } from './config/app-options.contants';
import { ElliottWavesModule } from './elliott-waves/elliott-waves.module';
import { AlphaVantageService, TradingViewService } from './search/providers';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(RedisOptions),
    SearchModule.register([AlphaVantageService, TradingViewService]),
    ElliottWavesModule,
    ChatModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
