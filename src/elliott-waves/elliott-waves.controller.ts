import { Body, Controller, Post } from '@nestjs/common';
import { NoCache } from 'src/decorators/no-cache.decorator';
import { SubWaveCountClusterRequest, WaveCountClusterRequest, WaveCountClusterResponse } from './dto/elliott-waves.dto';
import { WaveClusterResponseFactory } from './dto/wave-cluster-response.factory';
import { ElliottWavesService } from './elliott-waves.service';

@Controller('elliott-waves')
export class ElliottWavesController {
  constructor(private readonly service: ElliottWavesService) {}

  @NoCache()
  @Post('wave-counts')
  async getWaveCounts(@Body() req: WaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, degree, logScale, definition } = req;
    const waveCounts = await this.service.getWaveCounts(candles, degree, logScale, definition);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @NoCache()
  @Post('sub-wave-counts')
  getSubWaveCounts(@Body() req: SubWaveCountClusterRequest): WaveCountClusterResponse {
    const { candles, degree, startPivot, endPivot, logScale } = req;
    const waveCounts = this.service.getSubWaveCounts(candles, degree, startPivot, endPivot, logScale);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }
}
