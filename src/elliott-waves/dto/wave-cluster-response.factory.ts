import { degreeToString, waveTypeToString, waveNameToString } from '../enums';
import { ClusterWaves, Wave } from '../types';
import { WaveClusterResponse, WaveResponse, PivotResponse, EnumStruct } from './response.dto';

export class WaveClusterResponseFactory {
  static create(cluster: ClusterWaves): WaveClusterResponse {
    return new WaveClusterResponse(
      cluster.id,
      this.mapEnumToStruct(degreeToString(cluster.degree), cluster.degree),
      this.mapEnumToStruct(waveTypeToString(cluster.waveType), cluster.waveType),
      cluster.waves.map((w) => this.createWaveResponse(w)),
    );
  }

  private static createWaveResponse(wave: Wave): WaveResponse {
    return new WaveResponse(
      wave.id,
      this.mapEnumToStruct(waveNameToString(wave.wave), wave.wave),
      this.mapEnumToStruct(degreeToString(wave.degree), wave.degree),
      new PivotResponse(wave.pStart, wave.degree),
      new PivotResponse(wave.pEnd, wave.degree),
      wave.children ? wave.children.map((child) => this.createWaveResponse(child)) : [],
    );
  }

  private static mapEnumToStruct(title: string, value: number): EnumStruct {
    return { title, value };
  }
}
