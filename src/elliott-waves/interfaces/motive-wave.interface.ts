import { CandleDto } from 'src/dto';
import { v4 } from 'uuid';
import { ClusterPivot, ClusterWaves, Pivot, Wave } from '../types';
import { BaseWaveInterface } from './base-wave.interface';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { WaveType, Degree, Trend, WaveName, PivotType } from '../enums';
import { getHHBeforeBreak, getLLBeforeBreak } from '../class/utils';

export abstract class MotiveWaveInterface extends BaseWaveInterface {
  _waveType: WaveType;
  _degree: Degree;

  constructor(candles: CandleDto[], pivots: Pivot[], fibonacci: Fibonacci, degree: Degree, waveType: WaveType) {
    super(candles, pivots, fibonacci);
    this._waveType = waveType;
    this._degree = degree;
  }

  // Retracement and Projection Levels
  abstract find(): ClusterWaves[];

  abstract getWave2RetracementPercentages(): [number, number];
  abstract getWave3ProjectionPercentages(): [number, number];
  abstract getWave4RetracementPercentages(): [number, number];
  abstract getWave5ProjectionPercentages(): [number, number];

  getExtendedWave(): WaveName | null {
    return null;
  }

  allowWave4BreakWave1Support(): boolean {
    return false;
  }

  calculateWave5ProjectionFromWave3Lenght(): boolean {
    return false;
  }

  public get waveType(): WaveType {
    return this._waveType;
  }

  protected getImpulseWaves(): ClusterWaves[] {
    const impulseWaves: Wave[][] = this.getInitialImpulses(this.candles, this.pivots);

    const incompleteClusters = impulseWaves.filter((c) => c.length !== 5);

    const projectedClusters = incompleteClusters.map((c) => this.getProjectedWaves(c));

    const completedClusters = [...impulseWaves.filter((c) => c.length == 5), ...projectedClusters];

    const waveClusters: ClusterWaves[] = [];

    completedClusters.forEach((waves) => {
      if (this.wave3IsNotTheShortest(waves, this.fibonacci.isLogScale())) {
        waveClusters.push(new ClusterWaves(v4(), waves, this.waveType, this._degree));
      } else {
        console.log('found wave 3 shortest', this.waveType, this._degree);
      }
    });

    return waveClusters;
  }

  /*   validateWaves(waves: Wave[], useLogScale: boolean): boolean {
    if (waves.length !== 5) return false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [w1, w2, w3, w4, w5] = waves;

    const calculateRange = (start: number, end: number): number => {
      return useLogScale ? Math.abs(Math.log(end) - Math.log(start)) : Math.abs(end - start);
    };

    const rangeW1 = calculateRange(w1.pStart.price, w1.pEnd.price);
    const rangeW3 = calculateRange(w3.pStart.price, w3.pEnd.price);
    const rangeW5 = calculateRange(w5.pStart.price, w5.pEnd.price);

    // Wave 3 cannot be the shortest
    if (rangeW3 < rangeW1 && rangeW3 < rangeW5) {
      return false;
    }

    const extendedWave = this.getExtendedWave();
    if (!extendedWave) {
      return true;
    }

    if (extendedWave === WaveName._1 && rangeW1 > rangeW5 && rangeW1 > rangeW3) {
      return true;
    }

    if (extendedWave === WaveName._3 && rangeW3 > rangeW5 && rangeW3 > rangeW1) {
      return true;
    }

    if (extendedWave === WaveName._5 && rangeW5 > rangeW1 && rangeW5 > rangeW3) {
      return true;
    }

    return false;
  } */

  protected getInitialImpulses(candles: CandleDto[], pivots: Pivot[]): Wave[][] {
    const p0 = pivots[0];
    let minP1 = this.trend === Trend.UP ? -Infinity : Infinity;

    const finalWaves: Wave[][] = [];

    // Ensure index is resetted
    for (const p1 of pivots) {
      // Cannot go bellow Pivot 0
      if (this.isSupportBroken(p0, p1)) {
        break;
      }

      // Keep min Pivot 1 Price to avoid findinf new Pivot 1 with lower price
      if (this.isResistanceBroken(p1, minP1)) {
        continue;
      }

      // Update minP1 with new P1 price
      minP1 = p1.price;

      if (p1.type === p0.type) {
        continue;
      }

      // Create Wave and add to currentWaves list
      // Curent waves list is used to gather all waves in the current Pivot 1 context
      const wave1 = new Wave(v4(), WaveName._1, this._degree, p0, p1);

      const wave2Waves = this.findWaves2([[wave1]]);

      const [openWave3Waves, closedWave2Waves] = this.findWaves3(wave2Waves);
      finalWaves.push(...closedWave2Waves);

      const [openWave4Waves, closedWave3Waves] = this.findWaves4(openWave3Waves);
      finalWaves.push(...closedWave3Waves);

      const [openWave5Waves, closedWave4Waves] = this.findWaves5(openWave4Waves);

      finalWaves.push(...closedWave4Waves);
      finalWaves.push(...openWave5Waves);
    }

    return finalWaves;
  }

  protected getProjectedWaves(waves: Wave[]): Wave[] {
    if (waves.length < 2 || waves.length > 4) return waves;

    const [wave1, wave2] = waves;

    let lastWave = waves[waves.length - 1];
    const { pStart: p0, pEnd: p1 } = wave1;
    const { pEnd: p2 } = wave2;

    if (lastWave.wave === WaveName._2) {
      const [max, min] = this.getWave3ProjectionPrices(p0, p1, p2);
      const projectedPrice = min;
      const wave1Wave2Duration = p2.time - p0.time;
      const projectedTime = lastWave.pEnd.time + wave1Wave2Duration * 2.618;
      const p3 = this.buildClusterPivot(lastWave.pStart.type, projectedPrice, projectedTime);
      lastWave = new Wave(v4(), WaveName._3, lastWave.degree, lastWave.pEnd, new ClusterPivot(p3, 'PROJECTED'));
      waves.push(lastWave);
    }

    if (lastWave.wave === WaveName._3) {
      const { pEnd } = lastWave;
      const [max, min] = this.getWave4RetracementPrices(p2, pEnd);
      const projectedPrice = min;
      const wave2Duration = p2.time - p1.time;
      const projectedTime = lastWave.pEnd.time + wave2Duration * 2.618;
      const p4 = this.buildClusterPivot(lastWave.pStart.type, projectedPrice, projectedTime);
      lastWave = new Wave(v4(), WaveName._4, lastWave.degree, lastWave.pEnd, new ClusterPivot(p4, 'PROJECTED'));
      waves.push(lastWave);
    }

    if (lastWave.wave === WaveName._4) {
      const wave3 = waves[waves.length - 2];
      const { pEnd } = lastWave;
      const [max, min] = this.getWave5ProjectionPrices(p0, p1, p2, wave3.pEnd, pEnd);
      const projectedPrice = this.isSupportBroken(wave3.pEnd.price, min) ? wave3.pEnd.price : min;
      const optionalWaveDuration = this.calculateWave5ProjectionFromWave3Lenght()
        ? wave3.pEnd.time - wave3.pStart.time
        : wave1.pEnd.time - wave1.pStart.time;
      const projectedTime = lastWave.pEnd.time + (optionalWaveDuration / 2) * 0.618;
      const p5 = this.buildClusterPivot(lastWave.pStart.type, projectedPrice, projectedTime);
      lastWave = new Wave(v4(), WaveName._5, lastWave.degree, lastWave.pEnd, new ClusterPivot(p5, 'PROJECTED'));
      waves.push(lastWave);
    }

    return waves;
  }

  private buildClusterPivot(type: PivotType, price: number, time: number) {
    const pivot = new Pivot(v4(), -1, type, price, time);
    return new ClusterPivot(pivot, 'PROJECTED');
  }

  wave3IsNotTheShortest(waves: Wave[], useLogScale: boolean): boolean {
    if (waves.length !== 5) return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [w1, w2, w3, w4, w5] = waves;

    const calculateRange = (start: number, end: number): number => {
      return useLogScale ? Math.abs(Math.log(end) - Math.log(start)) : Math.abs(end - start);
    };

    const rangeW1 = calculateRange(w1.pStart.price, w1.pEnd.price);
    const rangeW3 = calculateRange(w3.pStart.price, w3.pEnd.price);
    const rangeW5 = calculateRange(w5.pStart.price, w5.pEnd.price);

    // Wave 3 cannot be the shortest
    if (rangeW3 < rangeW1 && rangeW3 < rangeW5) {
      return false;
    }

    return true;
  }

  findWaves2(inputCluster: Wave[][]): Wave[][] {
    const outputCluster: Wave[][] = [];

    for (const waves of inputCluster) {
      // Get last wave from the cluster
      const [wave1] = waves;
      const { pStart, pEnd, degree } = wave1;
      const pivots = this.getPivotsAfter(pEnd);
      const { pivot, type } = this.trend === Trend.UP ? getLLBeforeBreak(pivots, pEnd) : getHHBeforeBreak(pivots, pEnd);

      // Could not find a wave 2 so probably there was no time left
      if (!pivot) {
        continue;
      }

      const isPivotValid = this.validateWave2RetracementPercentage(
        this.fibonacci.getRetracementPercentage(pStart.price, pEnd.price, pivot.price),
      );

      if (!isPivotValid) {
        // invalid pivot regarding retracements, we will discard this cluster
        continue;
      }

      const currentWaves = [...waves];
      const pEndConnetion = currentWaves[0].pEnd;
      if (type === 'FOUND-WITH-BREAK') {
        // let confirm pivot 1 on wave 1
        pEndConnetion.confirmPivot();
      }

      const wave2 = new Wave(v4(), WaveName._2, degree, pEndConnetion, new ClusterPivot(pivot, 'WAITING'));
      currentWaves.push(wave2);

      outputCluster.push(currentWaves);
    }

    return outputCluster;
  }

  findWaves3(inputCluster: Wave[][]): [Wave[][], Wave[][]] {
    const outputClusterOpen: Wave[][] = [];
    const outputClusterClosed: Wave[][] = [];

    for (const wavesCluster of inputCluster) {
      // Get last wave from the cluster
      const [wave1, wave2] = wavesCluster;

      const wave3Pivots = this.findWave3Pivots(wave1.pStart, wave1.pEnd, wave2.pEnd);

      // When wave3Pivots is null means that there are no possible pivots 3
      if (wave3Pivots === null) {
        // discard this cluster
        continue;
      }

      if (wave3Pivots.length === 0) {
        outputClusterClosed.push(wavesCluster);
        continue;
      }

      for (const p3 of wave3Pivots) {
        const newWaveCluster = [...wavesCluster];
        const pEndConnetion = newWaveCluster[1].pEnd;
        pEndConnetion.confirmPivot();
        const wave3 = new Wave(v4(), WaveName._3, wave2.degree, pEndConnetion, new ClusterPivot(p3, 'WAITING'));
        newWaveCluster.push(wave3);
        outputClusterOpen.push(newWaveCluster);
      }
    }

    return [outputClusterOpen, outputClusterClosed];
  }

  findWaves4(inputCluster: Wave[][]): [Wave[][], Wave[][]] {
    const outputClusterOpen: Wave[][] = [];
    const outputClusterClosed: Wave[][] = [];

    for (const wavesCluster of inputCluster) {
      // Get last wave from the cluster
      const [wave1, wave2, wave3] = wavesCluster;

      const wave4Pivots = this.findWave4Pivots(wave1.pEnd, wave2.pEnd, wave3.pEnd);

      // When wave3Pivots is null means that there are no possible pivots 3
      if (wave4Pivots === null) {
        // discard this cluster
        continue;
      }

      if (wave4Pivots.length === 0) {
        outputClusterClosed.push(wavesCluster);
        continue;
      }

      for (const p4 of wave4Pivots) {
        const newWaveCluster = [...wavesCluster];
        const pEndConnetion = newWaveCluster[2].pEnd;
        pEndConnetion.confirmPivot();
        const wave4 = new Wave(v4(), WaveName._4, wave3.degree, pEndConnetion, new ClusterPivot(p4, 'WAITING'));
        newWaveCluster.push(wave4);
        outputClusterOpen.push(newWaveCluster);
      }
    }

    return [outputClusterOpen, outputClusterClosed];
  }

  findWaves5(inputCluster: Wave[][]): [Wave[][], Wave[][]] {
    const outputClusterOpen: Wave[][] = [];
    const outputClusterClosed: Wave[][] = [];

    for (const wavesCluster of inputCluster) {
      // Get last wave from the cluster
      const [wave1, wave2, wave3, wave4] = wavesCluster;

      const wave5Pivots = this.useTargetPivot()
        ? [this.targetPivot!]
        : this.findWave5Pivots(wave1.pStart, wave1.pEnd, wave2.pEnd, wave3.pEnd, wave4.pEnd);

      // When wave5Pivots is null means that there are no possible pivots 5
      if (wave5Pivots === null) {
        // discard this cluster
        continue;
      }

      if (wave5Pivots.length === 0) {
        outputClusterClosed.push(wavesCluster);
        continue;
      }

      for (const p5 of wave5Pivots) {
        const newWaveCluster = [...wavesCluster];
        const pEndConnetion = newWaveCluster[3].pEnd;
        pEndConnetion.confirmPivot();
        const wave5 = new Wave(v4(), WaveName._5, wave4.degree, pEndConnetion, new ClusterPivot(p5, 'WAITING'));
        newWaveCluster.push(wave5);
        outputClusterOpen.push(newWaveCluster);
      }
    }

    return [outputClusterOpen, outputClusterClosed];
  }

  /**
   * Find Wave 3 second Pivot
   *
   * Response
   * - null - means support is broken and there was no wave 3 candidate, so wave 2 is invalid
   * - Pivot[]  - when empty means that pivot 3 should be projected
   *
   * @param p0
   * @param p1
   * @param p2
   * @returns
   */
  findWave3Pivots(p0: Pivot, p1: Pivot, p2: Pivot): Pivot[] | null {
    const results: Pivot[] = [];
    const pivots = this.getPivotsAfter(p2);
    let minP3 = this.trend === Trend.UP ? -Infinity : Infinity;
    const [maxPrice, minPrice] = this.getWave3ProjectionPrices(p0, p1, p2);
    for (const p of pivots) {
      // Stop if P2 support is broken
      if (this.isSupportBroken(p2, p.price)) {
        // Invalid Wave 3
        if (results.length === 0) {
          return null;
        }
        break;
      }

      // Stop when max expected price is reached and return what ever we have
      if (this.isResistanceBroken(maxPrice, p)) {
        // Invalid Wave 3
        if (results.length === 0) {
          return null;
        }
        break;
      }

      // Keep min Pivot 3 Price to avoid find new Pivot 3 with lower price
      if (this.isResistanceBroken(p, minP3)) {
        continue;
      }

      // Update minP3 with new P3 price
      minP3 = p.price;

      // Continue if we are bellow p1
      if (!this.isResistanceBroken(p1, p.price)) {
        continue;
      }

      // P3 should be same type as P1
      if (p.type !== p1.type) {
        continue;
      }

      if (this.isValidRange(maxPrice, minPrice, p.price)) {
        results.push(p);
      }
    }

    return results;
  }

  /**
   * Find Wave 4 second Pivot
   *
   * Response
   * - null - means support is broken and there was no wave 4 candidate, so wave 3 is invalid
   * - Pivot[]  - when empty means that pivot 4 should be projected
   *
   * @param p1
   * @param p2
   * @param p3
   * @returns
   */
  findWave4Pivots(p1: Pivot, p2: Pivot, p3: Pivot): Pivot[] | null {
    const pivots = this.getPivotsAfter(p3);

    const { pivot: p } = this.trend === Trend.UP ? getLLBeforeBreak(pivots, p3) : getHHBeforeBreak(pivots, p3);
    if (!p) {
      return [];
    }

    if (!this.allowWave4BreakWave1Support() && this.isSupportBroken(p1, p.price)) {
      return null;
    }

    if (this.isSupportBroken(p2, p.price)) {
      return null;
    }

    const isValid = this.validateWave4RetracementPercentage(this.fibonacci.getRetracementPercentage(p2.price, p3.price, p.price));

    if (!isValid) {
      return null;
    }

    return [p];
  }

  /**
   * Find Wave 5 second Pivot
   *
   * Response
   * - null - means support is broken and there was no wave 5 candidate, so wave 4 is invalid
   * - Pivot[]  - when empty means that pivot 5 should be projected
   *
   * @param p0
   * @param p1
   * @param p2
   * @param p3
   * @param p4
   * @returns
   */
  findWave5Pivots(p0: Pivot, p1: Pivot, p2: Pivot, p3: Pivot, p4: Pivot): Pivot[] | null {
    const results: Pivot[] = [];
    const pivots = this.getPivotsAfter(p4);
    let minP5 = this.trend === Trend.UP ? -Infinity : Infinity;
    const [maxPrice, minPrice] = this.getWave5ProjectionPrices(p0, p1, p2, p3, p4);
    for (const p of pivots) {
      // Stop if P4 support is broken
      if (this.isSupportBroken(p4, p.price)) {
        // Invalid Wave 5
        if (results.length === 0) {
          return null;
        }
        break;
      }

      // Stop when max expected price is reached and return what ever we have
      if (this.isResistanceBroken(maxPrice, p)) {
        if (results.length === 0) {
          return null;
        }
        break;
      }

      // Keep min Pivot 5 Price to avoid find new Pivot 5 with lower price
      if (this.isResistanceBroken(p, minP5)) {
        continue;
      }

      // Update minP5 with new P5 price
      minP5 = p.price;

      // Continue if we are bellow p3
      if (!this.isResistanceBroken(p3, p.price)) {
        continue;
      }

      // P5 should be same type as P3
      if (p.type !== p3.type) {
        continue;
      }

      if (this.isValidRange(maxPrice, minPrice, p.price)) {
        const testPivots = this.getPivotsAfter(p);
        // Check if we have a possible new wave 2
        const { pivot: testPivot, type } = this.trend === Trend.UP ? getLLBeforeBreak(testPivots, p) : getHHBeforeBreak(testPivots, p);
        if (!testPivot || type === 'NOT-FOUND' || type === 'FOUND-NO-BREAK') {
          results.push(p);
          continue;
        }

        const retracementWave1 = this.fibonacci.getRetracementPercentage(p0.price, p.price, testPivot.price);
        const retracementWave4 = this.fibonacci.getRetracementPercentage(p4.price, p.price, testPivot.price);

        console.log('retracement ', retracementWave1, retracementWave4);
        // Min retracement to consider a wave 1 8%
        if (retracementWave1 > 10 && retracementWave4 > 50) {
          results.push(p);
        }
      }
    }

    return results;
  }

  isValidRange(max: number, min: number, check: number): boolean {
    if (max >= min) return check >= min && check <= max;
    return check >= max && check <= min;
  }

  getWave2RetracementPrices(p0: Pivot, p1: Pivot): [number, number] {
    const [min, max] = this.getWave2RetracementPercentages();
    const pMax = this.fibonacci.getRetracementPrice(p0.price, p1.price, max);
    const pMin = this.fibonacci.getRetracementPrice(p0.price, p1.price, min);
    return [pMax, pMin];
  }

  getWave3ProjectionPrices(p0: Pivot, p1: Pivot, p2: Pivot): [number, number] {
    const [min, max] = this.getWave3ProjectionPercentages();
    const pMax = this.fibonacci.getProjectionPrice(p0.price, p1.price, p2.price, max);
    const pMin = this.fibonacci.getProjectionPrice(p0.price, p1.price, p2.price, min);
    return [pMax, pMin];
  }

  getWave4RetracementPrices(p2: Pivot, p3: Pivot): [number, number] {
    const [min, max] = this.getWave4RetracementPercentages();
    const pMax = this.fibonacci.getRetracementPrice(p2.price, p3.price, max);
    const pMin = this.fibonacci.getRetracementPrice(p2.price, p3.price, min);
    return [pMax, pMin];
  }

  getWave5ProjectionPrices(p0: Pivot, p1: Pivot, p2: Pivot, p3: Pivot, p4: Pivot): [number, number] {
    const [min, max] = this.getWave5ProjectionPercentages();

    const useAlternativePivots = this.calculateWave5ProjectionFromWave3Lenght();
    const pStart = useAlternativePivots ? p2 : p0;
    const pEnd = useAlternativePivots ? p3 : p1;
    const pMax = this.fibonacci.getProjectionPrice(pStart.price, pEnd.price, p4.price, max);
    const pMin = this.fibonacci.getProjectionPrice(pStart.price, pEnd.price, p4.price, min);
    return [pMax, pMin];
  }

  validateWave2RetracementPercentage(percentage: number): boolean {
    const [min, max] = this.getWave2RetracementPercentages();
    return percentage >= min && percentage <= max;
  }
  validateWave3ProjectionPercentage(percentage: number): boolean {
    const [min, max] = this.getWave3ProjectionPercentages();
    return percentage >= min && percentage <= max;
  }
  validateWave4RetracementPercentage(percentage: number): boolean {
    const [min, max] = this.getWave4RetracementPercentages();
    return percentage >= min && percentage <= max;
  }
  validateWave5ProjectionPercentage(percentage: number): boolean {
    const [min, max] = this.getWave5ProjectionPercentages();
    return percentage >= min && percentage <= max;
  }

  checkTimeToComplete(startPivot: Pivot, endPivot: Pivot, fromPivot: Pivot): boolean {
    const remainingCandles = this.getRemainingCandlesAfter(fromPivot);
    const consumedCandles = endPivot.candleIndex - startPivot.candleIndex;
    return remainingCandles > consumedCandles;
  }
}
