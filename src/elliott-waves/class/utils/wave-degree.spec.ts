import { WaveDegree } from 'src/elliott-waves/enums';
import { WaveDegreeCalculator } from './wave-degree.class';

// Helper function to generate candles with different time frames
function generateCandles(numCandles: number, period: 'D' | 'W' | 'M' | 'Y' | 'H' | 'MIN'): { time: number }[] {
  const candles = [];
  let startTime = new Date().getTime();
  let interval;

  switch (period) {
    case 'D':
      interval = 24 * 60 * 60;
      break;
    case 'W':
      interval = 7 * 24 * 60 * 60;
      break;
    case 'M':
      interval = 30 * 24 * 60 * 60;
      break;
    case 'Y':
      interval = 365 * 24 * 60 * 60;
      break;
    case 'H':
      interval = 60 * 60;
      break;
    case 'MIN':
      interval = 60;
      break;
    default:
      throw new Error('Invalid period. Use "D", "W", "M", "Y", "H", or "MIN".');
  }

  for (let i = 0; i < numCandles; i++) {
    candles.push({ time: startTime });
    startTime += interval;
  }

  return candles;
}

describe('WaveDegreeCalculator', () => {
  test('calculates the correct wave degree for SUPERMILLENNIUM', () => {
    const candlesY = generateCandles(1001, 'Y');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY).degree).toBe(WaveDegree.SUPERMILLENNIUM);
  });

  test('calculates the correct wave degree for MILLENNIUM', () => {
    const candlesY = generateCandles(501, 'Y');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY).degree).toBe(WaveDegree.MILLENNIUM);
  });

  test('calculates the correct wave degree for SUBMILLENNIUM', () => {
    const candlesY = generateCandles(51, 'Y');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY).degree).toBe(WaveDegree.SUBMILLENNIUM);
  });

  test('calculates the correct wave degree for GRANDSUPERCYCLE', () => {
    const candlesY = generateCandles(21, 'Y');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY).degree).toBe(WaveDegree.GRANDSUPERCYCLE);
  });

  test('calculates the correct wave degree for SUPERCYCLE', () => {
    const candlesY = generateCandles(11, 'Y');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY).degree).toBe(WaveDegree.SUPERCYCLE);
  });

  test('calculates the correct wave degree for CYCLE', () => {
    const candlesY = generateCandles(2, 'Y');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY).degree).toBe(WaveDegree.CYCLE);
  });

  test('calculates the correct wave degree for PRIMARY', () => {
    const candlesY = generateCandles(11, 'M');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY).degree).toBe(WaveDegree.PRIMARY);
  });

  test('calculates the correct wave degree for INTERMEDIATE', () => {
    const candlesM = generateCandles(2, 'W');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesM).degree).toBe(WaveDegree.INTERMEDIATE);
  });

  test('calculates the correct wave degree for MINOR', () => {
    const candlesD = generateCandles(2, 'D');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesD).degree).toBe(WaveDegree.MINOR);
  });

  test('calculates the correct wave degree for MINUTE', () => {
    const candlesD = generateCandles(4, 'H');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesD).degree).toBe(WaveDegree.MINUTE);
  });

  test('calculates the correct wave degree for MINUETTE', () => {
    const candlesH = generateCandles(30, 'MIN');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesH).degree).toBe(WaveDegree.MINUETTE);
  });

  test('calculates the correct wave degree for wave1 type', () => {
    const candlesY = generateCandles(5, 'Y');
    expect(WaveDegreeCalculator.calculateWaveDegreeFromCandles(candlesY, 'wave1').degree).toBe(WaveDegree.GRANDSUPERCYCLE);
  });

  test('calculates the correct wave degree from days', () => {
    expect(WaveDegreeCalculator.calculateWaveDegreeFromDays(1000).degree).toBe(WaveDegree.CYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegreeFromDays(5000).degree).toBe(WaveDegree.SUPERCYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegreeFromDays(0.1).degree).toBe(WaveDegree.MINUTE);
  });

  test('throws an error for invalid period', () => {
    expect(() => generateCandles(100, 'X' as any)).toThrow('Invalid period. Use "D", "W", "M", "Y", "H", or "MIN".');
  });
});
