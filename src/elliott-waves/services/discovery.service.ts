import { Injectable } from '@nestjs/common';
import { ClusterPivot, ClusterWaves, Pivot, Wave } from '../class';
import { CandleTime, findPivotIndex, getHHBeforeBreak, getLLBeforeBreak, WaveDegreeCalculator } from '../class/utils';
import { increaseDegree, Trend, WaveDegree, WaveName, WaveType } from '../enums';
import { Candle } from '../types';
import { CandleService } from './candle.service';
import { WaveInfoService } from './wave-info.service';
import { v4 } from 'uuid';

interface WaveDiscoveryNode {
  id: string;
  degree: WaveDegree;
  trend: Trend;
  currentWave: WaveName;
  subWaves: Wave[];
  parentId: string | null;
}

@Injectable()
export class DiscoveryService {
  constructor(
    private candleService: CandleService,
    private waveInfoService: WaveInfoService,
  ) {}

  async findMajorStructure(candles: Candle[], definition = 3, useLogScale: boolean): Promise<ClusterWaves[]> {
    const pivotZigzag = this.candleService.getZigZag(candles);
    const initialScenarios = this.buildInitialScenarios(pivotZigzag);
    if (initialScenarios.length === 0) return [];

    const discoveredWaves = initialScenarios.flatMap((scenario) =>
      this.discoverWaves(scenario, pivotZigzag, candles, definition, useLogScale),
    );

    const result = this.convertToClusterWaves(discoveredWaves);
    return result;
  }

  buildInitialScenarios(pivots: Pivot[]): WaveDiscoveryNode[] {
    const impulsiveWaves = this.candleService.findFirstImpulsiveWave(pivots).slice(0, 4);
    if (impulsiveWaves.length === 0) {
      return [];
    }

    return impulsiveWaves
      .map(([p0, p1, p2]) => {
        const { degree } = WaveDegreeCalculator.calculateWaveDegreeFromCandles([p0 as CandleTime, p1 as CandleTime], 'wave1');

        if (degree === WaveDegree.UNKNOWN) return null;
        const wave1 = new Wave(WaveName._1, degree, p0, p1);
        const wave2 = new Wave(WaveName._2, degree, p1, p2);
        const isTrendUp = p0.price < p1.price;
        const initialNode: WaveDiscoveryNode = {
          id: v4(),
          parentId: null,
          trend: isTrendUp ? Trend.UP : Trend.DOWN,
          degree,
          currentWave: WaveName._2,
          subWaves: [wave1, wave2],
        };

        return initialNode;
      })
      .filter((r) => !!r) as WaveDiscoveryNode[];
  }

  private discoverWaves(
    node: WaveDiscoveryNode,
    pivotZigzag: Pivot[],
    candles: Candle[],
    definition: number,
    useLogScale: boolean,
  ): WaveDiscoveryNode[] {
    const completedWaves: WaveDiscoveryNode[] = [];
    const queue: WaveDiscoveryNode[] = [node];

    while (queue.length > 0) {
      const currentNode = queue.shift()!;

      const newWaves = this.findNewWaves(currentNode, pivotZigzag);
      if (newWaves.length === 0) {
        completedWaves.push(currentNode);
        continue;
      }
      for (const newImpulseWaves of newWaves) {
        if (this.isWaveValid(currentNode, newImpulseWaves)) {
          const [w1, w2] = newImpulseWaves;
          const currentNodeCopy = {
            ...currentNode,
            subWaves: currentNode.subWaves.map((w) => w.copy()),
          };
          currentNodeCopy.subWaves.push(w1);

          if (w1.wave === WaveName._5) {
            const higherDegreeNode = this.tryFormHigherDegreeWave(currentNodeCopy, pivotZigzag);
            if (higherDegreeNode) {
              queue.push(higherDegreeNode);
              currentNodeCopy.parentId = higherDegreeNode.id;
              completedWaves.push(currentNodeCopy);
              break;
            }
          } else {
            currentNodeCopy.subWaves.push(w2);
            currentNodeCopy.currentWave = w2.wave;
            queue.push(currentNodeCopy);
          }
        }
      }
    }

    return completedWaves;
  }

  private findNewWaves(node: WaveDiscoveryNode, pivotZigzag: Pivot[]): [Wave, Wave][] {
    const lastPivot = node.subWaves[node.subWaves.length - 1].pEnd;
    const lastPivotIndex = findPivotIndex(pivotZigzag, lastPivot);
    const remainingPivots = pivotZigzag.slice(lastPivotIndex);
    const impulsiveWaves = this.candleService.findFirstImpulsiveWave(remainingPivots).slice(0, 20);

    const p1WaveName = this.getNextWaveName(node.currentWave);
    const p2WaveName = this.getNextWaveName(p1WaveName);
    const newWaves = impulsiveWaves.map(([p0, p1, p2]) => {
      const { degree: foundDegree } = WaveDegreeCalculator.calculateWaveDegreeFromCandles([p0, p1], 'wave1');
      return [
        new Wave(p1WaveName, foundDegree, new ClusterPivot(p0, 'CONFIRMED'), new ClusterPivot(p1, 'CONFIRMED')),
        new Wave(p2WaveName, foundDegree, new ClusterPivot(p1, 'CONFIRMED'), new ClusterPivot(p2, 'CONFIRMED')),
      ];
    }) as [Wave, Wave][];

    return newWaves.filter(([w1]) => {
      if (w1.degree === WaveDegree.UNKNOWN || Math.abs(w1.degree - node.degree) > 2) {
        return false;
      }
      return true;
    });
  }

  private tryFormHigherDegreeWave(node: WaveDiscoveryNode, pivotZigzag: Pivot[]): WaveDiscoveryNode | null {
    const higherDegree = increaseDegree(node.degree);
    const [w1, , , , w5] = node.subWaves;
    if (!w1 || !w5) {
      console.error('tryFormHigherDegreeWave failt withouty waves??');
      return null;
    }

    const pStart = w1.pStart;
    const pEnd = w5.pEnd;
    const isTrendUp = node.trend === Trend.UP;

    const remainingPivots = pivotZigzag.slice(findPivotIndex(pivotZigzag, pEnd) + 1);

    const { type, pivot: wave2Pivot } =
      node.trend === Trend.UP ? getLLBeforeBreak(remainingPivots, pEnd) : getHHBeforeBreak(remainingPivots, pEnd);

    if (type !== 'FOUND-WITH-BREAK' || !wave2Pivot) return null;

    const wave1 = new Wave(WaveName._1, higherDegree, pStart, pEnd);
    const wave2 = new Wave(WaveName._2, higherDegree, pEnd, wave2Pivot);

    const initialNode: WaveDiscoveryNode = {
      id: v4(),
      parentId: null,
      trend: isTrendUp ? Trend.UP : Trend.DOWN,
      degree: higherDegree,
      currentWave: WaveName._2,
      subWaves: [wave1, wave2],
    };

    return initialNode;
  }

  private isWaveValid(currentNode: WaveDiscoveryNode, [newWave1, newWave2]: [Wave, Wave]): boolean {
    const waveCount = currentNode.subWaves.length;

    switch (waveCount) {
      case 2:
        return (
          this.isWave3Valid(currentNode.subWaves[0], currentNode.subWaves[1], newWave1) &&
          this.isWave4Valid(currentNode.subWaves[0], currentNode.subWaves[1], newWave1, newWave2)
        );
      case 4:
        return this.isWave5Valid(
          currentNode.subWaves[0],
          currentNode.subWaves[1],
          currentNode.subWaves[2],
          currentNode.subWaves[3],
          newWave1,
          newWave2,
        );

      case 0:
      case 1:
      default:
        console.error('IsValid waev should not print this!');
        return false;
    }
  }

  private isWave3Valid(wave1: Wave, wave2: Wave, wave3: Wave): boolean {
    return wave3.pEnd.price > wave1.pEnd.price;
  }

  private isWave4Valid(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave): boolean {
    return wave4.pEnd.price > wave2.pEnd.price && wave4.pEnd.price < wave3.pEnd.price;
  }

  private isWave5Valid(wave1: Wave, wave2: Wave, wave3: Wave, wave4: Wave, wave5: Wave, newWave2: Wave): boolean {
    return wave5.pEnd.price > wave3.pEnd.price;
  }

  private getNextWaveName(currentWave: WaveName): WaveName {
    switch (currentWave) {
      case WaveName._1:
        return WaveName._2;
      case WaveName._2:
        return WaveName._3;
      case WaveName._3:
        return WaveName._4;
      case WaveName._4:
        return WaveName._5;
      case WaveName._5:
        return WaveName._1;
      default:
        return WaveName._1;
    }
  }
  private convertToClusterWaves(nodes: WaveDiscoveryNode[]): ClusterWaves[] {
    const result: ClusterWaves[] = [];
    let remainingNodes = [...nodes];

    while (remainingNodes.length > 0) {
      // Find nodes with no children
      const bottomNodes = remainingNodes.filter((node) => !remainingNodes.some((n) => n.parentId === node.id));

      for (const node of bottomNodes) {
        if (!node.parentId || !remainingNodes.find((n) => n.id === node.parentId)) {
          // This is a top-level node or its parent is not in the remaining set, create a ClusterWaves
          const clusterWave = new ClusterWaves(node.subWaves, WaveType.MOTIVE, node.degree);
          result.push(clusterWave);
        } else {
          // Add this node's waves to its parents
          const parentNodes = remainingNodes.filter((n) => n.id === node.parentId);
          for (const parentNode of parentNodes) {
            const parentWave = parentNode.subWaves[0];
            if (parentWave) {
              parentWave.setChidren([...node.subWaves]);
            }
          }
        }
      }

      // Remove processed nodes
      remainingNodes = remainingNodes.filter((node) => !bottomNodes.includes(node));
    }

    return result;
  }
}
