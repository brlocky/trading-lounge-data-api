import { Injectable } from '@nestjs/common';
import { ClusterWaves, Pivot } from './class';
import { convertPivotsToWaves, WaveDegreeCalculator } from './class/utils';
import { degreeToString, WaveDegree } from './enums';
import { CandleService, ChartService, ClusterService, DiscoveryService, WaveInfoService } from './services';
import { Candle, CandlesInfo, GeneralConfig, WaveInfo } from './types';

@Injectable()
export class ElliottWavesService {
  constructor(
    private candleService: CandleService,
    private waveInfoService: WaveInfoService,
    private clusterService: ClusterService,
    private discoveryService: DiscoveryService,
    private chartService: ChartService,
  ) {}

  getWaveCounts(candles: Candle[], degree: WaveDegree, logScale: boolean, definition: number): Promise<ClusterWaves[]> {
    const pivots = this.candleService.getZigZag(candles);
    return this.clusterService.findMajorStructure(pivots, candles, definition, 5, logScale);

    //return this.discoveryService.findMajorStructure(candles, definition);
  }

  async getSubWaveCounts(
    candles: Candle[],
    degree: WaveDegree,
    startIndex: number,
    endIndex: number | undefined,
    logScale: boolean,
  ): Promise<ClusterWaves[]> {
    const newDegree: WaveDegree = degree - 1;
    if (newDegree < WaveDegree.MINISCULE) {
      throw new Error('Cannot use degree lower than MINISCULE');
    }

    const pivots = this.candleService.getZigZag(candles);

    const endCandle = endIndex && endIndex <= candles.length - 1 ? candles[endIndex] : null;

    const waveClusters = await this.clusterService.findMajorStructure(pivots, candles, 6, 0, logScale);
    const isTargetInsidePivots = !!pivots.find(
      (p) => endCandle && p.time === endCandle.time && (p.price === endCandle.high || p.price === endCandle.low),
    );
    const filteredCluster = (
      isTargetInsidePivots
        ? waveClusters.filter((w) => {
            if (w.waves.length !== 5) return false;

            if (!endCandle) return true;
            const lastWave = w.waves[w.waves.length - 1];
            if (lastWave.pEnd.time === endCandle.time) return true;
            return false;
          })
        : waveClusters
    ).map((w) => {
      w.changeDegree(newDegree);
      return w;
    });

    return new Promise((r) => r(filteredCluster));
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
