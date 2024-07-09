import { Module } from '@nestjs/common';
import { ElliottWavesService } from './elliott-waves.service';
import { ElliottWavesController } from './elliott-waves.controller';
import { CandleService, ChartService, ClusterService, WaveCalculationService, WaveInfoService } from './services';
import { AIModule } from 'src/ai/ai.module';

@Module({
  controllers: [ElliottWavesController],
  providers: [ElliottWavesService, CandleService, ChartService, WaveCalculationService, ClusterService, WaveInfoService],
  exports: [ElliottWavesService],
  imports: [AIModule],
})
export class ElliottWavesModule {}
