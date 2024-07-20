import { Injectable } from '@nestjs/common';
import { Candle, CandlesInfo, GeneralConfig, WaveInfo } from './types';
import { CandleService, WaveCalculationService, WaveInfoService } from './services';
import { convertPivotsToWaves, WaveDegreeCalculator } from './class/utils';
import { WaveDegree, degreeToString } from './enums';
import { ClusterWaves, Pivot } from './class';

@Injectable()
export class ElliottWavesService {
  constructor(
    private candleService: CandleService,
    private waveCalculationService: WaveCalculationService,
    private waveInfoService: WaveInfoService,
  ) {}

  getWaveCounts(candles: Candle[], degree: WaveDegree, logScale: boolean, definition: number): Promise<ClusterWaves[]> {
    return this.waveCalculationService.getWaveCounts(candles, degree, logScale, definition);
  }

  getSubWaveCounts(candles: Candle[], degree: WaveDegree, startPivot: Pivot, endPivot: Pivot, logScale: boolean): Promise<ClusterWaves[]> {
    return this.waveCalculationService.getSubWaveCounts(candles, degree, startPivot, endPivot, logScale);
  }

  getCandlesInfo(candles: Candle[], definition: number): CandlesInfo {
    const pivots = this.candleService.getZigZag(candles);
    const retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots, definition);

    const { degree: degreeEnum } = WaveDegreeCalculator.calculateWaveDegreeFromCandles(candles);
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

  getWaveInfo(candles: Candle[], pivots: Pivot[]): WaveInfo[] {
    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);
    const { useLogScale, degree } = WaveDegreeCalculator.calculateWaveDegreeFromCandles(candles);
    const waves = convertPivotsToWaves(pivots, degree);
    const [wave1, wave2, wave3, wave4, wave5] = waves;

    const allPossibleWaveInformations = this.waveInfoService.getWaveInformation(
      wave1,
      wave2,
      wave3,
      wave4,
      wave5,
      useLogScale,
      commonInterval,
    );
    return allPossibleWaveInformations.filter((w) => w.isValid.structure && w.isValid.wave);
  }

  getGeneralConfig(): GeneralConfig {
    return {
      waves: this.waveInfoService.getWavesConfig(),
      degree: WaveDegreeCalculator.getConfig(),
    };
  }
}
