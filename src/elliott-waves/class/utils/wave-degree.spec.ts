import { Degree } from 'src/elliott-waves/enums';
import { WaveDegreeCalculator } from './wave-degree.class';

// Helper function to generate candles with different time frames, including random gaps
function generateCandles(numCandles: number, period: 'D' | 'W' | 'M' | 'Y' | 'H'): { time: number }[] {
  const candles = [];
  let startTime = new Date().getTime();
  let interval;

  switch (period) {
    case 'D':
      interval = 24 * 60 * 60; // 1 day in seconds
      break;
    case 'W':
      interval = 7 * 24 * 60 * 60; // 1 week in seconds
      break;
    case 'M':
      interval = 30 * 24 * 60 * 60; // 1 month (approx) in seconds
      break;
    case 'Y':
      interval = 365 * 24 * 60 * 60; // 1 year in seconds
      break;
    case 'H':
      interval = 60 * 60; // 1 hour in seconds
      break;
    default:
      throw new Error('Invalid period. Use "D", "W", "M", "Y", or "H".');
  }

  for (let i = 0; i < numCandles; i++) {
    candles.push({ time: startTime });
    startTime += interval;
  }

  return candles;
}

describe('WaveDegreeCalculator', () => {
  test('calculates the correct wave degree for SUPERMILLENNIUM', () => {
    const candlesY = generateCandles(5000, 'Y');
    const candlesM = generateCandles(60000, 'M');
    const candlesW = generateCandles(260000, 'W');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesY)).toBe(Degree.SUPERMILLENNIUM);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesM)).toBe(Degree.SUPERMILLENNIUM);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.SUPERMILLENNIUM);
  });

  test('calculates the correct wave degree for MILLENNIUM', () => {
    const candlesY = generateCandles(1000, 'Y');
    const candlesM = generateCandles(12000, 'M');
    const candlesW = generateCandles(52000, 'W');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesY)).toBe(Degree.MILLENNIUM);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesM)).toBe(Degree.MILLENNIUM);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.MILLENNIUM);
  });

  test('calculates the correct wave degree for GRANDSUPERCYCLE', () => {
    const candlesY = generateCandles(100, 'Y');
    const candlesM = generateCandles(1200, 'M');
    const candlesW = generateCandles(5200, 'W');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesY)).toBe(Degree.GRANDSUPERCYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesM)).toBe(Degree.GRANDSUPERCYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.GRANDSUPERCYCLE);
  });

  test('calculates the correct wave degree for SUPERCYCLE', () => {
    const candlesY = generateCandles(14, 'Y');
    const candlesM = generateCandles(168, 'M');
    const candlesW = generateCandles(728, 'W');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesY)).toBe(Degree.SUPERCYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesM)).toBe(Degree.SUPERCYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.SUPERCYCLE);
  });

  test('calculates the correct wave degree for CYCLE', () => {
    const candlesY = generateCandles(4, 'Y');
    const candlesM = generateCandles(48, 'M');
    const candlesW = generateCandles(208, 'W');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesY)).toBe(Degree.CYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesM)).toBe(Degree.CYCLE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.CYCLE);
  });

  test('calculates the correct wave degree for PRIMARY', () => {
    const candlesM = generateCandles(8, 'M');
    const candlesW = generateCandles(35, 'W');
    const candlesD = generateCandles(240, 'D');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesM)).toBe(Degree.PRIMARY);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.PRIMARY);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesD)).toBe(Degree.PRIMARY);
  });

  test('calculates the correct wave degree for INTERMEDIATE', () => {
    const candlesM = generateCandles(3, 'M');
    const candlesW = generateCandles(12, 'W');
    const candlesD = generateCandles(90, 'D');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesM)).toBe(Degree.INTERMEDIATE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.INTERMEDIATE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesD)).toBe(Degree.INTERMEDIATE);
  });

  test('calculates the correct wave degree for MINOR', () => {
    const candlesW = generateCandles(14, 'D');
    const candlesD = generateCandles(8, 'D');
    const candlesH = generateCandles(45 * 24, 'H');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesW)).toBe(Degree.MINOR);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesD)).toBe(Degree.MINOR);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesH)).toBe(Degree.MINOR);
  });

  test('calculates the correct wave degree for MINUTE', () => {
    const candlesD = generateCandles(5, 'D');
    const candlesH = generateCandles(5 * 24, 'H');

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesD)).toBe(Degree.MINUTE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesH)).toBe(Degree.MINUTE);
  });

  test('calculates the correct wave degree for MINUETTE', () => {
    const candlesH = generateCandles(10, 'H');
    const candlesMin = generateCandles(23, 'H'); // Approx 10 days worth of hourly candles

    expect(WaveDegreeCalculator.calculateWaveDegree(candlesH)).toBe(Degree.MINUETTE);
    expect(WaveDegreeCalculator.calculateWaveDegree(candlesMin)).toBe(Degree.MINUETTE);
  });

  test('throws an error for invalid period', () => {
    expect(() => generateCandles(100, 'X' as any)).toThrow('Invalid period. Use "D", "W", "M", "Y", or "H".');
  });
});
