import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';
import { WaveType, Degree } from '../enums';
import { Wave } from './wave.class';

export class ClusterWaves {
  constructor(waves: Wave[] = [], waveType: WaveType = WaveType.UNKNOWN, degree: Degree = Degree.SUPERMILLENNIUM) {
    this.id = v4();
    this.degree = degree;
    this.waveType = waveType;
    this.waves = waves;
  }

  public addWave(wave: Wave): void {
    this.waves.push(wave);
  }

  public duplicate(): ClusterWaves {
    return new ClusterWaves([...this.waves], this.waveType, this.degree);
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  degree: Degree;
  @ApiProperty()
  waveType: WaveType;
  @ApiProperty()
  waves: Wave[];
}
