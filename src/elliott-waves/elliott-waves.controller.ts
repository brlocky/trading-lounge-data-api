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
  PivotsInfoRequest,
  TransformPivotInterceptor,
} from './dto';
import { Pivot } from './class';

@Controller('elliott-waves')
@UseInterceptors(TransformCandleInterceptor, TransformPivotInterceptor)
export class ElliottWavesController {
  constructor(private readonly elliottWaveService: ElliottWavesService) {}

  @Post('wave-counts')
  async getWaveCounts(@Body() req: WaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, subCounts } = req;
    const waveCounts = await this.elliottWaveService.getWaveCounts(candles as Candle[], subCounts);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('sub-wave-counts')
  async getSubWaveCounts(@Body() req: SubWaveCountClusterRequest): Promise<WaveCountClusterResponse> {
    const { candles, startIndex, endIndex, degree } = req;
    const waveCounts = await this.elliottWaveService.getSubWaveCounts(candles as Candle[], degree, startIndex, endIndex);
    return {
      clusters: waveCounts.map((w) => WaveClusterResponseFactory.create(w)),
    };
  }

  @Post('wave-info')
  async getWaveInfo(@Body() req: WaveInfoRequest): Promise<WaveInfo[]> {
    const { candles, pivots, degree } = req;
    return this.elliottWaveService.getWaveInfo(candles as Candle[], pivots as Pivot[], degree);
  }

  @Post('pivots')
  async getPivots(@Body() req: PivotsInfoRequest): Promise<Pivot[]> {
    return this.elliottWaveService.getPivotsInfo(req.candles as Candle[], req.complete, req.timed, req.retracement, req.clearTrend);
  }

  @Get('waves-config')
  async getWavesConfig(): Promise<GeneralConfig> {
    return this.elliottWaveService.getGeneralConfig();
  }
}
