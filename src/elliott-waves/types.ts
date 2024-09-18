import { Pivot } from './class';
import { WaveDegreeNode } from './class/utils';
import { WaveScore, WaveType } from './enums';

export interface ScoreRange {
  range: [number, number];
  score: WaveScore;
}

export interface ScoreRangeValue {
  value: number;
  score: number;
}

export interface WaveInfoResult {
  time?: ScoreRangeValue | undefined;
  retracement?: ScoreRangeValue | undefined;
  projection?: ScoreRangeValue | undefined;
}

export interface WaveInfo {
  waveType: WaveType;
  degree: WaveDegreeNode;
  score: {
    total: number;
    wave: number;
    time: number;
    structure: number;
  };
  isValid: {
    wave: boolean;
    time: boolean;
    structure: boolean;
    channel: boolean;
  };
  wave2: WaveInfoResult;
  wave3: WaveInfoResult;
  wave4: WaveInfoResult;
  wave5: WaveInfoResult;
}

export interface WaveConfigResult {
  time?: ScoreRange[];
  retracement?: ScoreRange[];
  projection?: ScoreRange[];
  deepRetracement?: ScoreRange[];
}

export interface WaveConfig {
  waveType: WaveType;
  allowWave4Break: boolean;
  wave2: WaveConfigResult;
  wave3: WaveConfigResult;
  wave4: WaveConfigResult;
  wave5: WaveConfigResult;
}

export interface WavesConfig {
  base: {
    retracements: ScoreRange[];
    projections: ScoreRange[];
    time: ScoreRange[];
  };
  waveConfigs: WaveConfig[];
}

export interface GeneralConfig {
  waves: WavesConfig;
  degree: WaveDegreeNode[];
}

export type PivotStatus = 'CONFIRMED' | 'WAITING' | 'PROJECTED';

export interface CandlesInfo {
  degree: {
    title: string;
    value: number;
  };
  pivots: Pivot[];
  retracements: Pivot[];
}

export type PivotTestType = 'FOUND-NO-BREAK' | 'FOUND-WITH-BREAK' | 'NOT-FOUND-NO-BREAK' | 'NOT-FOUND-WITH-BREAK';

export interface PivotTest {
  pivot: Pivot | null;
  type: PivotTestType;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi: number;
  stochastic: number;
}
