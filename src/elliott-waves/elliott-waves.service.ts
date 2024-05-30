import { Injectable } from '@nestjs/common';
import { Fibonacci } from './class/utils/fibonacci.class';
import { WaveDegreeCalculator } from './class/utils/wave-degree.class';
import { MotiveContractingDiagonal } from './class/wave/motive/motive-contracting-diagonal.class';
import { MotiveExpandingDiagonal } from './class/wave/motive/motive-expanding-diagonal.class';
import { MotiveExtendedWave1 } from './class/wave/motive/motive-extended-wave-1.class';
import { MotiveExtendedWave3 } from './class/wave/motive/motive-extended-wave-3.class';
import { MotiveExtendedWave5 } from './class/wave/motive/motive-extended-wave-5.class';
import { CandleService } from './services/candle.service';
import { ChartService } from './services/chart.service';
import { ClusterWaves, Pivot } from './types';
import { Degree, degreeToString, waveTypeToString } from './enums';
import { CandleDto } from 'src/dto';
import { MotiveWaveInterface } from './interfaces/motive-wave.interface';

interface Props {
  degree: number;
  logScale: boolean;
  subCounts: number;
  definition: number;
  candles: CandleDto[];
}

@Injectable()
export class ElliottWavesService {
  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
  ) {}

  getWaveCounts({ candles, degree, logScale, definition }: Props): ClusterWaves[] {
    const pivots = this.candleService.getZigZag(candles);
    const pivotslogScale = this.candleService.generateRetracements(pivots, definition);

    const degree2Use = degree === 0 ? new WaveDegreeCalculator(candles).calculateWaveDegree() : degree;
    console.log('Degree in use', degreeToString(degree2Use));

    this.chartService.createCandlestickChart(candles, pivots, 'z-wave-count.png', false);
    this.chartService.createCandlestickChart(candles, pivotslogScale, 'z-scale-wave-count.png', true);

    const motivePatterns = this.getWave1Patterns(candles, pivotslogScale, degree2Use, logScale);

    const waveClusters: ClusterWaves[] = [];
    for (const pattern of motivePatterns) {
      const clusters = pattern.find();
      if (!clusters.length) continue;
      waveClusters.push(...clusters);

      console.log('got pattern ', waveTypeToString(pattern.waveType), clusters.length);
    }

    return waveClusters;
  }

  private getWave1Patterns(candles: CandleDto[], pivots: Pivot[], degree: Degree, logScale: boolean): MotiveWaveInterface[] {
    const fibonacci = new Fibonacci(logScale);
    return [
      new MotiveContractingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExpandingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExtendedWave1(candles, pivots, fibonacci, degree),
      new MotiveExtendedWave3(candles, pivots, fibonacci, degree),
      new MotiveExtendedWave5(candles, pivots, fibonacci, degree),
    ];
  }
}
