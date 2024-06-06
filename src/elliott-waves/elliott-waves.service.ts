import { Injectable } from '@nestjs/common';
import { Fibonacci } from './class/utils/fibonacci.class';
import { WaveDegreeCalculator } from './class/utils/wave-degree.class';
import { MotiveContractingDiagonal } from './class/wave/motive/motive-contracting-diagonal.class';
import { MotiveExpandingDiagonal } from './class/wave/motive/motive-expanding-diagonal.class';
import { MotiveExtendedWave1 } from './class/wave/motive/motive-extended-wave-1.class';
import { MotiveExtendedWave3 } from './class/wave/motive/motive-extended-wave-3.class';
import { CandleService } from './services/candle.service';
import { ChartService } from './services/chart.service';
import { ClusterWaves, Pivot, CandlesInfo } from './types';
import { Degree, degreeToString, waveTypeToString } from './enums';
import { MotiveWaveInterface } from './interfaces/motive-wave.interface';
import { CandleDto } from 'src/search/dto';

interface IGetWaveCounts {
  degree: number;
  logScale: boolean;
  subCounts: number;
  definition: number;
  candles: CandleDto[];
}

interface IGetCandlesInfo {
  definition: number;
  candles: CandleDto[];
}

interface IGetSubWaveCounts {
  degree: number;
  logScale: boolean;
  candles: CandleDto[];
  startPivot: Pivot;
  endPivot: Pivot;
}

@Injectable()
export class ElliottWavesService {
  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
  ) {}

  getWaveCounts({ candles, degree, logScale, definition }: IGetWaveCounts): ClusterWaves[] {
    const {
      pivots,
      retracements,
      degree: { value: candlesDegree },
    } = this.getPivotsInfo({ candles, definition });
    const degree2Use = degree === 0 ? candlesDegree : degree;
    console.log('Degree in use', degreeToString(degree2Use));

    this.chartService.createCandlestickChart(candles, pivots, 'z-wave-count.png', false);
    this.chartService.createCandlestickChart(candles, retracements, 'z-scale-wave-count.png', true);

    const motivePatterns = this.getWave1Patterns(candles, retracements, degree2Use, logScale);

    const waveClusters: ClusterWaves[] = [];
    for (const pattern of motivePatterns) {
      const clusters = pattern.find();
      if (!clusters.length) continue;
      waveClusters.push(...clusters);

      console.log('got pattern ', waveTypeToString(pattern.waveType), clusters.length);
    }

    return waveClusters;
  }

  getSubWaveCounts({ candles, degree, startPivot, endPivot, logScale }: IGetSubWaveCounts): ClusterWaves[] {
    const pivots = this.candleService.getZigZag(candles);

    this.chartService.createCandlestickChart(candles, pivots, 'z-wave-count.png', false);

    const motivePatterns = this.getWave1Patterns(candles, pivots, degree - 1, logScale);

    const isTargetInsidePivots = !!pivots.find(
      (p) => endPivot && p.time === endPivot.time && p.price === endPivot.price && p.type === endPivot.type,
    );

    const waveClusters: ClusterWaves[] = [];
    for (const pattern of motivePatterns) {
      isTargetInsidePivots && pattern.setTargetPivot(endPivot);
      const clusters = pattern.find();
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

    return filteredCluster;
  }

  getPivotsInfo({ candles, definition }: IGetCandlesInfo): CandlesInfo {
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

  private getWave1Patterns(candles: CandleDto[], pivots: Pivot[], degree: Degree, logScale: boolean): MotiveWaveInterface[] {
    const fibonacci = new Fibonacci(logScale);
    return [
      new MotiveContractingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExpandingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExtendedWave1(candles, pivots, fibonacci, degree),
      new MotiveExtendedWave3(candles, pivots, fibonacci, degree),
      //new MotiveExtendedWave5(candles, pivots, fibonacci, degree),
    ];
  }

  private getWave3Patterns(candles: CandleDto[], pivots: Pivot[], degree: Degree, logScale: boolean): MotiveWaveInterface[] {
    const fibonacci = new Fibonacci(logScale);
    return [new MotiveExtendedWave3(candles, pivots, fibonacci, degree)];
  }

  private getWave5Patterns(candles: CandleDto[], pivots: Pivot[], degree: Degree, logScale: boolean): MotiveWaveInterface[] {
    const fibonacci = new Fibonacci(logScale);
    return [
      new MotiveContractingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExpandingDiagonal(candles, pivots, fibonacci, degree),
    ];
  }
}
