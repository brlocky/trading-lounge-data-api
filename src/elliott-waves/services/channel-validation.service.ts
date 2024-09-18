import { Injectable } from '@nestjs/common';
import { Wave } from '../class/wave.class'; // Adjust the import path as necessary
import { Trend } from '../enums'; // Adjust the import path as necessary

// Define Point, Line, and Channel interfaces
interface Point {
  time: number;
  price: number;
}

interface Line {
  slope: number;
  intercept: number;
}

interface Channel {
  lowerLine: Line;
  upperLine: Line;
}

interface DiagonalValidationResult {
  isValid: boolean;
  type: 'contracting' | 'expanding' | 'none';
}

@Injectable()
export class ChannelValidationService {
  /**
   * Calculate a line (slope and intercept) between two points.
   */
  calculateLine(p1: Point, p2: Point, useLogScale: boolean = false): Line {
    const price1 = useLogScale ? Math.log(p1.price) : p1.price;
    const price2 = useLogScale ? Math.log(p2.price) : p2.price;
    const slope = (price2 - price1) / (p2.time - p1.time);
    const intercept = price1 - slope * p1.time;
    return { slope, intercept };
  }

  /**
   * Calculate a parallel line to the given line that passes through a specific point.
   */
  calculateParallelLine(line: Line, point: Point, useLogScale: boolean = false): Line {
    const price = useLogScale ? Math.log(point.price) : point.price;
    const intercept = price - line.slope * point.time;
    return { slope: line.slope, intercept };
  }

  /**
   * Check if a point is beyond a given line in the direction of the trend.
   */
  isBeyondLine(point: Point, line: Line, trend: Trend, useLogScale: boolean = false): boolean {
    const price = useLogScale ? Math.log(point.price) : point.price;
    const linePriceAtTime = line.slope * point.time + line.intercept;

    if (trend === Trend.UP) {
      return price > linePriceAtTime;
    } else if (trend === Trend.DOWN) {
      return price < linePriceAtTime;
    } else {
      throw new Error('Unknown trend direction');
    }
  }

  /**
   * Convert a Wave's start or end point to a Point interface.
   */
  wavePoint(wave: Wave, start: boolean): Point {
    const pivot = start ? wave.pStart : wave.pEnd;
    return { time: pivot.time, price: pivot.price };
  }

  /**
   * Validate waves using channels.
   */
  validateWaveChannels(waves: Wave[], useLogScale: boolean = false): boolean {
    // Ensure we have at least 5 waves
    if (waves.length < 5) {
      throw new Error('At least 5 waves are required for validation.');
    }

    // Determine trend from the first wave
    const trend = waves[0].trend();

    // Extract points from waves
    const pStart1 = this.wavePoint(waves[0], true);
    const pEnd1 = this.wavePoint(waves[0], false);
    const pEnd2 = this.wavePoint(waves[1], false);
    const pEnd3 = this.wavePoint(waves[2], false);
    const pEnd4 = this.wavePoint(waves[3], false);
    const pEnd5 = this.wavePoint(waves[4], false);

    // Create base channel using Wave 1 and Wave 2
    const baseLineLower = this.calculateLine(pStart1, pEnd2, useLogScale);
    const baseLineUpper = this.calculateParallelLine(baseLineLower, pEnd1, useLogScale);
    const baseChannel: Channel = { lowerLine: baseLineLower, upperLine: baseLineUpper };

    // Validate Wave 3 breakout
    const wave3BreaksBaseChannel = this.isBeyondLine(pEnd3, baseChannel.upperLine, trend, useLogScale);

    if (!wave3BreaksBaseChannel) {
      console.log('Wave 3 does not break the base channel, validation failed.');
      return false;
    }

    // Create acceleration channel using Wave 3 and Wave 4
    const accelLineLower = this.calculateLine(pEnd2, pEnd4, useLogScale);
    const accelLineUpper = this.calculateParallelLine(accelLineLower, pEnd3, useLogScale);
    const accelChannel: Channel = { lowerLine: accelLineLower, upperLine: accelLineUpper };

    // Validate Wave 5 within acceleration channel
    const wave5WithinAccelChannel =
      this.isBeyondLine(pEnd5, accelChannel.lowerLine, trend, useLogScale) &&
      !this.isBeyondLine(pEnd5, accelChannel.upperLine, trend, useLogScale);

    if (!wave5WithinAccelChannel) {
      console.log('Wave 5 does not conform to the acceleration channel, validation failed.');
      return false;
    }

    console.log('All waves validated successfully within their respective channels.');
    return true;
  }

  /**
   * Validate contracting or expanding diagonals.
   */
  validateDiagonal(waves: Wave[], useLogScale: boolean = false): DiagonalValidationResult {
    if (waves.length !== 5) {
      throw new Error('Diagonal validation requires exactly 5 waves.');
    }

    // Extract points
    const p1 = this.wavePoint(waves[0], true);
    const p3 = this.wavePoint(waves[2], true);
    const p5 = this.wavePoint(waves[4], true);

    const p2 = this.wavePoint(waves[1], true);
    const p4 = this.wavePoint(waves[3], true);

    // Calculate trendlines
    const upperTrendline = this.calculateLine(p1, p3, useLogScale);
    const lowerTrendline = this.calculateLine(p2, p4, useLogScale);

    // Check slopes for convergence/divergence
    const upperSlope = upperTrendline.slope;
    const lowerSlope = lowerTrendline.slope;

    let isContracting = false;
    let isExpanding = false;

    if (waves[0].trend() === Trend.UP) {
      // For uptrend, contracting if upperSlope < lowerSlope
      isContracting = upperSlope < lowerSlope;
      isExpanding = upperSlope > lowerSlope;
    } else if (waves[0].trend() === Trend.DOWN) {
      // For downtrend, contracting if upperSlope > lowerSlope
      isContracting = upperSlope > lowerSlope;
      isExpanding = upperSlope < lowerSlope;
    }

    if (isContracting) {
      console.log('Valid contracting diagonal detected.');
      return { isValid: true, type: 'contracting' };
    } else if (isExpanding) {
      console.log('Valid expanding diagonal detected.');
      return { isValid: true, type: 'expanding' };
    } else {
      console.log('No valid diagonal pattern detected.');
      return { isValid: false, type: 'none' };
    }
  }

  /**
   * Additional utility methods can be added here.
   */
}
