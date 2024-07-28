import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';
import { WaveType, WaveDegree } from '../enums';
import { Wave } from './wave.class';

export class ClusterWaves {
  constructor(waves: Wave[] = [], waveType: WaveType = WaveType.UNKNOWN, degree: WaveDegree = WaveDegree.SUPERMILLENNIUM) {
    this.id = v4();
    this.degree = degree;
    this.waveType = waveType;
    this.waves = waves;
    this.parent = null;
  }

  setParentWave(parentWave: Wave) {
    this.parent = parentWave;
  }

  public addWave(wave: Wave): void {
    this.waves.push(wave);
  }

  public addWaves(waves: Wave[]): void {
    waves.forEach((w) => this.waves.push(w));
  }

  public changeDegree(newDegree: WaveDegree): void {
    this.degree = newDegree;
    this.waves.forEach((wave) => wave.changeDegree(newDegree));
  }

  public duplicate(): ClusterWaves {
    const wavesCopy = this.waves.map((w) => w.copy());
    return new ClusterWaves(wavesCopy, this.waveType, this.degree);
  }

  @ApiProperty()
  id: string;
  @ApiProperty()
  degree: WaveDegree;
  @ApiProperty()
  waveType: WaveType;
  @ApiProperty()
  waves: Wave[];
  @ApiProperty()
  parent: Wave | null;
}
