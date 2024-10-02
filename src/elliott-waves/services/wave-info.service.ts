import { Injectable } from '@nestjs/common';
import { ClusterWaves, Wave } from '../class';
import { WaveDegreeCalculator } from '../class/utils';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { WaveScore, WaveType } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { WaveInfo, WavesConfig } from '../types';
import { MotiveContractingDiagonal, MotiveExpandingDiagonal, MotiveExtended1, MotiveExtended3, MotiveExtended5 } from '../waves';
import { ChannelValidationService } from './channel-validation.service';

@Injectable()
export class WaveInfoService {
  protected fibonacci: Fibonacci;
  protected channelService: ChannelValidationService;
  protected patterns: MotiveInterface[];

  constructor() {
    this.fibonacci = new Fibonacci();
    this.patterns = [
      //new MotiveExtended1(),
      new MotiveExtended3(),
      //new MotiveExtended5(),
      new MotiveContractingDiagonal(),
      new MotiveExpandingDiagonal(),
    ];
    this.channelService = new ChannelValidationService();
  }

  getWavesConfig(): WavesConfig {
    const waveConfigs = this.patterns.map((p) => p.getWaveConfig());

    const baseModel = this.patterns[0];
    return {
      base: {
        retracements: baseModel.getDefaultRetracementRange(),
        projections: baseModel.getDefaultProjectionRange(),
        time: baseModel.getDefaultTimeRange(),
      },
      waveConfigs,
    };
  }

  getWaveClusterInformation(cluster: ClusterWaves, useLogScale = false, commonInterval: number): WaveInfo[] {
    const [wave1, wave2, wave3, wave4, wave5] = cluster.waves;
    return this.getWaveInformation(wave1, wave2, wave3, wave4, wave5, useLogScale, commonInterval);
  }

  getWaveInformation(
    wave1: Wave,
    wave2: Wave,
    wave3: Wave | null = null,
    wave4: Wave | null = null,
    wave5: Wave | null = null,
    useLogScale = true,
    commonInterval: number,
  ): WaveInfo[] {
    if (!wave3 || !wave4) return [];

    const isWave1Broken = (wave1: Wave, wave4: Wave): boolean => {
      const upTrend = wave1.pStart.price < wave1.pEnd.price;

      return upTrend ? wave1.pEnd.price > wave4.pEnd.price : wave1.pEnd.price < wave4.pEnd.price;
    };

    const wavesInfo: WaveInfo[] = [];
    for (const p of this.patterns) {
      const validWave = p.allowWave4Overlap() ? true : !isWave1Broken(wave1, wave4);

      if (!validWave) {
        continue;
      }

      const retracementWave2 = p.calculateWave2Retracement(wave1, wave2, useLogScale);
      let wave2Validation = p.validateWave2Retracement(retracementWave2);
      if (!wave2Validation) {
        const valueRetracement = this.fibonacci.calculatePercentageDecrease(wave1.pEnd.price, wave2.pEnd.price);
        wave2Validation = p.validateWave2Retracement(valueRetracement);
      }

      const projectionWave3 = p.calculateWave3Projection(wave1, wave2, wave3, useLogScale);
      const wave3Validation = p.validateWave3Projection(projectionWave3);

      const retracementWave4 = p.calculateWave4Retracement(wave3, wave4, useLogScale);
      // Wave 4 Alternation to wave 1
      let wave4Validation =
        retracementWave2 <= 50 ? p.validateWave4DeepRetracement(retracementWave4) : p.validateWave4Retracement(retracementWave4);

      if (!wave4Validation) {
        const valueRetracement = this.fibonacci.calculatePercentageDecrease(wave3.pEnd.price, wave4.pEnd.price);
        wave4Validation =
          retracementWave2 <= 50 ? p.validateWave4DeepRetracement(valueRetracement) : p.validateWave4Retracement(valueRetracement);
      }

      let projectionWave5 = 0;
      let wave5Validation = WaveScore.INVALID;
      if (wave5) {
        projectionWave5 = p.calculateWave5Projection(wave1, wave2, wave3, wave4, wave5, useLogScale);
        wave5Validation = p.validateWave5Projection(projectionWave5);
      }

      const projectionTimeWave2 = p.calculateTimeRetracement(wave1, wave2, commonInterval);
      const wave2TimeValidation = p.validateWave2Time(projectionTimeWave2);

      const projectionTimeWave3 = p.calculateTimeRetracement(wave1, wave3, commonInterval);
      const wave3TimeValidation = p.validateWave3Time(projectionTimeWave3);

      const projectionTimeWave4 = p.calculateTimeRetracement(wave2, wave4, commonInterval);
      const wave4TimeValidation =
        projectionTimeWave2 > 100 ? p.validateWave4DeepTime(projectionTimeWave4) : p.validateWave4Time(projectionTimeWave4);

      let projectionTimeWave5: number | null = 0;
      let wave5TimeValidation = WaveScore.INVALID;
      if (wave5) {
        projectionTimeWave5 = p.calculateWave5ProjectionTime(wave1, wave2, wave3, wave4, wave5, commonInterval);
        wave5TimeValidation = p.validateWave5Time(projectionTimeWave5);
      }

      // Calculate overall scores
      const waveScore = wave5
        ? (wave2Validation + wave3Validation + wave4Validation + wave5Validation) / 4
        : (wave2Validation + wave3Validation + wave4Validation) / 3;

      const timeScore = wave5
        ? (wave2TimeValidation + wave3TimeValidation + wave4TimeValidation + wave5TimeValidation) / 4
        : (wave2TimeValidation + wave3TimeValidation + wave4TimeValidation) / 3;

      const isStructureValid = wave5 ? p.validateWaveStructure(wave1, wave2, wave3, wave4, wave5, useLogScale) : false;

      const structureScore = isStructureValid ? WaveScore.PERFECT : WaveScore.INVALID;
      // Determine validity
      const isWaveValid =
        wave2Validation !== WaveScore.INVALID &&
        wave3Validation !== WaveScore.INVALID &&
        wave4Validation !== WaveScore.INVALID &&
        (!wave5 || wave5Validation !== WaveScore.INVALID);

      /*       const isTimeValid =
        wave2TimeValidation !== WaveScore.INVALID &&
        wave3TimeValidation !== WaveScore.INVALID &&
        wave4TimeValidation !== WaveScore.INVALID &&
        (!wave5 || wave5TimeValidation !== WaveScore.INVALID); */
      const isTimeValid = wave4TimeValidation !== WaveScore.INVALID;
      const expectedWaveDegree = wave5
        ? WaveDegreeCalculator.calculateWaveDegreeFromCandles([wave1.pStart, wave5.pEnd])
        : WaveDegreeCalculator.calculateWaveDegreeFromCandles([wave1.pStart, wave1.pEnd], 'wave1');

      const channelScore: WaveScore = wave5 ? p.validateChannel([wave1, wave2, wave3, wave4, wave5], useLogScale) : WaveScore.INVALID;
      const isChannelValid = channelScore !== WaveScore.INVALID;
      const waveInfo: WaveInfo = {
        waveType: p.getWaveType(),
        degree: expectedWaveDegree,
        score: {
          total: waveScore + timeScore + structureScore + channelScore,
          wave: waveScore,
          time: timeScore,
          structure: structureScore,
          channel: channelScore,
        },
        isValid: {
          wave: isWaveValid,
          time: isTimeValid,
          structure: isStructureValid && isChannelValid && isTimeValid,
          channel: isChannelValid,
        },
        wave2: {
          time: {
            value: projectionTimeWave2 || 0,
            score: wave2TimeValidation,
          },
          retracement: {
            value: retracementWave2,
            score: wave2Validation,
          },
        },
        wave3: {
          time: {
            value: projectionTimeWave3 || 0,
            score: wave3TimeValidation,
          },
          projection: {
            value: projectionWave3,
            score: wave3Validation,
          },
        },
        wave4: {
          time: {
            value: projectionTimeWave4 || 0,
            score: wave4TimeValidation,
          },
          retracement: {
            value: retracementWave4,
            score: wave4Validation,
          },
        },
        wave5: {
          time: {
            value: projectionTimeWave5 || 0,
            score: wave5TimeValidation,
          },
          projection: {
            value: projectionWave5,
            score: wave5Validation,
          },
        },
      };

      wavesInfo.push(waveInfo);
    }

    return this.sortWaveInfoArray(wavesInfo);
  }

  private sortWaveInfoArray(array: WaveInfo[]) {
    return array.sort((a, b) => {
      // Sorting by isValid (structure, wave, time)
      if (a.isValid.structure !== b.isValid.structure) return a.isValid.structure ? -1 : 1;
      if (a.isValid.wave !== b.isValid.wave) return a.isValid.wave ? -1 : 1;
      if (a.isValid.channel !== b.isValid.channel) return a.isValid.channel ? -1 : 1;
      if (a.isValid.time !== b.isValid.time) return a.isValid.time ? -1 : 1;

      // Sorting by score (structure, wave, time)
      if (a.score.total !== b.score.total) return b.score.total - a.score.total;

      return 0;
    });
  }
}
