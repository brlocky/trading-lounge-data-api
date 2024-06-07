import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const store = await redisStore({
      socket: {
        host: configService.get<string>('REDISHOST'),
        port: parseInt(configService.get<string>('REDISPORT')!),
      },
      ttl: 60, // Default TTL in seconds (1 minute)
    });
    return {
      store: () => store,
      ttl: 60, // Default TTL in seconds (1 minute)
    };
  },
  inject: [ConfigService],
};
