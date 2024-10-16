import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';
import { PivotType } from '../enums';

export class Pivot {
  constructor(candleIndex: number, type: PivotType, price: number, time: number, id = v4()) {
    this.id = id;
    this.candleIndex = candleIndex;
    this.type = type;
    this.price = price;
    this.time = time;
  }

  public isHigh(): boolean {
    return this.type === PivotType.HIGH;
  }

  public isLow(): boolean {
    return this.type === PivotType.LOW;
  }

  public copy(): Pivot {
    const copyPivot = new Pivot(this.candleIndex, this.type, this.price, this.time);
    copyPivot.id = this.id;
    return copyPivot;
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  candleIndex: number;
  @ApiProperty()
  type: PivotType;
  @ApiProperty()
  price: number;
  @ApiProperty()
  time: number;
}
