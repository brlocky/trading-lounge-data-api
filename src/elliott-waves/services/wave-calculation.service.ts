import { Injectable } from '@nestjs/common';
import { ClusterWaves, ElliottWaveAnalyzer, Pivot } from '../class';
import { WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { WaveDegree, degreeToString } from '../enums';
import { Candle, CandlesInfo } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
import { ClusterService } from './cluster.service';
import { WaveInfoService } from './wave-info.service';

@Injectable()
export class WaveCalculationService {
  protected fibonacci: Fibonacci;
  constructor(
    private candleService: CandleService,
    private clusterService: ClusterService,
    private waveInfoService: WaveInfoService,
    private chartService: ChartService,
  ) {
    this.fibonacci = new Fibonacci();
  }

  async getWaveCounts(candles: Candle[], degree: WaveDegree, logScale: boolean, definition: number): Promise<ClusterWaves[]> {
    const { pivots } = this.getPivotsInfo(candles, definition);

    const analyzer = new ElliottWaveAnalyzer(this.candleService, this.waveInfoService, this.chartService);

    analyzer.analyzeCandles(candles, degree);


    return this.clusterService.findMajorStructure(pivots, candles, definition, 5, logScale);
  }

  async getSubWaveCounts(
    candles: Candle[],
    degree: number,
    startPivot: Pivot,
    endPivot: Pivot,
    logScale: boolean,
  ): Promise<ClusterWaves[]> {
    const newDegree: WaveDegree = degree - 1;
    if (newDegree < WaveDegree.MINISCULE) {
      throw new Error('Cannot use degree lower than MINISCULE');
    }

    const pivots = this.candleService.getZigZag(candles);

    const waveClusters = await this.clusterService.findMajorStructure(pivots, candles, 3, 0, logScale);
    const isTargetInsidePivots = !!pivots.find(
      (p) => endPivot && p.time === endPivot.time && p.price === endPivot.price && p.type === endPivot.type,
    );
    const filteredCluster = isTargetInsidePivots
      ? waveClusters.filter((w) => {
          if (w.waves.length !== 5) return false;
          const lastWave = w.waves[w.waves.length - 1];

          if (lastWave.pEnd.price !== endPivot.price || lastWave.pEnd.time !== endPivot.time) return false;
          return true;
        })
      : waveClusters;

    return new Promise((r) => r(filteredCluster));
  }

  private getPivotsInfo(candles: Candle[], definition: number): CandlesInfo {
    const pivots = this.candleService.getZigZag(candles);
    const retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots, definition);

    const degreeEnum = WaveDegreeCalculator.calculateWaveDegreeFromCandles(candles);
    const degree = degreeToString(degreeEnum.degree);

    return {
      degree: {
        title: degree,
        value: degreeEnum.degree,
      },
      pivots,
      retracements,
    };
  }
}
