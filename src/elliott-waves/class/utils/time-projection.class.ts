export type PivotTime = {
  time: number;
};

interface TimeProjectionResult {
  minTime: number;
  maxTime: number;
  mediumTime: number;
}

export class TimeProjection {
  // Fibonacci ratios for time projection
  private static fibonacciRatios = {
    wave2Min: 0.382,
    wave2Max: 0.618,
    wave3Min: 1.618,
    wave3Max: 2.618,
    wave4Min: 0.382,
    wave4Max: 0.618,
    wave5Min: 0.618,
    wave5Max: 1.618,
  };

  /**
   * Projects time based on given pivot times and ratio range.
   * @param startTime - The start time
   * @param endTime - The end time
   * @param pivotTime - The pivot time
   * @param percentage - The percentage projection
   * @returns A number with the Projected Time
   */
  static projectTime(startTime: number, endTime: number, pivotTime: number, percentage: number): number {
    const timeDiff = endTime - startTime;
    const projectedTime = pivotTime + timeDiff * (percentage / 100);

    return projectedTime;
  }
  /**
   * Calculates the projected times for Wave 2.
   * @param p0 - Pivot 0
   * @param p1 - Pivot 1
   * @returns An object containing minTime, maxTime, and mediumTime
   */
  static calculateWave2Time(p0: PivotTime, p1: PivotTime): TimeProjectionResult {
    const timeDiff = p1.time - p0.time;
    const minTime = p1.time + timeDiff * this.fibonacciRatios.wave2Min;
    const maxTime = p1.time + timeDiff * this.fibonacciRatios.wave2Max;
    const mediumTime = minTime + (maxTime - minTime) / 2;
    return { minTime, maxTime, mediumTime };
  }

  /**
   * Calculates the projected times for Wave 3.
   * @param p0 - Pivot 0
   * @param p2 - Pivot 2
   * @returns An object containing minTime, maxTime, and mediumTime
   */
  static calculateWave3Time(p0: PivotTime, p2: PivotTime): TimeProjectionResult {
    const timeDiff = p2.time - p0.time;
    const minTime = p2.time + timeDiff * this.fibonacciRatios.wave3Min;
    const maxTime = p2.time + timeDiff * this.fibonacciRatios.wave3Max;
    const mediumTime = minTime + (maxTime - minTime) / 2;
    return { minTime, maxTime, mediumTime };
  }

  /**
   * Calculates the projected times for Wave 4.
   * @param p1 - Pivot 1
   * @param p3 - Pivot 3
   * @returns An object containing minTime, maxTime, and mediumTime
   */
  static calculateWave4Time(p1: PivotTime, p3: PivotTime): TimeProjectionResult {
    const timeDiff = p3.time - p1.time;
    const minTime = p3.time + timeDiff * this.fibonacciRatios.wave4Min;
    const maxTime = p3.time + timeDiff * this.fibonacciRatios.wave4Max;
    const mediumTime = minTime + (maxTime - minTime) / 2;
    return { minTime, maxTime, mediumTime };
  }

  /**
   * Calculates the projected times for Wave 5.
   * @param p2 - Pivot 2
   * @param p4 - Pivot 4
   * @returns An object containing minTime, maxTime, and mediumTime
   */
  static calculateWave5Time(p2: PivotTime, p4: PivotTime): TimeProjectionResult {
    const timeDiff = p4.time - p2.time;
    const minTime = p4.time + timeDiff * this.fibonacciRatios.wave5Min;
    const maxTime = p4.time + timeDiff * this.fibonacciRatios.wave5Max;
    const mediumTime = minTime + (maxTime - minTime) / 2;
    return { minTime, maxTime, mediumTime };
  }
}
