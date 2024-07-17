import { Injectable } from '@nestjs/common';
import { AIService } from 'src/ai/ai.service';
import { WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { MotiveExtendedWave3 } from '../class/wave/motive/motive-extended-wave-3.class';
import { WaveDegree, degreeToString } from '../enums';
import { MotiveWaveInterface } from '../interfaces/motive-wave.interface';
import { Candle, CandlesInfo } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
import { ClusterService } from './cluster.service';
import { ClusterWaves, ElliottWaveAnalyzer, Pivot } from '../class';
import { WaveInfoService } from './wave-info.service';

@Injectable()
export class WaveCalculationService {
  protected fibonacci: Fibonacci;
  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
    private clusterService: ClusterService,
    private waveInfoService: WaveInfoService,
    private aiService: AIService,
  ) {
    this.fibonacci = new Fibonacci();
  }

  async getWaveCounts(candles: Candle[], degree: WaveDegree, logScale: boolean, definition: number): Promise<ClusterWaves[]> {
    const { pivots } = this.getPivotsInfo(candles, definition);

    return this.clusterService.findMajorStructure(pivots, candles, definition, 0, logScale);
  }

  async getSubWaveCounts4(
    candles: Candle[],
    degree: WaveDegree,
    startPivot: Pivot,
    endPivot: Pivot,
    logScale: boolean,
  ): Promise<ClusterWaves[]> {
    const analyzer = new ElliottWaveAnalyzer(this.candleService, this.waveInfoService, this.chartService);
    const waves = analyzer.analyzeCandles(candles);

    console.log(waves);

    return [];

    /*     const isTargetInsidePivots = !!pivots.find(
      (p) => endPivot && p.time === endPivot.time && p.price === endPivot.price && p.type === endPivot.type,
    );

    const filteredCluster = isTargetInsidePivots
      ? clusters.filter((w) => {
          if (w.waves.length !== 5) return false;
          const lastWave = w.waves[w.waves.length - 1];

          if (lastWave.pEnd.price !== endPivot.price || lastWave.pEnd.time !== endPivot.time) return false;
          return true;
        })
      : clusters; */
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

    // Apply new Degree
    filteredCluster.map((c) => c.changeDegree(newDegree));

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

  private getImpulsePatterns(degree: WaveDegree): MotiveWaveInterface[] {
    return [
      new MotiveExtendedWave3(degree),
      /*       new MotiveExtendedWave1(candles, pivots, fibonacci, degree),
      new MotiveContractingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExpandingDiagonal(candles, pivots, fibonacci, degree), */
    ];
  }
}
