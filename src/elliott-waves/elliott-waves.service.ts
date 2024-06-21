import { Injectable } from '@nestjs/common';
import { CandleDto } from 'src/search/dto';
import { CandlesInfo, ClusterWaves, Pivot } from './types';
import { CandleService, WaveCalculationService } from './services';
import { WaveDegreeCalculator } from './class/utils/wave-degree.class';
import { degreeToString } from './enums';

@Injectable()
export class ElliottWavesService {
  constructor(
    private candleService: CandleService,
    private waveCalculationService: WaveCalculationService,
  ) {}

  getWaveCounts(candles: CandleDto[], degree: number, logScale: boolean, definition: number): ClusterWaves[] {
    return this.waveCalculationService.getWaveCounts(candles, degree, logScale, definition);
  }

  getSubWaveCounts(candles: CandleDto[], degree: number, startPivot: Pivot, endPivot: Pivot, logScale: boolean): ClusterWaves[] {
    return this.waveCalculationService.getSubWaveCounts(candles, degree, startPivot, endPivot, logScale);
  }

  getPivotsInfo(candles: CandleDto[], definition: number): CandlesInfo {
    const pivots = this.candleService.getZigZag(candles);
    const retracements = this.candleService.generateRetracements(pivots, definition);

    const degreeEnum = new WaveDegreeCalculator(candles).calculateWaveDegree();
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
}
