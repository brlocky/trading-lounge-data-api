import { Injectable } from '@nestjs/common';
import { AIService } from 'src/ai/ai.service';
import { CandleDto } from 'src/search/dto';
import { WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { MotiveExtendedWave3 } from '../class/wave/motive/motive-extended-wave-3.class';
import { Degree, degreeToString } from '../enums';
import { MotiveWaveInterface } from '../interfaces/motive-wave.interface';
import { CandlesInfo, ClusterWaves, Pivot } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
import { ClusterService } from './cluster.service';

@Injectable()
export class WaveCalculationService {
  protected fibonacci: Fibonacci;
  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
    private clusterService: ClusterService,
    private aiService: AIService,
  ) {
    this.fibonacci = new Fibonacci();
  }

  async getWaveCounts(candles: CandleDto[], degree: number, logScale: boolean, definition: number): Promise<ClusterWaves[]> {
    const {
      pivots,
      retracements,
      degree: { value: candlesDegree },
    } = this.getPivotsInfo(candles, definition);

    const degree2Use = degree === 0 ? candlesDegree : degree;

    const majorClusters = this.clusterService.findMajorStructure(pivots, candles, definition);

    return majorClusters;

    /*     const motivePatterns = this.getImpulsePatterns(candles, retracements, degree2Use, logScale);

    const waveClusters: ClusterWaves[] = [];
    for (const pattern of motivePatterns) {
      const clusters = pattern.find();
      if (!clusters.length) continue;
      waveClusters.push(...clusters);
    }

    return waveClusters; */
  }

  /*   async getSubWaveCounts(
    candles: CandleDto[],
    degree: number,
    startPivot: Pivot,
    endPivot: Pivot,
    logScale: boolean,
  ): Promise<ClusterWaves[]> {
    const pivots = this.candleService.getZigZag(candles);

    const clusters = await this.clusterService.findMajorStructure(pivots, candles, 3);
    const isTargetInsidePivots = !!pivots.find(
      (p) => endPivot && p.time === endPivot.time && p.price === endPivot.price && p.type === endPivot.type,
    );

    const filteredCluster = isTargetInsidePivots
      ? clusters.filter((w) => {
          if (w.waves.length !== 5) return false;
          const lastWave = w.waves[w.waves.length - 1];

          if (lastWave.pEnd.price !== endPivot.price || lastWave.pEnd.time !== endPivot.time) return false;
          return true;
        })
      : clusters;

    return filteredCluster;
  } */

  getSubWaveCounts(candles: CandleDto[], degree: number, startPivot: Pivot, endPivot: Pivot, logScale: boolean): Promise<ClusterWaves[]> {
    const pivots = this.candleService.getZigZag(candles);

    const motivePatterns = this.getImpulsePatterns(degree - 1);

    const isTargetInsidePivots = !!pivots.find(
      (p) => endPivot && p.time === endPivot.time && p.price === endPivot.price && p.type === endPivot.type,
    );

    const waveClusters: ClusterWaves[] = [];
    for (const pattern of motivePatterns) {
      isTargetInsidePivots && pattern.setTargetPivot(endPivot);
      pattern.load(candles, pivots, new Fibonacci(logScale));
      const clusters = pattern.getImpulseWaves();
      if (!clusters.length) continue;
      waveClusters.push(...clusters);
    }

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

  private getPivotsInfo(candles: CandleDto[], definition: number): CandlesInfo {
    const pivots = this.candleService.getZigZag(candles);
    const retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots, definition);

    const degreeEnum = this.calculateCandlesExpectedDegree(candles);
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

  private calculateCandlesExpectedDegree(candles: CandleDto[]): Degree {
    return WaveDegreeCalculator.calculateWaveDegree(candles);
  }

  private getImpulsePatterns(degree: Degree): MotiveWaveInterface[] {
    return [
      new MotiveExtendedWave3(degree),
      /*       new MotiveExtendedWave1(candles, pivots, fibonacci, degree),
      new MotiveContractingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExpandingDiagonal(candles, pivots, fibonacci, degree), */
    ];
  }
}
