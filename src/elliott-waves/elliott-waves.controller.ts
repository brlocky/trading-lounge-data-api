import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ElliottWavesService } from './elliott-waves.service';
import { Candle, GeneralConfig, WaveInfo } from './types';
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
  constructor(private readonly elliottWaveService: ElliottWavesService) {}

  @Post('wave-counts')
  async getWaveCounts(@Body() req: WaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, degree, logScale, definition } = req;
    const waveCounts = await this.elliottWaveService.getWaveCounts(candles as Candle[], degree, logScale, definition);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('sub-wave-counts')
  async getSubWaveCounts(@Body() req: SubWaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, startIndex, endIndex, degree, logScale } = req;
    const waveCounts = await this.elliottWaveService.getSubWaveCounts(candles as Candle[], degree, startIndex, endIndex, logScale);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('wave-info')
  async getWaveInfo(@Body() req: WaveInfoRequest): Promise<WaveInfo[]> {
    const { candles, pivots } = req;
    return this.elliottWaveService.getWaveInfo(candles as Candle[], pivots);
  }

  @Get('waves-config')
  async getWavesConfig(): Promise<GeneralConfig> {
    return this.elliottWaveService.getGeneralConfig();
  }
}
