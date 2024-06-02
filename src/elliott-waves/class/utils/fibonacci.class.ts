import { PreconditionFailedException } from '@nestjs/common';

export class Fibonacci {
  private useLogScale: boolean;

  constructor(useLogScale: boolean = false) {
    this.useLogScale = useLogScale;
  }

  /**
   * Returns whether logarithmic scale is used.
   * @returns {boolean} True if log scale is used, false otherwise.
   */
  isLogScale(): boolean {
    return this.useLogScale;
  }

  /**
   * Calculates the retracement price based on the given percentage.
   * Uses logarithmic scale if useLogScale is true.
   * @param {number} p1 - The initial price.
   * @param {number} p2 - The final price.
   * @param {number} percentage - The retracement percentage.
   * @returns {number} The retracement price.
   * @throws {PreconditionFailedException} If p1 is equal to p2.
   */
  getRetracementPrice(p1: number, p2: number, percentage: number): number {
    if (p1 === p2) {
      throw new PreconditionFailedException('Cannot calculate Retracement.');
    }

    if (this.useLogScale) {
      const logP1 = Math.log(p1);
      const logP2 = Math.log(p2);
      const logDistance = (logP1 - logP2) * (percentage / 100);
      return Math.exp(logP2 + logDistance);
    } else {
      const distance = (p1 - p2) * (percentage / 100);
      return p2 + distance;
    }
  }

  /**
   * Calculates the retracement percentage from the given prices.
   * Uses logarithmic scale if useLogScale is true.
   * @param {number} p1 - The initial price.
   * @param {number} p2 - The final price.
   * @param {number} p3 - The retracement price.
   * @returns {number} The retracement percentage.
   * @throws {PreconditionFailedException} If p1 is equal to p2.
   */
  getRetracementPercentage(p1: number, p2: number, p3: number): number {
    if (p1 === p2) {
      throw new PreconditionFailedException(`Cannot calculate retracement.`);
    }

    if (this.useLogScale) {
      const logP1 = Math.log(p1);
      const logP2 = Math.log(p2);
      const logP3 = Math.log(p3);
      return ((logP2 - logP3) / (logP2 - logP1)) * 100;
    } else {
      return ((p2 - p3) / (p2 - p1)) * 100;
    }
  }

  /**
   * Calculates the projection price based on the given percentage.
   * Uses logarithmic scale if useLogScale is true.
   * @param {number} p1 - The initial price.
   * @param {number} p2 - The middle price.
   * @param {number} p3 - The final price.
   * @param {number} percentage - The projection percentage.
   * @returns {number} The projection price.
   * @throws {PreconditionFailedException} If p1 is equal to p2.
   */
  getProjectionPrice(p1: number, p2: number, p3: number, percentage: number): number {
    if (p1 === p2) {
      throw new PreconditionFailedException('Cannot calculate Projection.');
    }

    if (this.useLogScale) {
      const logP1 = Math.log(p1);
      const logP2 = Math.log(p2);
      const logP3 = Math.log(p3);
      const logDistance = (logP2 - logP1) * (percentage / 100);
      return Math.exp(logP3 + logDistance);
    } else {
      const distance = (p2 - p1) * (percentage / 100);
      return p3 + distance;
    }
  }

  /**
   * Calculates the projection percentage from the given prices.
   * Uses logarithmic scale if useLogScale is true.
   * @param {number} p1 - The initial price.
   * @param {number} p2 - The middle price.
   * @param {number} p3 - The third price.
   * @param {number} p4 - The projection price.
   * @returns {number} The projection percentage.
   * @throws {PreconditionFailedException} If p1 is equal to p2.
   */
  getProjectionPercentage(p1: number, p2: number, p3: number, p4: number): number {
    if (p1 === p2) {
      throw new PreconditionFailedException('Cannot calculate Projection.');
    }

    const calculatePercentage = (start: number, end: number, target: number): number => {
      return ((target - start) / (end - start)) * 100;
    };

    if (this.useLogScale) {
      const logP1 = Math.log(p1);
      const logP2 = Math.log(p2);
      const logP3 = Math.log(p3);
      const logP4 = Math.log(p4);
      const logDistance = logP2 - logP1;
      const logProjectionPoint = logP3 + logDistance;
      return calculatePercentage(logP3, logProjectionPoint, logP4);
    } else {
      const distance = p2 - p1;
      const projectionPoint = p3 + distance;
      return calculatePercentage(p3, projectionPoint, p4);
    }
  }

  /**
   * Calculates the percentage decrease from p1 to p2.
   * @param {number} p1 - The initial value.
   * @param {number} p2 - The final value.
   * @returns {number} The percentage decrease.
   */
  calculatePercentageDecrease(p1: number, p2: number): number {
    if (p1 === 0) {
      return 0;
    }
    return Math.abs((p1 - p2) / p1) * 100;
  }

  /**
   * Calculates the percentage gain from p1 to p2.
   * @param {number} p1 - The initial value.
   * @param {number} p2 - The final value.
   * @returns {number} The percentage gain.
   */
  calculatePercentageGain(p1: number, p2: number): number {
    if (p1 === 0) {
      return 0;
    }
    return Math.abs((p2 - p1) / p1) * 100;
  }
}
