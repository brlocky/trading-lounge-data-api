import { Body, Controller, Get, Post } from '@nestjs/common';
import { WaveClusterResponseFactory } from './dto/wave-cluster-response.factory';
import { ElliottWavesService } from './elliott-waves.service';
import { SubWaveCountClusterRequest, WaveCountClusterRequest, WaveCountClusterResponse, WaveInfoRequest } from './dto';
import { WaveInfo, WavesConfig } from './types';

@Controller('elliott-waves')
export class ElliottWavesController {
  constructor(private readonly service: ElliottWavesService) {}

  @Post('wave-counts')
  async getWaveCounts(@Body() req: WaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, degree, logScale, definition } = req;
    const waveCounts = await this.service.getWaveCounts(candles, degree, logScale, definition);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('sub-wave-counts')
  async getSubWaveCounts(@Body() req: SubWaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, degree, startPivot, endPivot, logScale } = req;
    const waveCounts = await this.service.getSubWaveCounts(candles, degree, startPivot, endPivot, logScale);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('wave-info')
  async getWaveInfo(@Body() req: WaveInfoRequest): Promise<WaveInfo[]> {
    const { pivots, logScale } = req;
    return this.service.getWaveInfo(pivots, logScale);
  }

  @Get('waves-config')
  async getWavesConfig(): Promise<WavesConfig> {
    return this.service.getWavesConfig();
  }
}
