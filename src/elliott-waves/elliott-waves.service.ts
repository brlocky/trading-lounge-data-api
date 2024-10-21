import { BadRequestException, Injectable } from '@nestjs/common';
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

  getWaveCounts(candles: Candle[], subCounts: number): Promise<ClusterWaves[]> {
    const pivots = this.candleService.getZigZag(candles);
    return this.clusterService.findMajorStructure(pivots, candles, subCounts);

    //return this.discoveryService.findMajorStructure(candles, definition);
  }

  async getSubWaveCounts(candles: Candle[], degree: WaveDegree, startIndex: number, endIndex: number | undefined): Promise<ClusterWaves[]> {
    const newDegree: WaveDegree = degree - 1;
    if (newDegree < WaveDegree.MINISCULE) {
      throw new BadRequestException('Cannot use degree lower than MINISCULE');
    }

    const pivots = this.candleService.getZigZag(candles);

    //const lastCandle = candles[candles.length - 1];
    const endCandle = endIndex && endIndex <= candles.length - 1 ? candles[endIndex] : null;

    const waveClusters = await this.clusterService.findMajorStructure(pivots, candles, 1);
    const filteredCluster = waveClusters
      .filter((w) => {
        if (w.waves.length !== 5) return false;
        const w5 = w.waves[w.waves.length - 1];

        if (!endCandle) {
          return true;
          /*  const w0 = w.waves[0];
          const isUpTrend = w0.pStart.price < w0.pEnd.price ? true : false;
          if (isUpTrend && w5.pEnd.price >= lastCandle.high) return true;
          if (!isUpTrend && w5.pEnd.price <= lastCandle.low) return true;
          return false; */
        }
        if (w5.pEnd.time === endCandle.time) return true;
        return false;
      })
      .map((w) => {
        w.changeDegree(newDegree);
        return w;
      });

    const sortedClusters = this.clusterService.sortClustersByScore(filteredCluster, candles);
    return new Promise((r) => r(sortedClusters));
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

  getWaveInfo(candles: Candle[], pivots: Pivot[], degree: WaveDegree): WaveInfo[] {
    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);
    const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(degree);

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

  getPivotsInfo(candles: Candle[], complete: boolean, timed: boolean, retracementThreshold: number, extremePivotsOnly: boolean): Pivot[] {
    const pivots = this.candleService.getZigZag(candles);
    if (complete) return pivots;
    return timed
      ? this.candleService.getMarketStructureTimePivots(pivots, retracementThreshold)
      : this.candleService.getMarketStructurePivots(pivots, retracementThreshold, extremePivotsOnly);
  }

  getGeneralConfig(): GeneralConfig {
    return {
      waves: this.waveInfoService.getWavesConfig(),
      degree: WaveDegreeCalculator.getConfig(),
    };
  }
}
