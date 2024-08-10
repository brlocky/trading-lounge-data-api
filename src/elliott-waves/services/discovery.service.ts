import { Injectable } from '@nestjs/common';
import { ClusterPivot, ClusterWaves, Pivot, Wave } from '../class';
import { CandleTime, Fibonacci, findPivotIndex, getHHBeforeBreak, getLLBeforeBreak, WaveDegreeCalculator } from '../class/utils';
import { decreaseDegree, increaseDegree, Trend, WaveDegree, WaveName, WaveType } from '../enums';
import { Candle } from '../types';
import { CandleService } from './candle.service';
import { WaveInfoService } from './wave-info.service';
import { v4 } from 'uuid';
import { ChartService } from './chart.service';
import { WaveProjectionService } from './wave-projection.service';

interface WaveDiscoveryNode {
  id: string;
  degree: WaveDegree;
  trend: Trend;
  currentWave: WaveName;
  lookChildren: boolean;
  subWaves: Wave[];
  subNodeAlternatives: WaveDiscoveryNode[];
  parent: {
    id: string;
    wave: WaveName;
    targets: number[];
    invalidation: number;
  } | null;
}

@Injectable()
export class DiscoveryService {
  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
    private waveInfoService: WaveInfoService,
    private projectionService: WaveProjectionService,
  ) {}

  // Main method to find major structure in the given candles
  async findMajorStructure(candles: Candle[], definition = 3): Promise<ClusterWaves[]> {
    // Get zigzag pivots from candles
    const pivotZigzag = this.candleService.getZigZag(candles);

    // Find the first impulsive wave
    const impulseWavesTest = this.candleService.findFirstImpulsiveWave(pivotZigzag, candles);

    // Create charts for visualization
    this.chartService.createCandlestickChart(candles, impulseWavesTest.flat(), 'z_p1.png', true);
    this.chartService.createCandlestickChart(candles, pivotZigzag, 'z_p2.png', true);

    // Build initial scenarios
    const initialScenarios = this.buildInitialScenarios(candles, pivotZigzag, 20);
    if (initialScenarios.length === 0) return [];

    // Discover waves for each scenario
    const nodes: WaveDiscoveryNode[] = [];
    initialScenarios.forEach((scenario) => {
      const newNodes = this.discoverWaves(scenario, pivotZigzag, candles, definition);
      nodes.push(...newNodes);
    });

    // Convert discovered nodes to ClusterWaves
    const result = this.convertToClusterWaves(nodes);
    return result;
  }

  // Build initial scenarios based on the first impulsive wave
  buildInitialScenarios(
    candles: Candle[],
    pivots: Pivot[],
    scenariosCount: number,
    forcedDegree: WaveDegree | null = null,
  ): WaveDiscoveryNode[] {
    const impulsiveWaves = this.candleService.findFirstImpulsiveWave(pivots, candles);
    //this.chartService.createCandlestickChart(candles, impulsiveWaves.flat(), 'z_p2.png', true);

    return impulsiveWaves
      .map(([p0, p1, p2]) => {
        const { degree: autoDegree, useLogScale } = WaveDegreeCalculator.calculateWaveDegreeFromCandles(
          [p0 as CandleTime, p1 as CandleTime],
          'wave1',
        );

        let degree = autoDegree;
        if (forcedDegree) {
          degree = forcedDegree;
          if (Math.abs(forcedDegree - autoDegree) > 3) {
            return null;
          }
        }

        if (degree === WaveDegree.UNKNOWN) return null;

        const wave1 = new Wave(WaveName._1, degree, p0, p1);
        const wave2 = new Wave(WaveName._2, degree, p1, p2);

        const [wave3, wave4, wave5] = this.projectionService.projectImpulse(wave1, wave2, useLogScale);
        const isTrendUp = p0.price < p1.price;
        const initialNode: WaveDiscoveryNode = {
          id: v4(),
          parent: null,
          trend: isTrendUp ? Trend.UP : Trend.DOWN,
          degree: degree,
          currentWave: WaveName._2,
          subWaves: [wave1, wave2, wave3, wave4, wave5],
          subNodeAlternatives: [],
          lookChildren: true,
        };

        return initialNode;
      })
      .filter((r) => !!r)
      .slice(0, scenariosCount) as WaveDiscoveryNode[];
  }

  // Main wave discovery algorithm
  private discoverWaves(node: WaveDiscoveryNode, pivotZigzag: Pivot[], candles: Candle[], definition: number): WaveDiscoveryNode[] {
    const completedWaves: WaveDiscoveryNode[] = [];
    const queue: WaveDiscoveryNode[] = [node];
    const onHoldNodes: WaveDiscoveryNode[] = [];

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      //const currentNode = queue.pop()!;

      // Found 5 Waves
      // Build a new parent when possible or complete the current one.
      if (currentNode.currentWave === WaveName._5) {
        if (currentNode.parent) {
          const parentWaveCompleted = this.completeParentNode(currentNode, queue, onHoldNodes, completedWaves, pivotZigzag, candles);
          if (!parentWaveCompleted) {
            this.runParentAlternative(currentNode, queue, onHoldNodes);
          }
        } else {
          const higherDegreeNode = this.tryFormHigherDegreeWave(currentNode, pivotZigzag);
          if (higherDegreeNode) {
            queue.push(higherDegreeNode);
          } else {
            completedWaves.push(currentNode);
          }
        }
        continue;
      }

      if (currentNode.lookChildren) {
        if (currentNode.subNodeAlternatives.length) {
          this.startChildAlternative(currentNode, queue, onHoldNodes);
        } else {
          const subNodes = this.createSubNodes(currentNode, candles, pivotZigzag);
          let foundSubNodes = false;
          const lastWave = this.getLastConfirmedWave(currentNode.subWaves);
          const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(lastWave.degree);

          for (let i = 0; i < subNodes.length; i++) {
            const subNode = subNodes[i];
            const { useLogScale: subNodeUseLogScale } = WaveDegreeCalculator.getDegreeConfig(subNode.subWaves[0].degree);

            if (lastWave.length(useLogScale) - subNode.subWaves[0].length(subNodeUseLogScale) < 0) {
              break;
            }
            foundSubNodes = true;
            currentNode.subNodeAlternatives.push(subNode);
          }

          if (!foundSubNodes) currentNode.lookChildren = false;

          queue.push(currentNode);
        }
      } else {
        if (currentNode.currentWave === WaveName._4) {
          this.handleMissingWave5(currentNode, queue, onHoldNodes, completedWaves, pivotZigzag, candles);
        } else {
          // Get next waves
          const newWaves = this.getNextWaves(currentNode, pivotZigzag, candles);

          if (newWaves.length === 0) {
            if (!this.runParentAlternative(currentNode, queue, onHoldNodes)) {
              completedWaves.push(currentNode);
            }
            continue;
          }

          // Look for waves that match the next expected Wave
          for (const newImpulseWaves of newWaves) {
            const possibleNodes = [];

            if (this.isWaveValid(currentNode, newImpulseWaves, candles)) {
              const nodeClone = this.cloneDiscoveryNode(currentNode);

              this.updateNodeWithNewWaves(nodeClone, newImpulseWaves);
              possibleNodes.push(nodeClone);
              //queue.push(newNode);
              //break;
            }

            queue.push(...possibleNodes);
          }
        }
      }
    }

    //return completedWaves.concat(onHoldNodes);
    return completedWaves;
  }

  // Handle Wave 5
  private handleMissingWave5(
    node: WaveDiscoveryNode,
    queue: WaveDiscoveryNode[],
    onHoldNodes: WaveDiscoveryNode[],
    completedWaves: WaveDiscoveryNode[],
    pivots: Pivot[],
    candles: Candle[],
  ): boolean {
    if (node.currentWave !== WaveName._4) {
      throw new Error('Only works on wave 5');
    }

    const [wave1, , , wave4] = node.subWaves;

    const filteredPivots = this.getPivots(pivots, wave4.pEnd);

    if (filteredPivots.length < 3) {
      completedWaves.push(node);
      // TODO. close parent wave with this incomplete subwave
      return false;
    }

    const isUpTrend = wave1.trend() === Trend.UP;
    let found = false;
    let didFoundValidWave = false;
    for (let i = 0; i < filteredPivots.length; i += 2) {
      const [p4, p5] = filteredPivots.slice(i, i + 2);
      if (!p5) {
        break;
      }

      if (i > 0 && isUpTrend && p4.price <= wave4.pEnd.price) {
        break;
      }

      if (i > 0 && !isUpTrend && p4.price >= wave4.pEnd.price) {
        break;
      }

      const wave = new Wave(WaveName._5, wave4.degree, p4, p5);

      if (!this.isWaveValid(node, [wave, wave], candles)) {
        if (didFoundValidWave) {
          break;
        }
        continue;
      }

      didFoundValidWave = true;

      const clone = this.cloneDiscoveryNode(node);

      // update clone
      this.replaceWaveInSubWaves(clone.subWaves, wave);
      clone.currentWave = WaveName._5;

      if (clone.parent) {
        const parentWaveCompleted = this.completeParentNode(clone, queue, onHoldNodes, completedWaves, pivots, candles);
        if (parentWaveCompleted) {
          found = true;
          //break;
        }
      } else {
        found = true;
        queue.push(clone);
        /*   break; */
      }
    }

    if (!found) {
      return false;
    }

    return true;
  }

  // Update node with new waves
  private updateNodeWithNewWaves(currentNode: WaveDiscoveryNode, newImpulseWaves: [Wave, Wave]) {
    const [w1, w2] = newImpulseWaves;

    // Sync new Waves Degree with expected degree
    const { degree } = currentNode.subWaves[0];
    w1.degree = degree;
    w2.degree = degree;

    this.replaceWaveInSubWaves(currentNode.subWaves, w1);
    currentNode.currentWave = w1.wave;

    if (w1.wave === WaveName._3) {
      this.replaceWaveInSubWaves(currentNode.subWaves, w2);
      currentNode.currentWave = w2.wave;
    }
  }

  // Create subnodes for further wave discovery
  private createSubNodes(parentNode: WaveDiscoveryNode, candles: Candle[], pivotZigzag: Pivot[]): WaveDiscoveryNode[] {
    const subDegree = decreaseDegree(parentNode.degree);
    const lastWave = this.getLastConfirmedWave(parentNode.subWaves);
    const projectedWave = this.getFirstProjectedWave(parentNode.subWaves);

    const pivots = this.getPivots(pivotZigzag, lastWave.pEnd);
    const subScenarios = this.buildInitialScenarios(candles, pivots, 4, parentNode.degree - 1);

    return subScenarios.map((s) => ({
      ...s,
      degree: subDegree,
      parent: {
        id: parentNode.id,
        wave: parentNode.currentWave + 1,
        targets: [projectedWave.pEnd.price],
        invalidation: projectedWave.pStart.price,
      },
    }));
  }

  // Clone a WaveDiscoveryNode
  private cloneDiscoveryNode(node: WaveDiscoveryNode): WaveDiscoveryNode {
    return {
      ...node,
      id: v4(),
      subWaves: node.subWaves.map((s) => s.copy()),
    };
  }

  // Replace a wave in the subWaves array
  private replaceWaveInSubWaves(subWaves: Wave[], newWave: Wave) {
    const updateWaveIndex = subWaves.findIndex((w) => w.wave === newWave.wave);
    if (updateWaveIndex === -1) {
      throw new Error('Cannot find wave to replace');
    }

    subWaves[updateWaveIndex] = newWave;
  }

  private startChildAlternative(node: WaveDiscoveryNode, queue: WaveDiscoveryNode[], onHoldNodes: WaveDiscoveryNode[]) {
    const nodeExists = onHoldNodes.find((h) => h.id === node.id);
    if (nodeExists || !node.subNodeAlternatives.length) {
      throw new Error('Could not start new parent alternative');
    }
    onHoldNodes.push(node);
    const alternative = node.subNodeAlternatives.shift();
    if (!alternative) {
      throw new Error('Could find alterntives');
    }

    queue.push(alternative);
  }

  // Run Parent Node alternative
  private runParentAlternative(node: WaveDiscoveryNode, queue: WaveDiscoveryNode[], onHoldNodes: WaveDiscoveryNode[]): boolean {
    if (!node.parent?.id) return false;

    const parent = onHoldNodes.find((h) => h.id === node.parent?.id);
    if (!parent) {
      throw new Error(`Could not start new parent alternative ${node.parent?.id}`);
    }

    const alternative = parent.subNodeAlternatives.shift();
    if (alternative) {
      console.log('Using next Alternative on', node.parent?.id);
      queue.push(alternative);
    } else {
      console.log('No more alternatives add parent to queue to find next Wave', node.parent?.id);
      //onHoldNodes.splice(onHoldNodes.indexOf(parent), 1);
      parent.lookChildren = false;
      queue.push(parent);
    }

    return true;
  }

  // Complete the parent node when a child node is completed
  private completeParentNode(
    node: WaveDiscoveryNode,
    queue: WaveDiscoveryNode[],
    onHoldNodes: WaveDiscoveryNode[],
    completedWaves: WaveDiscoveryNode[],
    pivotZigzag: Pivot[],
    candles: Candle[],
  ): boolean {
    const parentNode = onHoldNodes.find((n) => n.id === node.parent?.id);
    if (!parentNode) {
      throw new Error(`Could not find parent Node ${node.parent?.id}`);
    }

    const clonedNode = this.cloneDiscoveryNode(parentNode);
    const { pStart } = node.subWaves[0];
    const { pEnd } = this.getLastConfirmedWave(node.subWaves);
    const remainingPivots = this.getPivots(pivotZigzag, pEnd, 1);

    const { type, pivot: wave2Pivot } =
      node.trend === Trend.UP ? getLLBeforeBreak(remainingPivots, pEnd) : getHHBeforeBreak(remainingPivots, pEnd);

    if (type !== 'FOUND-WITH-BREAK' || !wave2Pivot) return false;

    const p3or5WaveName = this.getNextWaveName(clonedNode.currentWave);
    const wave3or5 = new Wave(p3or5WaveName, clonedNode.degree, pStart, pEnd);
    wave3or5.setChidren(node.subWaves);

    this.replaceWaveInSubWaves(clonedNode.subWaves, wave3or5);
    clonedNode.currentWave = wave3or5.wave;

    const p4WaveName = this.getNextWaveName(p3or5WaveName);
    const wave4 = new Wave(p4WaveName, clonedNode.degree, pEnd, wave2Pivot);

    // Next wave has to be wave 4
    if (p3or5WaveName == 3) {
      this.replaceWaveInSubWaves(clonedNode.subWaves, wave4);
      clonedNode.currentWave = wave4.wave;
    }

    if (!this.isWaveValid(clonedNode, [wave3or5, wave4], candles)) return false;

    queue.push(clonedNode);

    return true;
  }

  // Find new waves to continue the wave structure
  private getNextWaves(node: WaveDiscoveryNode, pivotZigzag: Pivot[], candles: Candle[]): [Wave, Wave][] {
    if (node.currentWave === WaveName._5) throw new Error('Find new Waves. Wave 5 cannot use this method');

    const lastPivot = this.getLastConfirmedWave(node.subWaves).pEnd;
    const remainingPivots = this.getPivots(pivotZigzag, lastPivot);
    const impulsiveWaves = this.candleService.findFirstImpulsiveWave(remainingPivots, candles);

    const p1WaveName = this.getNextWaveName(node.currentWave);
    const p2WaveName = this.getNextWaveName(p1WaveName);
    const newWaves = impulsiveWaves.map(([p0, p1, p2]) => {
      const { degree } = WaveDegreeCalculator.calculateWaveDegreeFromCandles([p0, p1], 'wave1');
      return [new Wave(p1WaveName, degree, p0, p1), new Wave(p2WaveName, degree, p1, p2)];
    }) as [Wave, Wave][];

    return newWaves.filter(([w1]) => {
      if (w1.degree === WaveDegree.UNKNOWN) {
        return false;
      }

      // Search only for possible related degrees
      if (Math.abs(w1.degree - node.degree) > 5) {
        return false;
      }

      return true;
    });
  }

  // Try to form a higher degree wave
  private tryFormHigherDegreeWave(node: WaveDiscoveryNode, pivotZigzag: Pivot[]): WaveDiscoveryNode | null {
    const higherDegree = increaseDegree(node.degree);
    const [w1, , , , w5] = node.subWaves;
    if (node.subWaves.length !== 5) {
      throw new Error('tryFormHigherDegreeWave failt withouty waves??');
    }

    const pStart = w1.pStart;
    const pEnd = w5.pEnd;
    const isTrendUp = node.trend === Trend.UP;

    const remainingPivots = this.getPivots(pivotZigzag, pEnd, 1);

    const { type, pivot: wave2Pivot } =
      node.trend === Trend.UP ? getLLBeforeBreak(remainingPivots, pEnd) : getHHBeforeBreak(remainingPivots, pEnd);

    if ((type !== 'FOUND-WITH-BREAK' && type !== 'FOUND-NO-BREAK') || !wave2Pivot) return null;

    // min retracement
    const fib = new Fibonacci();

    const { useLogScale: useLogScaleCurrentWave } = WaveDegreeCalculator.calculateWaveDegreeFromCandles([pStart, pEnd]);

    fib.setLogScale(useLogScaleCurrentWave);
    const retracement = fib.getRetracementPercentage(pStart.price, pEnd.price, wave2Pivot.price);
    if (retracement < 23.6) {
      return null;
    }

    const cp2 = new ClusterPivot(pEnd, 'CONFIRMED');
    const wave1 = new Wave(WaveName._1, higherDegree, new ClusterPivot(pStart, 'CONFIRMED'), cp2);
    const wave2 = new Wave(WaveName._2, higherDegree, cp2, new ClusterPivot(wave2Pivot, 'CONFIRMED'));

    const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(higherDegree);
    const [wave3, wave4, wave5] = this.projectionService.projectImpulse(wave1, wave2, useLogScale);
    wave1.setChidren(node.subWaves);
    const initialNode: WaveDiscoveryNode = {
      id: v4(),
      parent: null,
      trend: isTrendUp ? Trend.UP : Trend.DOWN,
      degree: higherDegree,
      currentWave: WaveName._2,
      subWaves: [wave1, wave2, wave3, wave4, wave5],
      subNodeAlternatives: [],
      lookChildren: true,
    };

    return initialNode;
  }

  // Validate wave structure
  private isWaveValid(currentNode: WaveDiscoveryNode, [newWave1, newWave2]: [Wave, Wave], candles: Candle[]): boolean {
    const waveCount = currentNode.currentWave;

    switch (waveCount) {
      case 2:
        return this.isWave3and4Valid(currentNode, newWave1, newWave2, candles);
      case 4:
      case 5:
        return this.isWave5Valid(currentNode, newWave1, candles);

      default:
        throw new Error('IsValid waev should not print this!');
    }
  }

  // Validate Wave 3 and 4
  private isWave3and4Valid(currentNode: WaveDiscoveryNode, wave3: Wave, wave4: Wave, candles: Candle[]): boolean {
    const [wave1, wave2] = currentNode.subWaves;
    const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(wave1.degree);
    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);
    // We need to projet a wave 5 because the infoService only supports 5 waves
    const expectedWave5 = this.projectionService.projectWave5(wave1, wave2, wave4, useLogScale);
    const [bestWaveInfo] = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, expectedWave5, useLogScale, commonInterval);
    if (!bestWaveInfo) return false;
    const { isValid } = bestWaveInfo;
    if (!isValid.structure) return false;
    if (!isValid.wave) return false;
    if (!isValid.time) return false;

    return true;
  }

  // Validate Wave 5
  private isWave5Valid(currentNode: WaveDiscoveryNode, wave5: Wave, candles: Candle[]): boolean {
    const [wave1, wave2, wave3, wave4] = currentNode.subWaves;
    const { useLogScale } = WaveDegreeCalculator.getDegreeConfig(wave1.degree);
    const commonInterval = WaveDegreeCalculator.determineCommonInterval(candles);
    const [bestWaveInfo] = this.waveInfoService.getWaveInformation(wave1, wave2, wave3, wave4, wave5, useLogScale, commonInterval);
    if (!bestWaveInfo) return false;
    const { isValid } = bestWaveInfo;
    if (!isValid.structure) return false;
    if (!isValid.wave) return false;
    if (!isValid.time) return false;

    return true;
  }

  // Get the next wave name in the sequence
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

  // Convert WaveDiscoveryNodes to ClusterWaves
  private convertToClusterWaves2(nodes: WaveDiscoveryNode[]): ClusterWaves[] {
    const result: ClusterWaves[] = [];

    for (const node of nodes) {
      const clusterWave = new ClusterWaves(node.subWaves, WaveType.MOTIVE, node.degree);
      result.push(clusterWave);
    }

    return result;
  }
  private convertToClusterWaves(nodes: WaveDiscoveryNode[]): ClusterWaves[] {
    const result: ClusterWaves[] = [];
    let remainingNodes = [...nodes];

    while (remainingNodes.length > 0) {
      // Find nodes with no children
      const bottomNodes = remainingNodes.filter((node) => !remainingNodes.some((n) => n.parent?.id === node.id));

      for (const node of bottomNodes) {
        if (!node.parent || !remainingNodes.find((n) => n.id === node.parent?.id)) {
          // This is a top-level node or its parent is not in the remaining set, create a ClusterWaves
          const clusterWave = new ClusterWaves(node.subWaves, WaveType.MOTIVE, node.degree);
          result.push(clusterWave);
        } else {
          // Add this node's waves to its parents
          const parentNodes = remainingNodes.filter((n) => n.id === node.parent?.id);
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

  // Get remaining pivots after a specific pivot
  private getPivots(pivotZigzag: Pivot[], slicePivot: Pivot, offset: number = 0): Pivot[] {
    const index = findPivotIndex(pivotZigzag, slicePivot) + offset;
    const pivots = pivotZigzag.slice(index);

    return pivots;
  }

  // Get the last confirmed wave from a list of waves
  private getLastConfirmedWave(waves: Wave[]): Wave {
    const reversedWaves = [...waves].reverse();
    const lastWave = reversedWaves.find((w) => w.pEnd.status === 'CONFIRMED');
    if (!lastWave) throw new Error('Could not find last Confirmed Wave');

    return lastWave;
  }

  // Get the last confirmed wave from a list of waves
  private getFirstProjectedWave(waves: Wave[]): Wave {
    const firstProjectedWave = waves.find((w) => w.pEnd.status === 'PROJECTED');
    if (!firstProjectedWave) throw new Error('Could not find first Projected Wave');

    return firstProjectedWave;
  }
}
