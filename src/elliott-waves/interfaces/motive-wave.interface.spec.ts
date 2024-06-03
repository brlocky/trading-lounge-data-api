import { MotiveWaveInterface } from '../interfaces/motive-wave.interface';
import { Pivot, ClusterWaves } from '../types';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { Degree, WaveType } from '../enums';
import { CandleDto } from 'src/search/dto';

class ConcreteMotiveWave extends MotiveWaveInterface {
  find(): ClusterWaves[] {
    // Provide a simple implementation for testing purposes
    return [];
  }

  getWave2RetracementPercentages(): [number, number, number] {
    return [14.2, 61.8, 99.9];
  }

  getWave3ProjectionPercentages(): [number, number, number] {
    return [138.2, 161.8, 261.8];
  }

  getWave4RetracementPercentages(): [number, number, number] {
    return [14.2, 38.2, 50];
  }

  getWave5ProjectionPercentages(): [number, number, number] {
    return [38.2, 61.8, 161.8];
  }
}

describe('MotiveWaveInterface', () => {
  let candles: CandleDto[];
  let pivots: Pivot[];
  const fibonacci: Fibonacci = new Fibonacci();
  let motiveWave: MotiveWaveInterface;

  beforeEach(() => {
    candles = [
      // Mock candle data
      { open: 1, high: 2, low: 0.5, close: 1.5, volume: 1000 },
      { open: 1.5, high: 3, low: 1, close: 2, volume: 1000 },
      { open: 2, high: 4, low: 1.5, close: 3.5, volume: 1000 },
      // Add more candles as needed
    ] as CandleDto[];

    motiveWave = new ConcreteMotiveWave(candles, pivots, fibonacci, Degree.PRIMARY, WaveType.MOTIVE);
  });

  it('should initialize with correct wave type and degree', () => {
    expect(motiveWave._waveType).toBe(WaveType.MOTIVE);
    expect(motiveWave._degree).toBe(Degree.PRIMARY);
  });

  it('should return true when check value is in range', () => {
    let validation = motiveWave.isValidRange(100, 200, 150);
    expect(validation).toBe(true);

    validation = motiveWave.isValidRange(200, 100, 150);
    expect(validation).toBe(true);

    validation = motiveWave.isValidRange(200, 100, 90);
    expect(validation).toBe(false);
    validation = motiveWave.isValidRange(200, 100, 210);
    expect(validation).toBe(false);
  });

  it('should return correct retracement percentages for Wave 2', () => {
    const [min, max] = motiveWave.getWave2RetracementPercentages();
    expect(min).toBe(50);
    expect(max).toBe(61.8);
  });

  it('should return correct projection percentages for Wave 3', () => {
    const [min, max] = motiveWave.getWave3ProjectionPercentages();
    expect(min).toBe(161.8);
    expect(max).toBe(261.8);
  });

  it('should validate Wave 2 retracement correctly', () => {
    const isValid = motiveWave.validateWave2RetracementPercentage(55);
    expect(isValid).toBe(true);
  });

  it('should invalidate incorrect Wave 2 retracement', () => {
    const isValid = motiveWave.validateWave2RetracementPercentage(45);
    expect(isValid).toBe(false);
  });

  it('should validate Wave 3 projection correctly', () => {
    const isValid = motiveWave.validateWave3ProjectionPercentage(200);
    expect(isValid).toBe(true);
  });

  it('should invalidate incorrect Wave 3 projection', () => {
    const isValid = motiveWave.validateWave3ProjectionPercentage(300);
    expect(isValid).toBe(false);
  });
});
