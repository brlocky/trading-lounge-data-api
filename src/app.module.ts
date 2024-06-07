import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { RedisOptions } from './config/app-options.contants';
import { ElliottWavesModule } from './elliott-waves/elliott-waves.module';
import { TradingViewService } from './search/providers';
import { SearchModule } from './search/search.module';
import { CustomCacheInterceptor } from './custom-cache-interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(RedisOptions),
    SearchModule.register([TradingViewService]),
    ElliottWavesModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CustomCacheInterceptor,
    },
  ],
})
export class AppModule {}
