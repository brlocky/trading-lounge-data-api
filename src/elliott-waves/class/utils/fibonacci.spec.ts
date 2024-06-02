// Fibonacci.test.ts

import { Fibonacci } from './fibonacci.class';

describe('Fibonacci', () => {
  const instanceLinear = new Fibonacci(false);
  const instanceLog = new Fibonacci(true);
  describe('getRetracementPercentage', () => {
    it('should throw an error when p1 and p2', () => {
      expect(() => instanceLinear.getRetracementPercentage(100, 100, 150)).toThrow();
      expect(() => instanceLog.getRetracementPercentage(100, 100, 150)).toThrow();
    });

    it('should calculate retracement percentage on linear scale', () => {
      let result = instanceLinear.getRetracementPercentage(100, 200, 150);
      expect(result).toBeCloseTo(50);
      result = instanceLinear.getRetracementPercentage(200, 100, 150);
      expect(result).toBeCloseTo(50);
      result = instanceLinear.getRetracementPercentage(200, 100, 50);
      expect(result).toBeCloseTo(-50);

      result = instanceLinear.getRetracementPercentage(1, 2, 1.2);
      expect(result).toBeCloseTo(80);
      result = instanceLinear.getRetracementPercentage(2, 1, 1.2);
      expect(result).toBeCloseTo(20);

      result = instanceLinear.getRetracementPercentage(1, 2, 1.8);
      expect(result).toBeCloseTo(20);
      result = instanceLinear.getRetracementPercentage(2, 1, 1.8);
      expect(result).toBeCloseTo(80);
    });

    it('should calculate retracement percentage on logarithmic scale', () => {
      let result = instanceLog.getRetracementPercentage(100, 200, 150);
      expect(result).toBeCloseTo(41.5);
      result = instanceLog.getRetracementPercentage(200, 100, 150);
      expect(result).toBeCloseTo(58.5);
      result = instanceLog.getRetracementPercentage(200, 100, 50);
      expect(result).toBeCloseTo(-100);

      result = instanceLog.getRetracementPercentage(1, 2, 1.2);
      expect(result).toBeCloseTo(73.6965, 2);

      result = instanceLog.getRetracementPercentage(1, 2, 1.8);
      expect(result).toBeCloseTo(15.2);
    });
  });

  describe('getProjectionPercentage', () => {
    test('should throw an error when p1 and p2 are the same', () => {
      expect(() => instanceLinear.getProjectionPercentage(100, 100, 300, 400)).toThrow();
      expect(() => instanceLog.getProjectionPercentage(100, 100, 300, 400)).toThrow();
    });

    test('should calculate projection percentage correctly using linear scale', () => {
      let result = instanceLinear.getProjectionPercentage(56415.0, 65524.0, 60102.0, 69211);
      expect(result).toBeCloseTo(100, 0);
      result = instanceLinear.getProjectionPercentage(73951.5, 60777.0, 72874.5, 59700);
      expect(result).toBeCloseTo(100, 0);

      result = instanceLinear.getProjectionPercentage(56415.0, 65524.0, 60102.0, 74840);
      expect(result).toBeCloseTo(161.8, 0);
      result = instanceLinear.getProjectionPercentage(73951.5, 60777.0, 72874.5, 51558);
      expect(result).toBeCloseTo(161.8, 0);

      result = instanceLinear.getProjectionPercentage(56415.0, 65524.0, 60102.0, 83949);
      expect(result).toBeCloseTo(261.8, 0);
      result = instanceLinear.getProjectionPercentage(73951.5, 60777.0, 72874.5, 38383.5);
      expect(result).toBeCloseTo(261.8, 0);
    });

    test('should calculate projection percentage correctly using log scale', () => {
      let result = instanceLog.getProjectionPercentage(56415.0, 65524.0, 60102.0, 69806);
      expect(result).toBeCloseTo(100, 0);
      result = instanceLog.getProjectionPercentage(73951.5, 60777.0, 72874.5, 59892);
      expect(result).toBeCloseTo(100, 0);

      result = instanceLog.getProjectionPercentage(56415.0, 65524.0, 60102.0, 76571);
      expect(result).toBeCloseTo(161.8, 0);
      result = instanceLog.getProjectionPercentage(73951.5, 60777.0, 72874.5, 53053);
      expect(result).toBeCloseTo(161.8, 0);

      result = instanceLog.getProjectionPercentage(56415.0, 65524.0, 60102.0, 88935);
      expect(result).toBeCloseTo(261.8, 0);
      result = instanceLog.getProjectionPercentage(73951.5, 60777.0, 72874.5, 43601);
      expect(result).toBeCloseTo(261.8, 0);
    });
  });

  describe('getProjectionPrices', () => {
    test('should throw an error when p1 and p2 are the same', () => {
      expect(() => instanceLinear.getProjectionPrice(100, 100, 300, 400)).toThrow();
      expect(() => instanceLog.getProjectionPrice(100, 100, 300, 400)).toThrow();
    });

    test('should calculate projection prices correctly using linear scale', () => {
      let result = instanceLinear.getProjectionPrice(100, 200, 150, 100);
      expect(result).toBeCloseTo(250);
      result = instanceLinear.getProjectionPrice(200, 100, 150, 100);
      expect(result).toBeCloseTo(50);
      result = instanceLinear.getProjectionPrice(100, 200, 150, 200);
      expect(result).toBeCloseTo(350);
    });

    test('should calculate projection prices correctly using log scale', () => {
      let result = instanceLog.getProjectionPrice(100, 200, 150, 100);
      expect(result).toBeCloseTo(300);
      result = instanceLog.getProjectionPrice(200, 100, 150, 100);
      expect(result).toBeCloseTo(75);
      result = instanceLog.getProjectionPrice(100, 200, 150, 200);
      expect(result).toBeCloseTo(600);
    });
  });

  describe('getRetracementPrice', () => {
    test('should throw an error when p1 and p2 are the same', () => {
      expect(() => instanceLinear.getRetracementPrice(100, 100, 300)).toThrow();
      expect(() => instanceLog.getRetracementPrice(100, 100, 300)).toThrow();
    });

    test('should calculate retracement prices correctly using linear scale', () => {
      let result = instanceLinear.getRetracementPrice(100, 200, 75);
      expect(result).toBeCloseTo(125);
      result = instanceLinear.getRetracementPrice(100, 200, 100);
      expect(result).toBeCloseTo(100);
      result = instanceLinear.getRetracementPrice(100, 200, 10);
      expect(result).toBeCloseTo(190);
      result = instanceLinear.getRetracementPrice(100, 200, 90);
      expect(result).toBeCloseTo(110);
    });

    test('should calculate retracement prices correctly using log scale', () => {
      let result = instanceLog.getRetracementPrice(100, 200, 78.6);
      expect(result).toBeCloseTo(115.9, 0);
      result = instanceLog.getRetracementPrice(100, 200, 61.8);
      expect(result).toBeCloseTo(130.31);
      result = instanceLog.getRetracementPrice(100, 200, 38.2);
      expect(result).toBeCloseTo(153.474);
      result = instanceLog.getRetracementPrice(100, 200, 14.2);
      expect(result).toBeCloseTo(181.252);
    });
  });

  describe('calculatePercentageDecrease', () => {
    it('should calculate retracement correctly', () => {
      expect(instanceLinear.calculatePercentageDecrease(100, 80)).toBe(20);
      expect(instanceLinear.calculatePercentageDecrease(100, 50)).toBe(50);
      expect(instanceLinear.calculatePercentageDecrease(200, 50)).toBe(75);

      expect(instanceLog.calculatePercentageDecrease(100, 80)).toBe(20);
      expect(instanceLog.calculatePercentageDecrease(100, 50)).toBe(50);
      expect(instanceLog.calculatePercentageDecrease(200, 50)).toBe(75);
    });

    it('should return 0 when p1 is zero', () => {
      expect(instanceLinear.calculatePercentageDecrease(0, 80)).toBe(0);
      expect(instanceLog.calculatePercentageDecrease(0, 80)).toBe(0);
    });

    it('should handle cases where p2 is zero', () => {
      expect(instanceLinear.calculatePercentageDecrease(100, 0)).toBe(100);
      expect(instanceLog.calculatePercentageDecrease(100, 0)).toBe(100);
    });

    it('should handle negative prices correctly', () => {
      expect(instanceLinear.calculatePercentageDecrease(100, -50)).toBe(150);
      expect(instanceLinear.calculatePercentageDecrease(100, -100)).toBe(200);
      expect(instanceLog.calculatePercentageDecrease(100, -50)).toBe(150);
      expect(instanceLog.calculatePercentageDecrease(100, -100)).toBe(200);
    });

    it('should handle identical p1 and p2 correctly', () => {
      expect(instanceLinear.calculatePercentageDecrease(100, 100)).toBe(0);
      expect(instanceLog.calculatePercentageDecrease(100, 100)).toBe(0);
    });

    it('should handle p2 greater than p1 correctly', () => {
      expect(instanceLinear.calculatePercentageDecrease(100, 150)).toBe(-50);
      expect(instanceLog.calculatePercentageDecrease(100, 150)).toBe(-50);
    });
  });

  describe('calculatePercentageGain', () => {
    it('should return 20 when increasing from 100 to 120', () => {
      expect(instanceLinear.calculatePercentageGain(100, 120)).toBe(20);
      expect(instanceLog.calculatePercentageGain(100, 120)).toBe(20);
    });

    it('should return 50 when increasing from 100 to 150', () => {
      expect(instanceLinear.calculatePercentageGain(100, 150)).toBe(50);
      expect(instanceLog.calculatePercentageGain(100, 150)).toBe(50);
    });

    it('should return 300 when increasing from 50 to 200', () => {
      expect(instanceLinear.calculatePercentageGain(50, 200)).toBe(300);
      expect(instanceLog.calculatePercentageGain(50, 200)).toBe(300);
    });

    it('should return 0 when increasing from 100 to 100', () => {
      expect(instanceLinear.calculatePercentageGain(100, 100)).toBe(0);
      expect(instanceLog.calculatePercentageGain(100, 100)).toBe(0);
    });

    it('should return -50 when decreasing from 100 to 50 (negative gain)', () => {
      expect(instanceLinear.calculatePercentageGain(100, 50)).toBe(-50);
      expect(instanceLog.calculatePercentageGain(100, 50)).toBe(-50);
    });

    it('should return 0 when starting value is 0', () => {
      expect(instanceLinear.calculatePercentageGain(0, 50)).toBe(0);
      expect(instanceLog.calculatePercentageGain(0, 50)).toBe(0);
    });
  });
});
