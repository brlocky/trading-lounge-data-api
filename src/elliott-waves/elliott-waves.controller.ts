import { CacheTTL } from '@nestjs/cache-manager';
import { Body, Controller, Post } from '@nestjs/common';
import { WaveClusterResponse, WaveCounClustertRequest, WaveCountClusterResponse } from './elliott-waves.dto';
import { ElliottWavesService } from './elliott-waves.service';

@Controller('elliott-waves')
export class ElliottWavesController {
  constructor(private readonly service: ElliottWavesService) {}

  @Post('wave-counts')
  @CacheTTL(5)
  load(@Body() req: WaveCounClustertRequest): WaveCountClusterResponse {
    const waveCounts = this.service.getWaveCounts(req);
    return {
      clusters: waveCounts.map((w) => new WaveClusterResponse(w)),
    };
  }
}
