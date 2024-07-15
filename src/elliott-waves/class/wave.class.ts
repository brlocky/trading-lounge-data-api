import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';
import { WaveName, WaveDegree, Trend } from '../enums';
import { Pivot } from './pivot.class';
import { ClusterPivot } from './cluster-pivot.class';

export class Wave {
  constructor(wave: WaveName, degree: WaveDegree, pStart: Pivot | ClusterPivot, pEnd: Pivot | ClusterPivot) {
    this.id = v4();
    this.wave = wave;
    this.degree = degree;
    this.pStart = this.ensureClusterPivot(pStart);
    this.pEnd = this.ensureClusterPivot(pEnd);
    this.children = [];
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  wave: WaveName;
  @ApiProperty()
  degree: WaveDegree;
  @ApiProperty()
  pStart: ClusterPivot;
  @ApiProperty()
  pEnd: ClusterPivot;
  @ApiProperty()
  children: Wave[];

  public copy(): Wave {
    return new Wave(this.wave, this.degree, this.pStart, this.pEnd);
  }

  public addChidren(wave: Wave) {
    this.children.push(wave);
  }

  public setChidren(waves: Wave[]) {
    this.children = waves;
  }

  public length(useLogScale: boolean): number {
    return useLogScale ? Math.abs(Math.log(this.pEnd.price) - Math.log(this.pStart.price)) : Math.abs(this.pEnd.price - this.pStart.price);
  }

  public duration(): number {
    return this.pEnd.time - this.pStart.time;
  }

  public trend(): Trend {
    return this.pEnd.price > this.pStart.price ? Trend.UP : Trend.DOWN;
  }

  private ensureClusterPivot(pivot: Pivot | ClusterPivot): ClusterPivot {
    if (this.isClusterPivot(pivot)) {
      return pivot;
    } else {
      return new ClusterPivot(pivot, 'CONFIRMED');
    }
  }

  private isClusterPivot(pivot: Pivot | ClusterPivot): pivot is ClusterPivot {
    return (pivot as ClusterPivot).status !== undefined;
  }
}
