import { PreconditionFailedException } from '@nestjs/common';

export class Fibonacci {
  private useLogScale: boolean;

  constructor(useLogScale: boolean = false) {
    this.useLogScale = useLogScale;
  }

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
}
