import { Injectable } from '@nestjs/common';
import { decreaseDegree, WaveDegree, WaveName, WaveType } from '../enums';
import { Pivot, Wave } from '.';
import { CandleService, ChartService, WaveInfoService } from '../services';
import moment from 'moment';
import { Candle } from '../types';

interface WaveSequence {
  waves: LocalWave[];
  startIndex: number;
  endIndex: number;
  degree: WaveDegree;
  type: WaveType;
  score: number;
}

interface LocalWave {
  startPivot: Pivot;
  endPivot: Pivot;
  name: WaveName;
  subwaves?: WaveSequence;
}

@Injectable()
export class ElliottWaveAnalyzer {
  private candles: Candle[];
  private pivots: Pivot[];
  private windowSize: number;
  private candleService: CandleService;
  private waveInfoService: WaveInfoService;
  private chartService: ChartService;

  constructor(candleService: CandleService, waveInfoService: WaveInfoService, chartService: ChartService) {
    this.candleService = candleService;
    this.waveInfoService = waveInfoService;
    this.chartService = chartService;
    this.windowSize = 10; // Default value, can be adjusted
  }

  analyzeCandles(candles: Candle[], degree: WaveDegree): WaveSequence[] {
    this.candles = candles;
    this.pivots = this.candleService.getZigZag(this.candles);

    this.chartService.createCandlestickChart(candles, this.pivots, 'z_ElliottWaveAnalyzer_analyzeCandles.jpg');

    return this.analyzeWaves();
  }

  private analyzeWaves(): WaveSequence[] {
    const allSequences: WaveSequence[] = [];
    let windowStart = 0;

    const logWindow = (pivots: Pivot[]): void => {
      const start = pivots[0];
      const end = pivots[pivots.length - 1];

      const dateStart = moment(start.time * 1000).toString();
      const dateEnd = moment(end.time * 1000).toString();
      console.log('logWindow ', dateStart, start.price, dateEnd, end.price);
    };

    while (windowStart < this.pivots.length) {
      const currentWindowSize = Math.min(this.pivots.length - windowStart, this.windowSize);
      const windowPivots = this.pivots.slice(windowStart, windowStart + currentWindowSize);

      logWindow(windowPivots);
      // build wave 1 and add to the array, next steps will find more waves on the current cluster of waveprogression

      const sequences = this.findWaveSequences(windowPivots);
      allSequences.push(...sequences);

      windowStart += currentWindowSize;
    }

    return this.mergeOverlappingSequences(allSequences);
  }

  private findWaveSequences(pivots: Pivot[]): WaveSequence[] {
    const sequences: WaveSequence[] = [];

    for (let i = 0; i < pivots.length - 4; i++) {
      const potentialSequence = this.buildWaveSequence(pivots.slice(i));
      if (potentialSequence && this.validateWaveSequence(potentialSequence)) {
        sequences.push(potentialSequence);

        const nestedSequences = this.findNestedWaves(potentialSequence);
        sequences.push(...nestedSequences);
      }
    }

    return sequences;
  }

  private buildWaveSequence(pivots: Pivot[]): WaveSequence | null {
    if (pivots.length < 5) return null;

    const sequence: WaveSequence = {
      waves: [],
      startIndex: pivots[0].candleIndex,
      endIndex: pivots[4].candleIndex,
      degree: WaveDegree.MINUETTE,
      type: WaveType.UNKNOWN,
      score: 0,
    };

    for (let i = 0; i < 4; i++) {
      const wave: LocalWave = {
        startPivot: pivots[i],
        endPivot: pivots[i + 1],
        name: WaveName[`_${i + 1}` as keyof typeof WaveName],
      };
      sequence.waves.push(wave);
    }

    return sequence;
  }

  private convertLocalWaveToWave(waves: LocalWave[]): Wave[] {
    return waves.map((wave) => new Wave(wave.name, WaveDegree.CYCLE, wave.startPivot, wave.endPivot));
  }

  private validateWaveSequence(sequence: WaveSequence): boolean {
    const [wave1, wave2, wave3, wave4, wave5] = this.convertLocalWaveToWave(sequence.waves);
    const infos = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, false, 0);
    const validInfo = infos.find((i) => i.isValid.structure && i.isValid.wave);

    if (validInfo) {
      sequence.type = validInfo.waveType;
      sequence.score = this.calculateSequenceScore(validInfo);
      return true;
    }

    return false;
  }

  private calculateSequenceScore(waveInfo: any): number {
    // Calculate a score based on wave, structure, and time validity
    const waveScore = waveInfo.score.wave * 0.4;
    const structureScore = waveInfo.score.structure * 0.4;
    const timeScore = waveInfo.score.time * 0.2;
    return waveScore + structureScore + timeScore;
  }

  private findNestedWaves(sequence: WaveSequence): WaveSequence[] {
    const nestedSequences: WaveSequence[] = [];

    for (const wave of sequence.waves) {
      if (wave.startPivot.candleIndex + 4 <= wave.endPivot.candleIndex) {
        const wavePivots = this.pivots.slice(wave.startPivot.candleIndex, wave.endPivot.candleIndex + 1);
        const nestedSequence = this.buildWaveSequence(wavePivots);
        if (nestedSequence && this.validateWaveSequence(nestedSequence)) {
          nestedSequence.degree = decreaseDegree(sequence.degree);
          nestedSequences.push(nestedSequence);
        }
      }
    }

    return nestedSequences;
  }

  private mergeOverlappingSequences(sequences: WaveSequence[]): WaveSequence[] {
    sequences.sort((a, b) => a.startIndex - b.startIndex);

    const mergedSequences: WaveSequence[] = [];
    for (const sequence of sequences) {
      if (mergedSequences.length === 0) {
        mergedSequences.push(sequence);
      } else {
        const lastMerged = mergedSequences[mergedSequences.length - 1];
        if (sequence.startIndex <= lastMerged.endIndex) {
          this.mergeSequences(lastMerged, sequence);
        } else {
          mergedSequences.push(sequence);
        }
      }
    }

    return mergedSequences;
  }

  private mergeSequences(seq1: WaveSequence, seq2: WaveSequence): void {
    seq1.endIndex = Math.max(seq1.endIndex, seq2.endIndex);
    seq1.waves = this.mergeWaves(seq1.waves, seq2.waves);

    // Update score and type based on the merged waves
    const [wave1, wave2, wave3, wave4, wave5] = this.convertLocalWaveToWave(seq1.waves);
    const infos = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, false, 0);

    interface BestInfoAccumulator {
      score: number;
      waveType?: WaveType;
      isValid: {
        wave: boolean;
        time: boolean;
        structure: boolean;
      };
    }

    const bestInfo = infos.reduce<BestInfoAccumulator>(
      (best, current) => {
        const currentScore = this.calculateSequenceScore(current);
        return currentScore > best.score
          ? {
              score: currentScore,
              waveType: current.waveType,
              isValid: current.isValid,
            }
          : best;
      },
      { score: -1, isValid: { wave: false, time: false, structure: false } },
    );

    if (bestInfo.score > -1 && bestInfo.waveType) {
      seq1.type = bestInfo.waveType;
      seq1.score = bestInfo.score;
    } else {
      // Handle the case when no valid info is found
      seq1.type = WaveType.UNKNOWN;
      seq1.score = 0;
    }
  }

  private mergeWaves(waves1: LocalWave[], waves2: LocalWave[]): LocalWave[] {
    const mergedWaves: LocalWave[] = [];
    let i = 0,
      j = 0;

    while (i < waves1.length && j < waves2.length) {
      if (waves1[i].startPivot.candleIndex <= waves2[j].startPivot.candleIndex) {
        mergedWaves.push(waves1[i]);
        i++;
      } else {
        mergedWaves.push(waves2[j]);
        j++;
      }
    }

    // Add remaining waves
    mergedWaves.push(...waves1.slice(i));
    mergedWaves.push(...waves2.slice(j));

    // Remove duplicates and ensure proper order
    return this.removeDuplicateWaves(mergedWaves).sort((a, b) => a.startPivot.candleIndex - b.startPivot.candleIndex);
  }

  private removeDuplicateWaves(waves: LocalWave[]): LocalWave[] {
    return waves.filter(
      (wave, index, self) =>
        index ===
        self.findIndex(
          (t) => t.startPivot.candleIndex === wave.startPivot.candleIndex && t.endPivot.candleIndex === wave.endPivot.candleIndex,
        ),
    );
  }
}
