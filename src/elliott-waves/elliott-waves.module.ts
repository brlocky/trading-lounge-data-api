import { Module } from '@nestjs/common';
import { ElliottWavesService } from './elliott-waves.service';
import { ElliottWavesController } from './elliott-waves.controller';
import { CandleService, ChartService, WaveCalculationService } from './services';

@Module({
  controllers: [ElliottWavesController],
  providers: [ElliottWavesService, CandleService, ChartService, WaveCalculationService],
  exports: [ElliottWavesService],
})
export class ElliottWavesModule {}
