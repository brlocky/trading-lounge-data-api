import { Injectable } from '@nestjs/common';
import { CandleDto } from 'src/search/dto';
import { ClusterWaves, Pivot, Wave } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
import { WaveDegreeCalculator } from '../class/utils';
import { WaveName, WaveType } from '../enums';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { MotiveContractingDiagonal, MotiveExpandingDiagonal, MotiveExtended3 } from '../waves';
import { MotiveInterface } from '../interfaces/motive.interface';
import { WaveInfoService } from './wave-info.service';

@Injectable()
export class ClusterService {
  protected fibonacci: Fibonacci;

  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
    private waveInfoService: WaveInfoService,
  ) {
    this.fibonacci = new Fibonacci();
  }

  private getMotivePatterns(): MotiveInterface[] {
    return [new MotiveExtended3(), new MotiveContractingDiagonal(), new MotiveExpandingDiagonal()];
  }

  async findMajorStructure(pivots: Pivot[], candles: CandleDto[], definition = 3): Promise<ClusterWaves[]> {
    const ret1 = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots, definition);
    this.chartService.createCandlestickChart(candles, ret1, 'z-findMajorStructure.png', true);

    const clusters: ClusterWaves[] = [];
    const pStart = pivots[0];

    const tuplesRet1 = this.createPivotTuples(ret1);

    tuplesRet1.forEach((pivots) => {
      const [p1, p2] = pivots;

      // Calculate Wave degree using wave 1 time.
      const candlesToCalculateDegree = candles.filter((c) => c.time >= pStart.time && c.time <= p2.time);
      const wave1NDays = WaveDegreeCalculator.getNumberOfDays(candlesToCalculateDegree);
      const calculatedDegree = WaveDegreeCalculator.getWaveDegree(wave1NDays * 3);

      const wave1 = new Wave(WaveName._1, calculatedDegree, pStart, p1);
      const wave2 = new Wave(WaveName._2, calculatedDegree, p1, p2);
      const newWaveCluster = new ClusterWaves([wave1, wave2], WaveType.MOTIVE, calculatedDegree);
      clusters.push(newWaveCluster);
    });

    return this.continueImpulseWave(clusters, candles, pivots);
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

    for (let i = 0; i < pivots.length - 1; i += 2) {
      result.push([pivots[i], pivots[i + 1]]);
    }

    return result;
  }

  getPivotsAfter(pivots: Pivot[], pivot: Pivot): Pivot[] {
    const index = pivots.findIndex((p) => p.id === pivot.id);
    if (index === -1 || index + 1 >= pivots.length) {
      return [];
    }
    return pivots.slice(index + 1);
  }

  async continueImpulseWave(majorClusters: ClusterWaves[], candles: CandleDto[], pivots: Pivot[]): Promise<ClusterWaves[]> {
    const continuedClusters: ClusterWaves[] = [];

    const testWaveBreak = (fromPivot: Pivot, toPivot: Pivot): boolean => {
      return !!candles.find((c) => c.time > fromPivot.time && c.low <= fromPivot.price && c.time <= toPivot.time);
    };

    for (const majorCluster of majorClusters) {
      const wave1 = majorCluster.waves[0];
      const wave2 = majorCluster.waves[1];
      let wave3: Wave | null = null;
      let wave4: Wave | null = null;
      let wave5: Wave | null = null;

      if (testWaveBreak(wave1.pStart, wave1.pEnd)) continue;
      if (testWaveBreak(wave1.pStart, wave2.pEnd)) continue;

      // Get wave 3 retracements
      const wave3Retracements = this.getWave3RetracementWaves(candles, pivots, wave1, wave2);
      if (!wave3Retracements.length) {
        continuedClusters.push(majorCluster);
      }

      for (const [p3, p4] of wave3Retracements) {
        if (p3.price < wave1.pEnd.price) continue;
        if (p4.price < wave2.pEnd.price) continue;

        if (testWaveBreak(wave2.pEnd, p3)) continue;
        if (testWaveBreak(wave2.pEnd, p4)) continue;

        const branchCluster: ClusterWaves | null = majorCluster.duplicate();
        wave3 = new Wave(WaveName._3, wave1.degree, wave2.pEnd, p3);
        branchCluster.addWave(wave3);
        wave4 = new Wave(WaveName._4, wave1.degree, p3, p4);
        branchCluster.addWave(wave4);

        // Get wave 5 retracements
        const wave5Retracements = this.getWave5RetracementWaves(candles, pivots, wave1, wave2, wave3, wave4);
        if (!wave5Retracements.length && this.indentifyImpulse(wave1, wave2, wave3, wave4).length) {
          continuedClusters.push(branchCluster);
          continue;
        }

        let atLeastOneWave5Found = false;
        for (const [p5, newP2] of wave5Retracements) {
          if (testWaveBreak(wave4.pEnd, p5)) continue;
          if (p5.price < wave3.pEnd.price) {
            console.log('possible truncation');
            continue;
          }
          const finalCluster = branchCluster?.duplicate();

          wave5 = new Wave(WaveName._5, wave1.degree, wave4.pEnd, p5);
          finalCluster?.addWave(wave5);

          const waveTypes = this.indentifyImpulse(wave1, wave2, wave3, wave4, wave5);

          if (finalCluster && waveTypes.length) {
            continuedClusters.push(finalCluster);
            atLeastOneWave5Found = true;
          }
        }

        if (!atLeastOneWave5Found && this.indentifyImpulse(wave1, wave2, wave3, wave4).length) {
          continuedClusters.push(branchCluster);
        }
      }
    }

    return continuedClusters;
  }

  indentifyImpulse(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave | null = null): WaveType[] {
    const waveInfosWithLogScale = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, true);
    const waveInfosWithOutLogScale = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, false);

    const possiblePatterns = [];
    for (const waveInfo of [...waveInfosWithOutLogScale, ...waveInfosWithLogScale]) {
      if (waveInfo.wave2.retracement?.score === 0 || waveInfo.wave2.time?.score === 0) {
        continue;
      }
      if (waveInfo.wave3.projection?.score === 0 || waveInfo.wave3.time?.score === 0) {
        continue;
      }
      if (waveInfo.wave4.retracement?.score === 0 || waveInfo.wave4.time?.score === 0) {
        continue;
      }
      if (wave5 && (waveInfo.wave5.projection?.score === 0 || waveInfo.wave5.time?.score === 0)) {
        continue;
      }
      possiblePatterns.push(waveInfo.waveType);
    }

    return possiblePatterns;
  }

  getWave3RetracementWaves(candles: CandleDto[], pivots: Pivot[], wave1: Wave, wave2: Wave): [Pivot, Pivot][] {
    const wave3ProjectedRange = this.getWave3ProjectionRange(wave1.pStart, wave1.pEnd, wave2.pEnd);
    const availablePivots = this.getPivotsAfter(pivots, wave2.pEnd);
    const wave3RetracementPivots = this.candleService.getWavePivotRetracementsByNumberOfWaves(availablePivots, 20);

    const retracements: [Pivot, Pivot][] = [];
    for (let i = 0; i < wave3RetracementPivots.length - 1; i += 2) {
      const p1 = wave3RetracementPivots[i];
      const p2 = wave3RetracementPivots[i + 1];

      if (p1.price >= wave3ProjectedRange.min && p1.price <= wave3ProjectedRange.max) {
        retracements.push([p1, p2]);
      }
    }

    return retracements;
  }

  getWave5RetracementWaves(candles: CandleDto[], pivots: Pivot[], wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): [Pivot, Pivot][] {
    const wave5ProjectedRange = this.getExpectedWave5Projection(wave1, wave2, wave3, wave4);

    const availablePivots = this.getPivotsAfter(pivots, wave4.pEnd);
    if (availablePivots.length < 2) return [];
    const wave5RetracementPivots = this.candleService.getWavePivotRetracementsByNumberOfWaves(availablePivots, 10);

    const retracements: [Pivot, Pivot][] = [];
    for (let i = 0; i < wave5RetracementPivots.length - 1; i += 2) {
      const p1 = wave5RetracementPivots[i];
      const p2 = wave5RetracementPivots[i + 1];

      if (p1.price >= wave5ProjectedRange.min && p1.price <= wave5ProjectedRange.max) {
        retracements.push([p1, p2]);
      }
    }

    return retracements;
  }

  getWave3ProjectionRange(p1: Pivot, p2: Pivot, p3: Pivot): { min: number; max: number } {
    const [min, max] = [61.8, 600];
    this.fibonacci.setLogScale(false);
    const pMin = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, min);
    const pMax = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, max);

    this.fibonacci.setLogScale(true);
    const pMinL = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, min);
    const pMaxL = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, max);

    return { min: Math.min(pMin, pMinL), max: Math.max(pMax, pMaxL) };
  }

  getWave4RetracementRange(p2: Pivot, p3: Pivot): { min: number; max: number } {
    const [min, max] = [14.2, 90];

    this.fibonacci.setLogScale(false);
    const pMin = this.fibonacci.getRetracementPrice(p2.price, p3.price, min);
    const pMax = this.fibonacci.getRetracementPrice(p2.price, p3.price, max);

    this.fibonacci.setLogScale(true);
    const pMinL = this.fibonacci.getRetracementPrice(p2.price, p3.price, min);
    const pMaxL = this.fibonacci.getRetracementPrice(p2.price, p3.price, max);

    return { min: Math.min(pMin, pMinL), max: Math.max(pMax, pMaxL) };
  }

  getExpectedWave5Projection(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): { min: number; max: number } {
    const [min, max] = [50, 168];
    const p0 = wave1.pStart;
    const p1 = wave1.pEnd;
    const p4 = wave4.pEnd;

    this.fibonacci.setLogScale(false);
    const p1Min = this.fibonacci.getProjectionPrice(p0.price, p1.price, p4.price, min);
    const p1Max = this.fibonacci.getProjectionPrice(p0.price, p1.price, p4.price, max);

    this.fibonacci.setLogScale(true);
    const p1MinL = this.fibonacci.getProjectionPrice(p0.price, p1.price, p4.price, min);
    const p1MaxL = this.fibonacci.getProjectionPrice(p0.price, p1.price, p4.price, max);

    const p2 = wave2.pStart;
    const p3 = wave3.pStart;

    this.fibonacci.setLogScale(false);
    const p3Min = this.fibonacci.getProjectionPrice(p2.price, p3.price, p4.price, min);
    const p3Max = this.fibonacci.getProjectionPrice(p2.price, p3.price, p4.price, max);

    this.fibonacci.setLogScale(true);
    const p3MinL = this.fibonacci.getProjectionPrice(p2.price, p3.price, p4.price, min);
    const p3MaxL = this.fibonacci.getProjectionPrice(p2.price, p3.price, p4.price, max);

    return {
      min: Math.min(Math.min(p1Min, p1MinL), Math.min(p3Min, p3MinL)),
      max: Math.max(Math.max(p1Max, p1MaxL), Math.max(p3Max, p3MaxL)),
    };
  }
}
