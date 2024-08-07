import { Module } from '@nestjs/common';
import { AIModule } from 'src/ai/ai.module';
import { ElliottWavesController } from './elliott-waves.controller';
import { ElliottWavesService } from './elliott-waves.service';
import { CandleService, ChartService, ClusterService, DiscoveryService, WaveInfoService } from './services';

@Module({
  controllers: [ElliottWavesController],
  providers: [ElliottWavesService, CandleService, ChartService, ClusterService, WaveInfoService, DiscoveryService],
  exports: [ElliottWavesService],
  imports: [AIModule],
})
export class ElliottWavesModule {}
