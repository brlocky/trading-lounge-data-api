import { Injectable } from '@nestjs/common';
import { ClusterPivot, ClusterWaves, Pivot, Wave } from '../class';
import { getLLBeforeBreak, groupClustersByWaves, WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { Trend, WaveName, WaveType } from '../enums';
import { Candle, PivotTest } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
import { WaveInfoService } from './wave-info.service';

@Injectable()
export class ClusterService {
  protected fibonacci: Fibonacci;

  constructor(
    private candleService: CandleService,
    private waveInfoService: WaveInfoService,
    private chartService: ChartService,
  ) {
    this.fibonacci = new Fibonacci();
  }

  // Find major structure in the given pivots and candles
  async findMajorStructure(pivots: Pivot[], candles: Candle[], definition = 3, loop = 0, useLogScale: boolean): Promise<ClusterWaves[]> {
    // Limit the definition to a maximum of 10
    const patchedDefinition = definition > 10 ? 10 : definition;

    // Get wave pivot retracements
    let retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots.slice(0, 1000), patchedDefinition);

    // Create candlestick chart for visualization
    this.chartService.createCandlestickChart(candles, retracements, 'x_findMajorStructure.jpg');

    // Use only the first 6 retracements for performance
    retracements = retracements.slice(0, 6);

    const clusters: ClusterWaves[] = [];
    const pStart = pivots[0];

    // Break if we have a retracement below the initial price
    const findLowerPivot = !!retracements.find((p) => p.price <= pStart.price);
    if (findLowerPivot) {
      return [];
    }

    // Create initial clusters
    for (let i = 0; i < retracements.length - 1; i += 2) {
      const [p1, p2] = [retracements[i], retracements[i + 1]];

      // Calculate Wave degree using wave 1 time
      const candlesToCalculateDegree = candles.filter((c) => c.time >= pStart.time && c.time <= p2.time);
      const { degree: calculatedDegree } = WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesToCalculateDegree, 'wave1');

      const wave1 = new Wave(WaveName._1, calculatedDegree, pStart, p1);
      const wave2 = new Wave(WaveName._2, calculatedDegree, p1, p2);
      const newWaveCluster = new ClusterWaves([wave1, wave2], WaveType.MOTIVE, calculatedDegree);
      clusters.push(newWaveCluster);
    }

    // Process cluster groups
    const { completed, incompleted } = await this.processClusterGroups(clusters, candles, pivots, loop);

    // Apply new Degree and sort clusters
    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);
    const scoredClusters = completed.map((c: ClusterWaves) => {
      const waveInfoArray = this.waveInfoService.getWaveClusterInformation(c, useLogScale, commonInterval);
      if (waveInfoArray && waveInfoArray.length > 0) {
        const firstWaveInfo = waveInfoArray[0];
        c.changeDegree(firstWaveInfo.degree.degree);
        return { cluster: c, scoreTotal: firstWaveInfo.score.total };
      } else {
        return { cluster: c, scoreTotal: -Infinity };
      }
    });
    const sortedFilteredClusters = scoredClusters
      .sort((a, b) => b.scoreTotal - a.scoreTotal)
      .map((scoredCluster) => scoredCluster.cluster) as ClusterWaves[];

    return [...sortedFilteredClusters, ...incompleted];
  }

  // Process cluster groups to find completed and incompleted clusters
  async processClusterGroups(
    clusters: ClusterWaves[],
    candles: Candle[],
    pivots: Pivot[],
    loop: number = 0,
  ): Promise<{ completed: ClusterWaves[]; incompleted: ClusterWaves[] }> {
    let currentCompletedCluster = clusters;
    let currentIncompletedCluster: ClusterWaves[] = [];

    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);

    // Process clusters for the specified number of loops
    for (let i = 0; i < loop; i++) {
      for (const cluster of currentCompletedCluster) {
        const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(cluster.degree);
        const { completed, incompleted } = await this.completeWaveCluster(cluster, candles, pivots, useLogScale);

        // Group clusters by Wave 4
        const groupedClusters = groupClustersByWaves(completed, 4);

        // Find best Wave 5 clusters
        const bestWave5Clusters = this.findBestClusters(groupedClusters, commonInterval);

        currentCompletedCluster = bestWave5Clusters;
        currentIncompletedCluster = [...incompleted, ...currentIncompletedCluster];

        const nextLoopCluster: ClusterWaves[] = [];

        // Process each completed cluster
        for (const c of currentCompletedCluster) {
          const [wave1, , , , wave5] = c.waves;
          const wave2TestResult = this.wave2Test(c, pivots);
          const { type, pivot: newWave2Pivot } = wave2TestResult;

          // Handle different wave 2 test results
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

          // Calculate retracement percentage
          this.fibonacci.setLogScale(useLogScale);
          const testPivotRetracement = this.fibonacci.getRetracementPercentage(wave1.pStart.price, wave5.pEnd.price, newWave2Pivot.price);

          if (testPivotRetracement < 14.2) {
            currentIncompletedCluster.unshift(c);
            continue;
          }

          // Create new wave cluster with updated wave 2
          const newWave2ClusterPivot = new ClusterPivot(newWave2Pivot, 'CONFIRMED');
          const candlesToCalculateDegree = candles.filter((c) => c.time >= wave1.pStart.time && c.time <= wave5.pEnd.time);
          const { degree: calculatedDegree } = WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesToCalculateDegree, 'wave1');

          const newWave1 = new Wave(WaveName._1, calculatedDegree, wave1.pStart, wave5.pEnd);
          c.waves.forEach((w) => newWave1.addChidren(w));
          const newWave2 = new Wave(WaveName._2, calculatedDegree, wave5.pEnd, newWave2ClusterPivot);
          const newWaveCluster = new ClusterWaves([newWave1, newWave2], WaveType.MOTIVE, calculatedDegree);
          nextLoopCluster.push(newWaveCluster);
        }

        currentCompletedCluster = nextLoopCluster;
      }
    }

    let finalCompleted: ClusterWaves[] = [];
    let finalIncompleted: ClusterWaves[] = [];

    // Complete wave clusters and find the best ones
    for (const cluster of currentCompletedCluster) {
      const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(cluster.degree);
      const { completed, incompleted } = await this.completeWaveCluster(cluster, candles, pivots, useLogScale);

      const groupedByWave4 = groupClustersByWaves(completed, 4);
      const completedClean = this.findBestClusters(groupedByWave4, commonInterval);

      finalCompleted = [...finalCompleted, ...completedClean];
      finalIncompleted = [...incompleted, ...finalIncompleted];
    }

    return { completed: finalCompleted, incompleted: [...finalIncompleted, ...currentIncompletedCluster] };
  }

  // Test for wave 2
  wave2Test(cluster: ClusterWaves, pivots: Pivot[]): PivotTest {
    const [, , , , wave5] = cluster.waves;
    const availablePivots = this.getPivotsAfter(pivots, wave5.pEnd);
    return getLLBeforeBreak(availablePivots, wave5.pEnd);
  }

  // Complete a wave cluster
  async completeWaveCluster(
    majorCluster: ClusterWaves,
    candles: Candle[],
    pivots: Pivot[],
    useLogScale: boolean,
  ): Promise<{ completed: ClusterWaves[]; incompleted: ClusterWaves[] }> {
    const response: { completed: ClusterWaves[]; incompleted: ClusterWaves[] } = { completed: [], incompleted: [] };

    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);

    // Helper functions to test for wave breaks
    const testWaveBreak = (fromPivot: Pivot, toPivot: Pivot): boolean => {
      return !!candles.find((c) => c.time > fromPivot.time && c.low < fromPivot.price && c.time <= toPivot.time);
    };

    const testPivotBreak = (fromPivot: Pivot): boolean => {
      return !!candles.slice(0, 300).find((c) => c.time > fromPivot.time && c.low < fromPivot.price);
    };

    const wave1 = majorCluster.waves[0];
    const wave2 = majorCluster.waves[1];
    let wave3: Wave | null = null;
    let wave4: Wave | null = null;
    let wave5: Wave | null = null;

    // Check for wave breaks
    if (testWaveBreak(wave1.pStart, wave1.pEnd)) return response;
    if (testWaveBreak(wave1.pStart, wave2.pEnd)) return response;

    // Get wave 3 retracements
    const wave3Retracements = this.getWave3RetracementWaves(candles, pivots, wave1, wave2);
    if (!wave3Retracements.length) {
      if (!testPivotBreak(wave2.pEnd)) {
        response.incompleted.push(majorCluster);
        return response;
      }
    }

    // Process wave 3 and 4 retracements
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
        if (!testPivotBreak(wave4.pEnd) && this.indentifyImpulse(wave1, wave2, wave3, wave4, null, useLogScale, commonInterval).length) {
          response.incompleted.push(branchCluster);
        }
        continue;
      }

      // Process wave 5 pivots
      let atLeastOneWave5Found = false;
      for (const p5 of wave5Pivots) {
        if (testWaveBreak(wave4.pEnd, p5)) continue;
        const finalCluster = branchCluster?.duplicate();

        wave5 = new Wave(WaveName._5, wave1.degree, wave4.pEnd, p5);
        finalCluster?.addWave(wave5);

        const waveTypes = this.indentifyImpulse(wave1, wave2, wave3, wave4, wave5, useLogScale, commonInterval);

        if (finalCluster && waveTypes.length) {
          response.completed.push(finalCluster);
          atLeastOneWave5Found = true;
        }
      }

      if (!atLeastOneWave5Found && this.indentifyImpulse(wave1, wave2, wave3, wave4, null, useLogScale, commonInterval).length) {
        if (!testPivotBreak(wave4.pEnd)) {
          response.incompleted.push(branchCluster);
        }
      }
    }

    return response;
  }

  // Find the best clusters from grouped clusters
  findBestClusters(groupedClusters: ClusterWaves[][], commonInterval: number): ClusterWaves[] {
    const finalClusters: ClusterWaves[] = [];

    groupedClusters.forEach((clusterGroup) => {
      if (clusterGroup.length <= 1) {
        finalClusters.push(clusterGroup[0]);
        return;
      }

      const bestClusters: ClusterWaves[] = [];
      let lastBest: ClusterWaves | null = null;

      for (let i = 0; i < clusterGroup.length; i++) {
        const currentCluster = clusterGroup[i];
        const currentWave5 = currentCluster.waves[4];

        if (lastBest === null) {
          lastBest = currentCluster;
          continue;
        }

        const lastBestWave5 = lastBest.waves[4];

        if (lastBestWave5.pEnd.time + 10 * commonInterval * 24 * 3600 >= currentWave5.pEnd.time) {
          // Waves are close, update lastBest
          lastBest = currentCluster;
        } else {
          // Waves are far apart, push lastBest and start new group
          bestClusters.push(lastBest);
          lastBest = currentCluster;
        }
      }

      // Don't forget to push the last best cluster
      if (lastBest) {
        bestClusters.push(lastBest);
      }

      finalClusters.push(...bestClusters);
    });

    return finalClusters;
  }

  // Identify impulse waves
  indentifyImpulse(
    wave1: Wave,
    wave2: Wave,
    wave3: Wave,
    wave4: Wave,
    wave5: Wave | null = null,
    useLogScale: boolean,
    commonInterval: number,
  ): WaveType[] {
    // Get wave information for the given waves
    const waveInfos = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, useLogScale, commonInterval);

    const possiblePatterns = [];
    for (const waveInfo of waveInfos) {
      if (wave5) {
        // If wave5 is present, check both structure and wave validity
        if (!waveInfo.isValid.structure || !waveInfo.isValid.wave) {
          continue;
        }
      } else {
        // If wave5 is not present, only check wave validity
        if (!waveInfo.isValid.wave) {
          continue;
        }
      }

      possiblePatterns.push(waveInfo.waveType);
    }

    return possiblePatterns;
  }

  // Get wave 3 retracement waves
  getWave3RetracementWaves(candles: Candle[], pivots: Pivot[], wave1: Wave, wave2: Wave): [Pivot, Pivot][] {
    // Calculate the projected range for wave 3
    const wave3ProjectedRange = this.getWave3ProjectionRange(wave1.pStart, wave1.pEnd, wave2.pEnd);
    const availablePivots = this.getPivotsAfter(pivots, wave2.pEnd);
    const wave3RetracementPivots = this.candleService.getWavePivotRetracementsByNumberOfWaves(availablePivots, 20);

    const retracements: [Pivot, Pivot][] = [];
    for (let i = 0; i < wave3RetracementPivots.length - 1; i += 2) {
      const p1 = wave3RetracementPivots[i];
      const p2 = wave3RetracementPivots[i + 1];

      // Check if the pivot is within the projected range
      if (p1.price >= wave3ProjectedRange.min && p1.price <= wave3ProjectedRange.max) {
        retracements.push([p1, p2]);
      }
    }

    return retracements;
  }

  // Get wave 5 pivots
  getWave5Pivots(candles: Candle[], pivots: Pivot[], wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): Pivot[] {
    // Calculate the projected range for wave 5
    const wave5ProjectedRange = this.getWave5ProjectionRange(wave1, wave2, wave3, wave4);
    const availablePivots = this.getPivotsAfter(pivots, wave4.pEnd);

    const wave5Pivots = [];
    const trendUp = wave1.trend() === Trend.UP;
    const trendDown = wave1.trend() === Trend.DOWN;

    let highestPriceInWave5 = -Infinity;
    let lowestPriceInWave5 = Infinity;

    for (const p1 of availablePivots) {
      // Skip pivots that don't match the trend
      if ((trendUp && p1.isLow()) || (trendDown && p1.isHigh())) continue;

      // Check if the pivot is within the projected range
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

  // Calculate the projection range for wave 3
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

  // Calculate the retracement range for wave 4
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

  // Calculate the projection range for wave 5
  getWave5ProjectionRange(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): { min: number; max: number } {
    const [min, max] = [38.2, 468];
    const p0 = wave1.pStart;
    const p1 = wave1.pEnd;
    const p4 = wave4.pEnd;

    // Calculate projections using both linear and logarithmic scales
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

    // Return the minimum and maximum of all calculated projections
    return {
      min: Math.min(Math.min(p1Min, p1MinL), Math.min(p3Min, p3MinL)),
      max: Math.max(Math.max(p1Max, p1MaxL), Math.max(p3Max, p3MaxL)),
    };
  }

  // Get pivots after a specific pivot
  getPivotsAfter(pivots: Pivot[], pivot: Pivot): Pivot[] {
    const index = pivots.findIndex((p) => p.id === pivot.id);
    if (index === -1 || index + 1 >= pivots.length) {
      return [];
    }
    return pivots.slice(index + 1);
  }
}
