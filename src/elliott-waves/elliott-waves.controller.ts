import { CacheTTL } from '@nestjs/cache-manager';
import { Body, Controller, Post } from '@nestjs/common';
import { SubWaveCounClustertRequest, WaveClusterResponse, WaveCounClustertRequest, WaveCountClusterResponse } from './elliott-waves.dto';
import { ElliottWavesService } from './elliott-waves.service';

@Controller('elliott-waves')
export class ElliottWavesController {
  constructor(private readonly service: ElliottWavesService) {}

  @Post('wave-counts')
  @CacheTTL(5)
  getWaveCounts(@Body() req: WaveCounClustertRequest): WaveCountClusterResponse {
    const waveCounts = this.service.getWaveCounts(req);
    return {
      clusters: waveCounts.map((w) => new WaveClusterResponse(w)),
    };
  }

  @Post('sub-wave-counts')
  @CacheTTL(5)
  getSubWaveCounts(@Body() req: SubWaveCounClustertRequest): WaveCountClusterResponse {
    const waveCounts = this.service.getSubWaveCounts(req);
    return {
      clusters: waveCounts.map((w) => new WaveClusterResponse(w)),
    };
  }
}
