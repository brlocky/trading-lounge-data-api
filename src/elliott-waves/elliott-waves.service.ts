import { Injectable } from '@nestjs/common';
import { CandleDto } from 'src/search/dto';
import { CandlesInfo, ClusterWaves, Pivot, WaveInfo, WavesConfig } from './types';
import { CandleService, WaveCalculationService, WaveInfoService } from './services';
import { convertPivotsToWaves, WaveDegreeCalculator } from './class/utils';
import { degreeToString } from './enums';

@Injectable()
export class ElliottWavesService {
  constructor(
    private candleService: CandleService,
    private waveCalculationService: WaveCalculationService,
    private waveInfoService: WaveInfoService,
  ) {}

  getWaveCounts(candles: CandleDto[], degree: number, logScale: boolean, definition: number): Promise<ClusterWaves[]> {
    return this.waveCalculationService.getWaveCounts(candles, degree, logScale, definition);
  }

  getSubWaveCounts(candles: CandleDto[], degree: number, startPivot: Pivot, endPivot: Pivot, logScale: boolean): Promise<ClusterWaves[]> {
    return this.waveCalculationService.getSubWaveCounts(candles, degree, startPivot, endPivot, logScale);
  }

  getCandlesInfo(candles: CandleDto[], definition: number): CandlesInfo {
    const pivots = this.candleService.getZigZag(candles);
    const retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots, definition);

    const degreeEnum = WaveDegreeCalculator.calculateWaveDegree(candles);
    const degree = degreeToString(degreeEnum);

    return {
      degree: {
        title: degree,
        value: degreeEnum,
      },
      pivots,
      retracements,
    };
  }

  getWaveInfo(pivots: Pivot[], useLogScale: boolean): WaveInfo[] {
    const waves = convertPivotsToWaves(pivots);
    const [wave1, wave2, wave3, wave4, wave5] = waves;
    return this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, useLogScale);
  }

  getWavesConfig(): WavesConfig {
    return this.waveInfoService.getWavesConfig();
  }
}
