import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { WaveInfoRequest } from './request.dto';
import { PivotTransformer } from './pivot-transformer';
import { Candle } from '../types';

@Injectable()
export class TransformPivotInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body: WaveInfoRequest = request.body;

    if (body && body.pivots && body.candles) {
      const transformedPivots = PivotTransformer.transform(body.candles as Candle[], body.pivots);
      body.pivots = transformedPivots;
    }

    return next.handle();
  }
}
