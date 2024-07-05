import { Injectable } from '@nestjs/common';
import { CandleDto } from 'src/search/dto';
import { ClusterWaves, Pivot, Wave } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
import { WaveDegreeCalculator } from '../class/utils';
import { WaveName } from '../enums';

@Injectable()
export class ClusterService {
  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
  ) {}

  findMajorStructure(pivots: Pivot[], candles: CandleDto[]): ClusterWaves[] {
    const [ret1, ret2] = this.getMajorSwings(pivots);
    this.chartService.createCandlestickChart(candles, ret1, 'z-scale-wave-count1.png', true);
    this.chartService.createCandlestickChart(candles, ret2, 'z-scale-wave-count2.png', true);

    const clusters: ClusterWaves[] = [];
    const pStart = pivots[0];
    const pEnd = pivots[pivots.length - 1];

    const tuplesRet1 = this.createPivotTuples(ret1);
    const tuplesRet2 = this.createPivotTuples(ret2);

    tuplesRet1.forEach((pivots) => {
      const [p1, p2] = pivots;

      const candlesToCalculateDegree = candles.filter((c) => c.time >= pStart.time && c.time <= p2.time);
      const wave1NDays = WaveDegreeCalculator.getNumberOfDays(candlesToCalculateDegree);
      const degree = WaveDegreeCalculator.getWaveDegree(wave1NDays * 3);

      const wave1 = new Wave(WaveName._1, degree, pStart, p1);
      const wave2 = new Wave(WaveName._2, degree, p1, p2);
      const newClusterWave2 = new ClusterWaves([wave1, wave2]);
      clusters.push(newClusterWave2);

      const wave3 = new Wave(WaveName._3, degree, pStart, p1);
      const wave4 = new Wave(WaveName._4, degree, p1, p2);
      const newClusterWave4 = new ClusterWaves([wave3, wave4]);
      clusters.push(newClusterWave4);
    });

    console.log('Retracement 1 lenght', ret1.length - 2);
    console.log('Retracement 2 lenght', ret2.length - 2);

    return clusters;
  }

  protected getMajorSwings(pivots: Pivot[]): [Pivot[], Pivot[]] {
    const retracements1 = this.candleService.generateRetracements(pivots, 1);
    let retracements2 = this.candleService.generateRetracements(pivots, 2);

    if (retracements1.length === retracements2.length) {
      retracements2 = this.candleService.generateRetracements(pivots, 3);
    }
    if (retracements1.length === retracements2.length) {
      throw new Error('Fail to find Pivots');
    }

    return [retracements1, retracements2];
  }
  /**
   * The objective of this method is to find possible wave 1/2
   *
   * This method receives an array of pivots, ignores the first and last pivots,
   * and returns an array of tuples where each tuple consists of two consecutive pivots.
   * If the number of pivots is not even, it throws an error.
   *
   * @param pivots - An array of Pivot objects
   * @returns An array of tuples, each containing two consecutive Pivot objects
   * @throws Error if the length of the pivots array is not even
   */
  protected createPivotTuples(pivots: Pivot[]): [Pivot, Pivot][] {
    if (pivots.length % 2 !== 0) {
      throw new Error('Pivots array must have an even number of elements');
    }

    const result: [Pivot, Pivot][] = [];

    for (let i = 1; i < pivots.length - 1; i += 2) {
      result.push([pivots[i], pivots[i + 1]]);
    }

    return result;
  }
}
