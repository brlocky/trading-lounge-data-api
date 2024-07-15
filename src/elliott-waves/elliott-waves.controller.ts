import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ElliottWavesService } from './elliott-waves.service';
import { Candle, WaveInfo, WavesConfig } from './types';
import {
  TransformCandleInterceptor,
  WaveCountClusterRequest,
  WaveCountClusterResponse,
  WaveClusterResponseFactory,
  SubWaveCountClusterRequest,
  WaveInfoRequest,
} from './dto';

@Controller('elliott-waves')
@UseInterceptors(TransformCandleInterceptor)
export class ElliottWavesController {
  constructor(private readonly service: ElliottWavesService) {}

  @Post('wave-counts')
  async getWaveCounts(@Body() req: WaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, degree, logScale, definition } = req;
    const waveCounts = await this.service.getWaveCounts(candles as Candle[], degree, logScale, definition);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('sub-wave-counts')
  async getSubWaveCounts(@Body() req: SubWaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, degree, startPivot, endPivot, logScale } = req;
    const waveCounts = await this.service.getSubWaveCounts(candles as Candle[], degree, startPivot, endPivot, logScale);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('wave-info')
  async getWaveInfo(@Body() req: WaveInfoRequest): Promise<WaveInfo[]> {
    const { candles, pivots, logScale } = req;
    return this.service.getWaveInfo(candles as Candle[], pivots, logScale);
  }

  @Get('waves-config')
  async getWavesConfig(): Promise<WavesConfig> {
    return this.service.getWavesConfig();
  }
}
