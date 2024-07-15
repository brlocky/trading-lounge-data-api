import { Wave, Pivot } from '.';
import { WaveDegree, WaveName } from '../enums';

export class WaveSequenceFinder {
  startPivot: Pivot;
  currentWave: WaveName | null = WaveName._1;
  nextExpectedWave: WaveName | null = WaveName._2;
  degree: WaveDegree;
  waves: Wave[] = [];
  subWave: WaveSequenceFinder | null = null;

  constructor(startPivot: Pivot, degree: WaveDegree) {
    this.startPivot = startPivot;
    this.degree = degree;
  }

  findNextWave(pivots: Pivot[]) {
    let wave: Wave | undefined;

    switch (this.currentWave) {
      case WaveName._1:
        wave = new Wave(WaveName._1, this.degree, pivots[0], pivots[1]);
        this.currentWave = WaveName._2;
        this.nextExpectedWave = WaveName._3;
        break;
      case WaveName._2:
        wave = new Wave(WaveName._2, this.degree, pivots[1], pivots[2]);
        this.currentWave = WaveName._3;
        this.nextExpectedWave = WaveName._4;
        break;
      case WaveName._3:
        wave = new Wave(WaveName._3, this.degree, pivots[2], pivots[3]);
        this.currentWave = WaveName._4;
        this.nextExpectedWave = WaveName._5;
        break;
      case WaveName._4:
        wave = new Wave(WaveName._4, this.degree, pivots[3], pivots[4]);
        this.currentWave = WaveName._5;
        this.nextExpectedWave = null;
        break;
      case WaveName._5:
        wave = new Wave(WaveName._5, this.degree, pivots[4], pivots[5]);
        this.currentWave = null;
        this.nextExpectedWave = null;
        break;
    }

    /*     if (wave && this.validator.validate(wave)) {
      this.waves.push(wave);
    } */
  }
}
