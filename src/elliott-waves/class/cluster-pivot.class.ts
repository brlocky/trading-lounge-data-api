import { ApiProperty } from '@nestjs/swagger';
import { PivotStatus } from '../types';
import { Pivot } from './pivot.class';

export class ClusterPivot extends Pivot {
  constructor(pivot: Pivot, status: PivotStatus) {
    super(pivot.candleIndex, pivot.type, pivot.price, pivot.time);
    this.id = pivot.id;
    this.status = status;
  }

  @ApiProperty()
  status: PivotStatus;

  confirmPivot(): void {
    this.status = 'CONFIRMED';
  }
}
