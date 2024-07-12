import { Injectable } from '@nestjs/common';
import { CandleDto } from 'src/search/dto';
import { ClusterPivot, ClusterWaves, Pivot, Wave } from '../class';
import { getLLBeforeBreak, WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { Trend, WaveName, WaveType } from '../enums';
import { PivotTest } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
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

  async processClusterGroups(
    clusters: ClusterWaves[],
    candles: CandleDto[],
    pivots: Pivot[],
    loop: number = 0,
    useLogScale: boolean,
  ): Promise<{ completed: ClusterWaves[]; incompleted: ClusterWaves[] }> {
    let currentCompletedCluster = clusters;
    let currentIncompletedCluster: ClusterWaves[] = [];

    for (let i = 0; i < loop; i++) {
      const [completed, incompleted] = await this.continueImpulseWave(currentCompletedCluster, candles, pivots, useLogScale);
      currentCompletedCluster = completed;
      currentIncompletedCluster = [...incompleted, ...currentIncompletedCluster];

      const nextLoopCluster: ClusterWaves[] = [];

      /*      
      const groupedClusters = groupClustersByWaves(completed, 4);
    const perfectClusters = [];
      for (const groupedCluster of groupedClusters) {
        for (const c of groupedCluster) {
          const [w1, w2, w3, w4, w5] = c.waves;
          const infos = this.waveInfoService.getWaveInformation(w1, w2, w3, w4, w5, useLogScale);
          for (const info of infos) {
            const isPerfect = info.isValid.structure && info.isValid.wave && info.isValid.time;
            const isValid = info.isValid.structure && info.isValid.wave;
            const score = info.score.wave + info.score.time / 2;
            console.log(score);
            if (isPerfect) {
              perfectClusters.push(c);
            }
          }
        }
      } */

      for (const c of currentCompletedCluster) {
        const [wave1, , , , wave5] = c.waves;
        const wave2TestResult = this.wave2Test(c, pivots);
        const { type, pivot: newWave2Pivot } = wave2TestResult;

        if (type === 'NOT-FOUND-WITH-BREAK') {
          continue;
        }

        if (type === 'NOT-FOUND-NO-BREAK') {
          currentIncompletedCluster.unshift(c);
          continue;
        }

        if (!newWave2Pivot) {
          console.error('We should always get a pivot at this point');
          continue;
        }

        this.fibonacci.setLogScale(useLogScale);
        const testPivotRetracement = this.fibonacci.getRetracementPercentage(wave1.pStart.price, wave5.pEnd.price, newWave2Pivot.price);

        if (testPivotRetracement < 14.2) {
          continue;
        }

        const newWave2ClusterPivot = new ClusterPivot(newWave2Pivot, 'CONFIRMED');
        const candlesToCalculateDegree = candles.filter((c) => c.time >= wave1.pStart.time && c.time <= wave5.pEnd.time);
        const wave1NDays = WaveDegreeCalculator.getNumberOfDays(candlesToCalculateDegree);
        const calculatedDegree = WaveDegreeCalculator.getWaveDegree(wave1NDays * 3);

        const newWave1 = new Wave(WaveName._1, calculatedDegree, wave1.pStart, wave5.pEnd);
        c.waves.forEach((w) => newWave1.addChidren(w));
        const newWave2 = new Wave(WaveName._2, calculatedDegree, wave5.pEnd, newWave2ClusterPivot);
        const newWaveCluster = new ClusterWaves([newWave1, newWave2], WaveType.MOTIVE, calculatedDegree);
        nextLoopCluster.push(newWaveCluster);
      }
      currentCompletedCluster = nextLoopCluster;
    }

    const [finalCompleted, finalIncompleted] = await this.continueImpulseWave(currentCompletedCluster, candles, pivots, useLogScale);

    return { completed: finalCompleted, incompleted: [...finalIncompleted, ...currentIncompletedCluster] };
  }

  async findMajorStructure(pivots: Pivot[], candles: CandleDto[], definition = 3, loop = 0, useLogScale: boolean): Promise<ClusterWaves[]> {
    const patchedDefinition = definition > 10 ? 10 : definition;
    let retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots, patchedDefinition);

    // using only 1st to increase performance
    retracements = retracements.slice(0, 4);

    const clusters: ClusterWaves[] = [];
    const pStart = pivots[0];

    // Break when we have retracement bellow initial price
    const findLowerPivot = !!retracements.find((p) => p.price <= pStart.price);
    if (findLowerPivot) {
      return [];
    }

    const tuplesRet1 = this.createPivotTuples(retracements);

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

    const { completed, incompleted } = await this.processClusterGroups(clusters, candles, pivots, loop, useLogScale);

    return [...completed, ...incompleted];
  }

  /*   async findMajorStructure2(pivots: Pivot[], candles: CandleDto[], definition = 3, useLogScale: boolean): Promise<ClusterWaves[]> {
    const retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots, definition);

    const clusters: ClusterWaves[] = [];
    const pStart = pivots[0];

    const findLowerPivot = !!retracements.find((p) => p.price <= pStart.price);
    if (findLowerPivot) {
      return [];
    }

    const tuplesRet1 = this.createPivotTuples(retracements);

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

    const [completed, incompleted] = await this.continueImpulseWave(clusters, candles, pivots, useLogScale);

    let currentCompletedCluster = [...completed];
    let currentIncomletedCluster = [...incompleted];

    const waitingTimeClusters = [];

    for (let i = 0; i < 3; i++) {
      const nextLoopCluster = [];
      const groupedClusters = groupClustersByWaves(currentCompletedCluster, 4);
      for (const groupedCluster of groupedClusters) {
        for (const c of groupedCluster) {
          const [wave1, , , , wave5] = c.waves;

          const wave2TestResult = this.wave2Test(c, pivots);

          const { type, pivot: newWave2Pivot } = wave2TestResult;

          // Discard this cluster we went higer with no wave 2 on sight
          if (type === 'NOT-FOUND-WITH-BREAK') {
            continue;
          }

          // Need to wait for lower
          if (type === 'NOT-FOUND-NO-BREAK') {
            waitingTimeClusters.push(c);
          }

          if (!newWave2Pivot) {
            console.error('We should always get a pivot at this point');
            continue;
          }

          const newWave2ClusterPivot = new ClusterPivot(newWave2Pivot, 'CONFIRMED');

          // Build new Wave 1/2 Cluster.
          // Calculate Wave degree using wave 1 time.
          const candlesToCalculateDegree = candles.filter((c) => c.time >= wave1.pStart.time && c.time <= wave5.pEnd.time);
          const wave1NDays = WaveDegreeCalculator.getNumberOfDays(candlesToCalculateDegree);
          const calculatedDegree = WaveDegreeCalculator.getWaveDegree(wave1NDays * 3);

          const newWave1 = new Wave(WaveName._1, calculatedDegree, wave1.pStart, wave5.pEnd);
          c.waves.forEach((w) => newWave1.addChidren(w));
          const newWave2 = new Wave(WaveName._2, calculatedDegree, wave5.pEnd, newWave2ClusterPivot);
          const newWaveCluster = new ClusterWaves([newWave1, newWave2], WaveType.MOTIVE, calculatedDegree);
          nextLoopCluster.push(newWaveCluster);
        }
      }

      const [completed2, incompleted2] = await this.continueImpulseWave(nextLoopCluster, candles, pivots, useLogScale);
      currentCompletedCluster = [...completed2];
      currentIncomletedCluster = [...currentIncomletedCluster, ...incompleted2];
    }

    return [...currentCompletedCluster, ...waitingTimeClusters, ...currentIncomletedCluster];
  }
 */
  wave2Test(cluster: ClusterWaves, pivots: Pivot[]): PivotTest {
    const [, , , , wave5] = cluster.waves;
    const availablePivots = this.getPivotsAfter(pivots, wave5.pEnd);
    return getLLBeforeBreak(availablePivots, wave5.pEnd);
  }

  async continueImpulseWave(
    majorClusters: ClusterWaves[],
    candles: CandleDto[],
    pivots: Pivot[],
    useLogScale: boolean,
  ): Promise<[ClusterWaves[], ClusterWaves[]]> {
    const continuedClusters: ClusterWaves[] = [];
    const incompleteClusters: ClusterWaves[] = [];

    const testWaveBreak = (fromPivot: Pivot, toPivot: Pivot): boolean => {
      return !!candles.find((c) => c.time > fromPivot.time && c.low < fromPivot.price && c.time <= toPivot.time);
    };

    const testPivotBreak = (fromPivot: Pivot): boolean => {
      return !!candles.slice(0, 300).find((c) => c.time > fromPivot.time && c.low < fromPivot.price);
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
        if (!testPivotBreak(wave2.pEnd)) {
          incompleteClusters.push(majorCluster);
        }
        continue;
      }

      for (const [p3, p4] of wave3Retracements) {
        if (p3.price < wave1.pEnd.price) continue;
        if (p4.price <= wave2.pEnd.price) break;

        if (testWaveBreak(wave2.pEnd, p3)) continue;
        if (testWaveBreak(wave2.pEnd, p4)) continue;

        const branchCluster: ClusterWaves | null = majorCluster.duplicate();
        wave3 = new Wave(WaveName._3, wave1.degree, wave2.pEnd, p3);
        branchCluster.addWave(wave3);
        wave4 = new Wave(WaveName._4, wave1.degree, p3, p4);
        branchCluster.addWave(wave4);

        // Get wave 5 retracements
        const wave5Pivots = this.getWave5Pivots(candles, pivots, wave1, wave2, wave3, wave4);
        if (!wave5Pivots.length) {
          if (!testPivotBreak(wave4.pEnd) && this.indentifyImpulse(wave1, wave2, wave3, wave4, null, useLogScale).length) {
            incompleteClusters.push(branchCluster);
          }
          continue;
        }

        let atLeastOneWave5Found = false;
        for (const p5 of wave5Pivots) {
          if (testWaveBreak(wave4.pEnd, p5)) continue;
          const finalCluster = branchCluster?.duplicate();

          wave5 = new Wave(WaveName._5, wave1.degree, wave4.pEnd, p5);
          finalCluster?.addWave(wave5);

          const waveTypes = this.indentifyImpulse(wave1, wave2, wave3, wave4, wave5, useLogScale);

          if (finalCluster && waveTypes.length) {
            continuedClusters.push(finalCluster);
            atLeastOneWave5Found = true;
          }
        }

        if (!atLeastOneWave5Found && this.indentifyImpulse(wave1, wave2, wave3, wave4, null, useLogScale).length) {
          if (!testPivotBreak(wave4.pEnd)) {
            incompleteClusters.push(branchCluster);
          }
        }
      }
    }

    return [continuedClusters, incompleteClusters];
  }

  indentifyImpulse(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave | null = null, useLogScale: boolean): WaveType[] {
    const waveInfos = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, useLogScale);

    const possiblePatterns = [];
    for (const waveInfo of waveInfos) {
      if (wave5) {
        if (!waveInfo.isValid.structure || !waveInfo.isValid.wave) {
          continue;
        }
      } else {
        if (!waveInfo.isValid.wave) {
          continue;
        }
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

  getWave5Pivots(candles: CandleDto[], pivots: Pivot[], wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): Pivot[] {
    const wave5ProjectedRange = this.getWave5ProjectionRange(wave1, wave2, wave3, wave4);
    const availablePivots = this.getPivotsAfter(pivots, wave4.pEnd);

    const wave5Pivots = [];
    const trendUp = wave1.trend() === Trend.UP;
    const trendDown = wave1.trend() === Trend.DOWN;

    let highestPriceInWave5 = -Infinity; // Initialize to the lowest possible value
    let lowestPriceInWave5 = Infinity; // Initialize to the highest possible value

    for (const p1 of availablePivots) {
      if ((trendUp && p1.isLow()) || (trendDown && p1.isHigh())) continue;

      if (p1.price >= wave5ProjectedRange.min && p1.price <= wave5ProjectedRange.max) {
        if (trendUp && p1.price > highestPriceInWave5 && p1.price >= wave3.pEnd.price) {
          highestPriceInWave5 = p1.price;
          wave5Pivots.push(p1);
        } else if (trendDown && p1.price < lowestPriceInWave5 && p1.price <= wave3.pEnd.price) {
          lowestPriceInWave5 = p1.price;
          wave5Pivots.push(p1);
        }
      }
    }

    return wave5Pivots;
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

  getWave5ProjectionRange(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): { min: number; max: number } {
    const [min, max] = [38.2, 468];
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
}