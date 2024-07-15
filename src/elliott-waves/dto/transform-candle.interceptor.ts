import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CandleTransformer } from './candle-transformer';
import { SubWaveCountClusterRequest } from './request.dto';
import { CandleDto } from 'src/search/dto';

@Injectable()
export class TransformCandleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body: SubWaveCountClusterRequest = request.body;

    if (body && body.candles) {
      const transformedCandles = CandleTransformer.transform(body.candles);
      body.candles = transformedCandles as unknown as CandleDto[];
    }

    return next.handle();
  }
}
