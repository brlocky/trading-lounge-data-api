import { BadRequestException, Injectable } from '@nestjs/common';
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
  middleLine: Line;
  upperLine: Line;
}

interface GenericChannels {
  base: Channel;
  temporary: Channel;
  final: Channel;
}

interface DiagonalValidationResult {
  isValid: boolean;
  type: 'contracting' | 'expanding' | 'none';
}

@Injectable()
export class ChannelValidationService {
  /**
   * Create generic channels for the impulse.
   */
  createChannels(waves: [Wave, Wave, Wave, Wave, Wave], useLogScale: boolean = false): GenericChannels {
    const [w1, w2, w3, w4] = waves;
    const base = this.createChannel(w1.pStart, w2.pEnd, w1.pEnd, useLogScale);
    const temporary = this.createChannel(w1.pEnd, w3.pEnd, w2.pEnd, useLogScale);
    const final = this.createChannel(w2.pEnd, w4.pEnd, w1.pEnd, useLogScale);

    return { base, temporary, final };
  }

  /**
   * Create a channel between two points.
   */
  createChannel(p1: Point, p2: Point, p3: Point, useLogScale: boolean = false): Channel {
    const line1 = this.calculateLine(p1, p2, useLogScale);
    const line2 = this.calculateParallelLine(line1, p3, useLogScale);

    // Determine which line is lower based on the price points
    let lowerLine, upperLine;
    if (p1.price < p3.price) {
      lowerLine = line1;
      upperLine = line2;
    } else {
      lowerLine = line2;
      upperLine = line1;
    }

    const middleLine = this.calculateMiddleLine(lowerLine, upperLine);

    return { lowerLine, middleLine, upperLine };
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
      throw new BadRequestException('Unknown trend direction');
    }
  }

  /**
   * Calculate the relative position of a point within a channel.
   */
  calculateChannelPosition(point: Point, channel: Channel, useLogScale: boolean = false): number {
    const price = useLogScale ? Math.log(point.price) : point.price;
    const lowerPrice = channel.lowerLine.slope * point.time + channel.lowerLine.intercept;
    const upperPrice = channel.upperLine.slope * point.time + channel.upperLine.intercept;
    return (price - lowerPrice) / (upperPrice - lowerPrice);
  }

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
   * Calculate the middle line between two given lines.
   */
  calculateMiddleLine(lowerLine: Line, upperLine: Line): Line {
    return {
      slope: (lowerLine.slope + upperLine.slope) / 2,
      intercept: (lowerLine.intercept + upperLine.intercept) / 2,
    };
  }

  /**
   * Convert a Wave's start or end point to a Point interface.
   */
  wavePoint(wave: Wave, start: boolean): Point {
    const pivot = start ? wave.pStart : wave.pEnd;
    return { time: pivot.time, price: pivot.price };
  }

  /**
   * Validate contracting or expanding diagonals.
   */
  validateDiagonal(waves: Wave[], useLogScale: boolean = false): DiagonalValidationResult {
    if (waves.length !== 5) {
      throw new BadRequestException('Diagonal validation requires exactly 5 waves.');
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
      return { isValid: true, type: 'contracting' };
    } else if (isExpanding) {
      return { isValid: true, type: 'expanding' };
    } else {
      return { isValid: false, type: 'none' };
    }
  }

  /**
   * Additional utility methods can be added here.
   */
}
