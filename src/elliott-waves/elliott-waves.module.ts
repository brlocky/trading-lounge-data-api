import { Module } from '@nestjs/common';
import { ElliottWavesService } from './elliott-waves.service';
import { ElliottWavesController } from './elliott-waves.controller';
import { CandleService } from './services/candle.service';
import { ChartService } from './services/chart.service';

@Module({
  controllers: [ElliottWavesController],
  providers: [ElliottWavesService, CandleService, ChartService],
  exports: [ElliottWavesService],
})
export class ElliottWavesModule {}
