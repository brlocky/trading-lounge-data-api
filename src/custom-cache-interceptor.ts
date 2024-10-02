import { CallHandler, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NO_CACHE_KEY } from './decorators/no-cache.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  private readonly isDevelopment: boolean;

  constructor(
    cacheManager: any,
    reflector: Reflector,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    super(cacheManager, reflector);
    this.isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (this.isDevelopment) {
      return next.handle(); // Bypass cache in development
    }

    const isNoCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [context.getHandler(), context.getClass()]);

    if (isNoCache) {
      return next.handle();
    }

    return (await super.intercept(context, next)).pipe(tap(() => {}));
  }

  trackBy(context: ExecutionContext): string | undefined {
    if (this.isDevelopment) {
      return undefined; // Bypass cache in development
    }

    const isNoCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [context.getHandler(), context.getClass()]);

    if (isNoCache) {
      return undefined;
    }

    const cacheKey = this.reflector.get<string>('cacheKey', context.getHandler());
    if (cacheKey) {
      return cacheKey;
    }

    return super.trackBy(context);
  }
}
