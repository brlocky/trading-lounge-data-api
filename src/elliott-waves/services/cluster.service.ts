import { Injectable } from '@nestjs/common';
import { ClusterPivot, ClusterWaves, Pivot, Wave } from '../class';
import { getHHBeforeBreak, getLLBeforeBreak, getPivotsAfter, WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { increaseDegree, reverseTrend, Trend, WaveName, WaveType } from '../enums';
import { Candle } from '../types';
import { CandleService } from './candle.service';
import { ChannelValidationService } from './channel-validation.service';
import { ChartService } from './chart.service';
import { WaveInfoService } from './wave-info.service';

@Injectable()
export class ClusterService {
  protected fibonacci: Fibonacci;

  constructor(
    private candleService: CandleService,
    private waveInfoService: WaveInfoService,
    private chartService: ChartService,
    private channelService: ChannelValidationService,
  ) {
    this.fibonacci = new Fibonacci();
  }

  // Find major structure in the given pivots and candles
  async findMajorStructure(pivots: Pivot[], candles: Candle[], loop = 0): Promise<ClusterWaves[]> {
    // Get wave pivot retracements
    //const retracements = this.candleService.getWavePivotRetracementsByNumberOfWaves(pivots.slice(0, 1000), 10);
    const retracements = this.candleService.getMarketStructureTimePivots(pivots, 30);
    //const retracements = this.candleService.getWavePivotRetracementsByRetracementValue(pivots, 80);

    // Create candlestick chart for visualization
    /*     this.chartService.createCandlestickChart(candles, retracements, 'x_findMajorStructure.jpg');
    this.chartService.createCandlestickChart(candles, pivots, 'x_pivots.jpg'); */
    const clusters: ClusterWaves[] = [];
    const pStart = pivots[0];

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
    const scoredClusters = completed
      .map((c: ClusterWaves) => {
        const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(c.degree);
        const waveInfoArray = this.waveInfoService.getWaveClusterInformation(c, useLogScale, commonInterval);
        if (waveInfoArray.length) {
          const firstWaveInfo = waveInfoArray[0];
          c.changeDegree(firstWaveInfo.degree.degree);
          return { cluster: c, scoreTotal: firstWaveInfo.score.total };
        } else {
          return { cluster: c, scoreTotal: -Infinity };
        }
      })
      .map((scoredCluster) => scoredCluster.cluster) as ClusterWaves[];

    const scoredIncompleteClusters = incompleted
      .map((c: ClusterWaves) => {
        const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(c.degree);
        const waveInfoArray = this.waveInfoService.getWaveClusterInformation(c, useLogScale, commonInterval);
        if (waveInfoArray.length) {
          const firstWaveInfo = waveInfoArray[0];
          c.changeDegree(firstWaveInfo.degree.degree);
          return { cluster: c, scoreTotal: firstWaveInfo.score.total };
        } else {
          return { cluster: c, scoreTotal: -Infinity };
        }
      })
      .map((scoredCluster) => scoredCluster.cluster) as ClusterWaves[];

    return [...scoredClusters, ...scoredIncompleteClusters];
  }

  sortClustersByScore(clusters: ClusterWaves[], candles: Candle[]) {
    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);

    const scoredClusters: { cluster: ClusterWaves; scoreTotal: number }[] = clusters
      .map((c: ClusterWaves) => {
        const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(c.degree);
        const waveInfoArray = this.waveInfoService.getWaveClusterInformation(c, useLogScale, commonInterval);
        if (waveInfoArray.length) {
          const firstWaveInfo = waveInfoArray[0];
          c.changeDegree(firstWaveInfo.degree.degree);
          return { cluster: c, scoreTotal: firstWaveInfo.score.total };
        } else {
          return { cluster: c, scoreTotal: -Infinity };
        }
      })
      .filter((s) => s.scoreTotal > 0);

    return scoredClusters.sort((a, b) => b.scoreTotal - a.scoreTotal).map((scoredCluster) => scoredCluster.cluster) as ClusterWaves[];
  }

  async processClusterGroups(
    clusters: ClusterWaves[],
    candles: Candle[],
    pivots: Pivot[],
    loop: number = 0,
  ): Promise<{ completed: ClusterWaves[]; incompleted: ClusterWaves[] }> {
    let processClusters = clusters;
    const currentCompletedClusters: ClusterWaves[] = [];
    const currentIncompletedClusters: ClusterWaves[] = [];

    for (let i = 0; i < loop; i++) {
      const results = await Promise.all(
        processClusters.map((cluster) =>
          this.completeWaveCluster(cluster, candles, pivots, WaveDegreeCalculator.getDegreeConfig(cluster.degree).useLogScale),
        ),
      );

      const completedClusters = results.flatMap((r) => r.completed);
      const imcompleteClusters = results.flatMap((r) => r.incompleted);

      processClusters = completedClusters
        .map((c) => this.processWave2Test(c, pivots))
        .filter((c): c is ClusterWaves => c !== null && c !== undefined);
      if (!processClusters.length || i + 1 === loop) {
        currentCompletedClusters.push(...completedClusters);
        currentIncompletedClusters.push(...imcompleteClusters);
        break;
      }
    }

    return { completed: currentCompletedClusters, incompleted: currentIncompletedClusters };
  }

  private processWave2Test(cluster: ClusterWaves, pivots: Pivot[]): ClusterWaves | null | undefined {
    const [wave1, , , , wave5] = cluster.waves;
    const availablePivots = getPivotsAfter(pivots, wave5.pEnd);

    const wave2TestResult =
      wave1.trend() === Trend.UP ? getLLBeforeBreak(availablePivots, wave5.pEnd) : getHHBeforeBreak(availablePivots, wave5.pEnd);
    const { type, pivot: newWave2Pivot } = wave2TestResult;

    if (type === 'NOT-FOUND-WITH-BREAK' || type === 'NOT-FOUND-NO-BREAK' || !newWave2Pivot) {
      return undefined;
    }

    const newDegree = increaseDegree(wave1.degree);

    const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(newDegree);
    this.fibonacci.setLogScale(useLogScale);
    const retracement = this.fibonacci.getRetracementPercentage(wave1.pStart.price, wave5.pEnd.price, newWave2Pivot.price);
    if (retracement < 14.2) {
      if (type === 'FOUND-NO-BREAK') return undefined;
      return null;
    }

    return this.createNewClusterWithUpdatedWave2(cluster, newWave2Pivot);
  }

  private createNewClusterWithUpdatedWave2(cluster: ClusterWaves, newWave2Pivot: Pivot): ClusterWaves {
    const [wave1, , , , wave5] = cluster.waves;
    const newDegree = increaseDegree(wave1.degree);

    const newWave2ClusterPivot = new ClusterPivot(newWave2Pivot, 'CONFIRMED');
    const newWave1 = new Wave(WaveName._1, newDegree, wave1.pStart, wave5.pEnd);
    cluster.waves.forEach((w) => newWave1.addChidren(w));
    const newWave2 = new Wave(WaveName._2, newDegree, wave5.pEnd, newWave2ClusterPivot);
    return new ClusterWaves([newWave1, newWave2], WaveType.MOTIVE, newDegree);
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

    // Helper function to test for wave breaks
    const testWaveBreak = (fromPivot: Pivot, toPivot: Pivot): boolean => {
      return (
        candles
          .filter((c) => c.time > fromPivot.time && c.time < toPivot.time)
          .filter((c) => c.low < Math.min(fromPivot.price, toPivot.price) || c.high > Math.max(fromPivot.price, toPivot.price)).length > 0
      );
    };

    const testPivotBreak = (fromPivot: Pivot, trend: Trend): boolean => {
      if (trend === Trend.UP) {
        // For uptrend, check if any of the next 300 candles break above the pivot high
        return !!candles.slice(0, 300).find((c) => c.time > fromPivot.time && c.low < fromPivot.price);
      } else {
        // For downtrend, check if any of the next 300 candles break below the pivot low
        return !!candles.slice(0, 300).find((c) => c.time > fromPivot.time && c.high > fromPivot.price);
      }
    };
    const wave1 = majorCluster.waves[0];
    const wave2 = majorCluster.waves[1];
    let wave3: Wave | null = null;
    let wave4: Wave | null = null;
    let wave5: Wave | null = null;

    // Check for wave breaks
    if (testWaveBreak(wave1.pStart, wave1.pEnd)) {
      return response;
    }
    if (testWaveBreak(wave2.pStart, wave2.pEnd)) {
      return response;
    }
    // Get wave 3 retracements
    const wave3Retracements = this.getWave3RetracementWaves(candles, pivots, wave1, wave2);
    if (!wave3Retracements.length) {
      if (!testPivotBreak(wave2.pEnd, wave1.trend())) {
        response.incompleted.push(majorCluster);
        return response;
      }
    }

    // Process wave 3 and 4 retracements
    for (const [p3, p4] of wave3Retracements) {
      if (wave1.trend() === Trend.UP) {
        if (p3.price < wave1.pEnd.price) continue;
        if (p4.price <= wave2.pEnd.price) break;
      } else {
        if (p3.price > wave1.pEnd.price) continue;
        if (p4.price >= wave2.pEnd.price) break;
      }

      if (testWaveBreak(wave2.pEnd, p3)) continue;
      if (testWaveBreak(p3, p4)) continue;

      const branchCluster: ClusterWaves = majorCluster.duplicate();
      wave3 = new Wave(WaveName._3, wave1.degree, wave2.pEnd, p3);
      branchCluster.addWave(wave3);
      wave4 = new Wave(WaveName._4, wave1.degree, p3, p4);
      branchCluster.addWave(wave4);

      // Get wave 5 retracements
      const wave5Pivots = this.getWave5Pivots(candles, pivots, wave1, wave2, wave3, wave4);
      if (!wave5Pivots.length) {
        if (
          !testPivotBreak(wave4.pEnd, wave3.trend()) &&
          this.indentifyImpulse(wave1, wave2, wave3, wave4, null, useLogScale, commonInterval).length
        ) {
          response.incompleted.push(branchCluster);
        }
        continue;
      }

      // Process wave 5 pivots
      for (const p5 of wave5Pivots) {
        if (testWaveBreak(wave4.pEnd, p5)) continue;
        const finalCluster = branchCluster.duplicate();

        wave5 = new Wave(WaveName._5, wave1.degree, wave4.pEnd, p5);
        finalCluster.addWave(wave5);

        const waveTypes = this.indentifyImpulse(wave1, wave2, wave3, wave4, wave5, useLogScale, commonInterval);

        if (waveTypes.length) {
          response.completed.push(finalCluster);
        }
      }
    }

    return response;
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
    const availablePivots = getPivotsAfter(pivots, wave2.pEnd, true);

    const wave3RetracementPivots = this.candleService.getMarketStructurePivots(availablePivots, 10, true);

    const retracements: [Pivot, Pivot][] = [];
    const trend = wave1.trend();
    let lastValidP1: Pivot | null = null;

    for (let i = 0; i < wave3RetracementPivots.length - 1; i += 2) {
      const p1 = wave3RetracementPivots[i];
      const p2 = wave3RetracementPivots[i + 1];

      // Check if the pivot is within the projected range
      if (p1.price >= wave3ProjectedRange.min && p1.price <= wave3ProjectedRange.max) {
        // Check if p1 is higher (for uptrend) or lower (for downtrend) than the last valid p1
        if (
          lastValidP1 === null ||
          (trend === Trend.UP && p1.price > lastValidP1.price) ||
          (trend === Trend.DOWN && p1.price < lastValidP1.price)
        ) {
          retracements.push([p1, p2]);
          lastValidP1 = p1;
        }
      }
    }

    return retracements;
  }

  // Get wave 5 pivots
  getWave5Pivots(candles: Candle[], pivots: Pivot[], wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): Pivot[] {
    // Calculate the projected range for wave 5
    const wave5ProjectedRange = this.getWave5ProjectionRange(wave1, wave2, wave3, wave4);
    const availablePivots = getPivotsAfter(pivots, wave4.pEnd);

    const wave5Pivots = [];
    const trend = wave1.trend();
    const isTrendUp = trend === Trend.UP;
    const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(wave1.degree);
    const finalChannel = this.channelService.createChannel(wave2.pEnd, wave4.pEnd, wave1.pEnd, useLogScale);

    let highestPriceInWave5 = -Infinity;
    let lowestPriceInWave5 = Infinity;

    for (const p1 of availablePivots) {
      // Skip pivots that don't match the trend
      if ((isTrendUp && p1.isLow()) || (!isTrendUp && p1.isHigh())) continue;

      // Check if the pivot is within the projected range
      if (p1.price >= wave5ProjectedRange.min && p1.price <= wave5ProjectedRange.max) {
        if (isTrendUp && p1.price > highestPriceInWave5 && p1.price >= wave3.pEnd.price) {
          highestPriceInWave5 = p1.price;
          wave5Pivots.push(p1);
        } else if (!isTrendUp && p1.price < lowestPriceInWave5 && p1.price <= wave3.pEnd.price) {
          lowestPriceInWave5 = p1.price;
          wave5Pivots.push(p1);
        }

        if (
          this.channelService.isBeyondLine(
            p1,
            trend === Trend.UP ? finalChannel.lowerLine : finalChannel.upperLine,
            reverseTrend(trend),
            useLogScale,
          )
        ) {
          break;
        }
      }
    }

    return wave5Pivots;
  }

  // Calculate the projection range for wave 3
  getWave3ProjectionRange(p1: Pivot, p2: Pivot, p3: Pivot): { min: number; max: number } {
    const [minPercent, maxPercent] = [61.8, 10000];
    const isUptrend = p2.price < p1.price;

    this.fibonacci.setLogScale(false);
    const pMin = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, minPercent);
    const pMax = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, maxPercent);

    this.fibonacci.setLogScale(true);
    const pMinL = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, minPercent);
    const pMaxL = this.fibonacci.getProjectionPrice(p1.price, p2.price, p3.price, maxPercent);

    let minValue, maxValue;

    if (isUptrend) {
      minValue = Math.min(pMin, pMinL);
      maxValue = Math.max(pMax, pMaxL);
    } else {
      minValue = Math.min(pMin, pMinL);
      maxValue = Math.max(pMax, pMaxL);
    }

    // Ensure min is always less than or equal to max
    if (minValue > maxValue) {
      [minValue, maxValue] = [maxValue, minValue];
    }

    return {
      min: minValue,
      max: maxValue,
    };
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
    const MAX_PROJECTION = 468; // 468%

    const { pStart: p0, pEnd: p1 } = wave1;
    const { pEnd: p2 } = wave2;
    const { pEnd: p3 } = wave3;
    const { pEnd: p4 } = wave4;

    const isUpTrend = p0.price < p4.price;

    const wave3EndPrice = p3.price;

    // Calculate projections using logarithmic scale
    this.fibonacci.setLogScale(true);

    const p1Projection = this.fibonacci.getProjectionPrice(p0.price, p1.price, p4.price, MAX_PROJECTION);
    const p3Projection = this.fibonacci.getProjectionPrice(p2.price, p3.price, p4.price, MAX_PROJECTION);

    if (isUpTrend) {
      const extremeProjection = Math.max(p1Projection, p3Projection);
      return {
        min: wave3EndPrice,
        max: extremeProjection,
      };
    } else {
      const extremeProjection = Math.min(p1Projection, p3Projection);
      return {
        min: extremeProjection,
        max: wave3EndPrice,
      };
    }
  }
}
