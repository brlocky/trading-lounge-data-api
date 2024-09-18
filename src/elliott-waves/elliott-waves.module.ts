import { Module } from '@nestjs/common';
import { AIModule } from 'src/ai/ai.module';
import { ElliottWavesController } from './elliott-waves.controller';
import { ElliottWavesService } from './elliott-waves.service';
import {
  CandleService,
  ChannelValidationService,
  ChartService,
  ClusterService,
  DiscoveryService,
  WaveInfoService,
  WaveProjectionService,
} from './services';

@Module({
  controllers: [ElliottWavesController],
  providers: [
    ElliottWavesService,
    CandleService,
    ChartService,
    ClusterService,
    WaveInfoService,
    WaveProjectionService,
    DiscoveryService,
    ChannelValidationService,
  ],
  exports: [ElliottWavesService],
  imports: [AIModule],
})
export class ElliottWavesModule {}
