import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    if (configService.get<string>('NODE_ENV') === 'development') {
      return {}; // Empty configuration to disable cache
    }
    const store = await redisStore({
      socket: {
        host: configService.get<string>('REDISHOST'),
        port: parseInt(configService.get<string>('REDISPORT')!),
      },
    });
    return {
      store: () => store,
    };
  },
  inject: [ConfigService],
};
