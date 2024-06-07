import { CallHandler, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NO_CACHE_KEY } from './decorators/no-cache.decorator'; // Ensure correct path

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  constructor(cacheManager: any, reflector: Reflector) {
    super(cacheManager, reflector);
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isNoCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [context.getHandler(), context.getClass()]);

    if (isNoCache) {
      return next.handle();
    }

    return (await super.intercept(context, next)).pipe(tap(() => {}));
  }

  trackBy(context: ExecutionContext): string | undefined {
    const isNoCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_KEY, [context.getHandler(), context.getClass()]);

    if (isNoCache) {
      return undefined; // Returning undefined bypasses the cache
    }

    // Check if there's a custom cache key set using CacheKey decorator
    const cacheKey = this.reflector.get<string>('cacheKey', context.getHandler());

    if (cacheKey) {
      return cacheKey;
    }

    return super.trackBy(context);
  }
}
