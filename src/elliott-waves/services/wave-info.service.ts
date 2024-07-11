import { Injectable } from '@nestjs/common';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { WaveScore } from '../enums';
import { MotiveInterface } from '../interfaces/motive.interface';
import { Wave, WaveInfo, WavesConfig } from '../types';
import { MotiveExtended1, MotiveExtended3, MotiveExtended5, MotiveContractingDiagonal, MotiveExpandingDiagonal } from '../waves';

@Injectable()
export class WaveInfoService {
  protected fibonacci: Fibonacci;
  protected patterns: MotiveInterface[];

  constructor() {
    this.fibonacci = new Fibonacci();
    this.patterns = [
      new MotiveExtended1(),
      new MotiveExtended3(),
      new MotiveExtended5(),
      new MotiveContractingDiagonal(),
      new MotiveExpandingDiagonal(),
    ];
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

  getWaveInformation(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave | null = null, useLogScale = true): WaveInfo[] {
    const getWavesTimePercentage = (waveA: Wave, waveB: Wave): number => {
      const time1 = waveA.pEnd.time - waveA.pStart.time;
      const time2 = waveB.pEnd.time - waveB.pStart.time;
      if (time1 == 0 || time2 === 0) {
        console.log('Get time retracement, missing candles to validate time diff');
        return 0;
      }
      return (time2 / time1) * 100;
    };

    const isWave1Broken = (wave1: Wave, wave4: Wave): boolean => {
      const upTrend = !!(wave1.pStart.price < wave2.pEnd.price);

      return upTrend ? wave1.pEnd.price > wave4.pEnd.price : wave1.pEnd.price < wave4.pEnd.price;
    };

    const wavesInfo: WaveInfo[] = [];
    for (const p of this.patterns) {
      const validWave = p.allowWave4Overlap() ? true : !isWave1Broken(wave1, wave4);

      if (!validWave) {
        continue;
      }

      const retracementWave2 = p.calculateWave2Retracement(wave1, wave2, useLogScale);
      const wave2Validation = p.validateWave2Retracement(retracementWave2);

      const projectionWave3 = p.calculateWave3Projection(wave1, wave2, wave3, useLogScale);
      const wave3Validation = p.validateWave3Projection(projectionWave3);

      const retracementWave4 = p.calculateWave4Retracement(wave3, wave4, useLogScale);

      // Wave 4 Alternation to wave 1
      const wave4Validation =
        retracementWave2 <= 50 ? p.validateWave4DeepRetracement(retracementWave4) : p.validateWave4Retracement(retracementWave4);

      let projectionWave5 = 0;
      let wave5Validation = WaveScore.INVALID;
      if (wave5) {
        projectionWave5 = p.calculateWave5Projection(wave1, wave2, wave3, wave4, wave5, useLogScale);
        wave5Validation = p.validateWave5Projection(projectionWave5);
      }

      const projectionTimeWave2 = getWavesTimePercentage(wave1, wave2);
      const wave2TimeValidation = p.validateWave2Time(projectionTimeWave2);

      const projectionTimeWave3 = getWavesTimePercentage(wave1, wave3);
      const wave3TimeValidation = p.validateWave3Time(projectionTimeWave3);

      const projectionTimeWave4 = getWavesTimePercentage(wave2, wave4);
      const wave4TimeValidation =
        projectionTimeWave2 > 100 ? p.validateWave4DeepTime(projectionTimeWave4) : p.validateWave4Time(projectionTimeWave4);

      let projectionTimeWave5: number | null = 0;
      let wave5TimeValidation = WaveScore.INVALID;
      if (wave5) {
        projectionTimeWave5 = getWavesTimePercentage(wave3, wave5);
        wave5TimeValidation = p.validateWave5Time(projectionTimeWave5);
      }

      // Calculate overall scores
      const waveScore = wave5
        ? (wave2Validation + wave3Validation + wave4Validation + wave5Validation) / 4
        : (wave2Validation + wave3Validation + wave4Validation) / 3;

      const timeScore = wave5
        ? (wave2TimeValidation + wave3TimeValidation + wave4TimeValidation + wave5TimeValidation) / 4
        : (wave2TimeValidation + wave3TimeValidation + wave4TimeValidation) / 3;

      // Determine validity
      const isWaveValid =
        wave2Validation !== WaveScore.INVALID &&
        wave3Validation !== WaveScore.INVALID &&
        wave4Validation !== WaveScore.INVALID &&
        (!wave5 || wave5Validation !== WaveScore.INVALID);

      const isTimeValid =
        wave2TimeValidation !== WaveScore.INVALID &&
        wave3TimeValidation !== WaveScore.INVALID &&
        wave4TimeValidation !== WaveScore.INVALID &&
        (!wave5 || wave5TimeValidation !== WaveScore.INVALID);

      const isStructureValid = wave5 ? p.validateWaveStructure(wave1, wave2, wave3, wave4, wave5, useLogScale) : false;
      const waveInfo: WaveInfo = {
        waveType: p.getWaveType(),
        score: {
          wave: waveScore,
          time: timeScore,
          structure: isStructureValid ? WaveScore.PERFECT : WaveScore.INVALID,
        },
        isValid: {
          wave: isWaveValid,
          time: isTimeValid,
          structure: isStructureValid,
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

    return wavesInfo;
  }
}
