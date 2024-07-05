import { Injectable } from '@nestjs/common';
import { CandleDto } from 'src/search/dto';
import { Fibonacci } from '../class/utils/fibonacci.class';
import { MotiveContractingDiagonal } from '../class/wave/motive/motive-contracting-diagonal.class';
import { MotiveExpandingDiagonal } from '../class/wave/motive/motive-expanding-diagonal.class';
import { MotiveExtendedWave1 } from '../class/wave/motive/motive-extended-wave-1.class';
import { MotiveExtendedWave3 } from '../class/wave/motive/motive-extended-wave-3.class';
import { degreeToString, Degree, WaveName } from '../enums';
import { MotiveWaveInterface } from '../interfaces/motive-wave.interface';
import { ClusterWaves, Pivot, CandlesInfo, Wave } from '../types';
import { CandleService } from './candle.service';
import { ChartService } from './chart.service';
import { ClusterService } from './cluster.service';
import { WaveDegreeCalculator } from '../class/utils';
import { AIService } from 'src/ai/ai.service';

interface AIWave {
  from: string;
  to: string;
  label: number;
}
interface AICluster {
  waves: AIWave[];
}

@Injectable()
export class WaveCalculationServiceAI {
  constructor(
    private candleService: CandleService,
    private chartService: ChartService,
    private clusterService: ClusterService,
    private aiService: AIService,
  ) {}

  convertAIResultToCluster(aiClusters: AICluster[], pivots: Pivot[]): ClusterWaves[] {
    const clusters: ClusterWaves[] = [];
    aiClusters.forEach((c) => {
      const waves: Wave[] = [];
      c.waves.forEach(({ from, to, label }) => {
        const p1 = pivots.find((p) => p.id === from);
        const p2 = pivots.find((p) => p.id === to);
        if (!p1 || !p2) {
          throw new Error('Fail to find pivots by ID');
        }
        waves.push(new Wave(label, 14, p1, p2));
      });

      clusters.push(new ClusterWaves(waves));
    });

    return clusters;
  }

  async getWaveCounts(candles: CandleDto[], degree: number, logScale: boolean, definition: number): Promise<ClusterWaves[]> {
    const {
      pivots,
      retracements,
      degree: { value: candlesDegree },
    } = this.getPivotsInfo(candles, 21);

    this.chartService.createCandlestickChart(candles, pivots, 'z-wave-count.png', false);
    this.chartService.createCandlestickChart(candles, retracements, 'z-scale-wave-count.png', true);

    const degree2Use = degree === 0 ? candlesDegree : degree;

    const elliottWaveAnalystPrompt = `
    # Elliott Wave Analyst Prompt
    
    ## Objective
    Analyze the given price pivots using Elliott Wave principles to identify valid wave structures, focusing on accurate classification of waves 1, 2, 3, 4, 5, and A, B, C (represented as 6, 7, 8).
    
    ## Key Rules
    1. Wave 1 always starts from the first pivot.
    2. Wave 2 must not retrace more than 100% of Wave 1.
    3. Wave 3 cannot be the shortest among waves 1, 3, and 5.
    4. Wave 4 must not overlap with Wave 1's price territory.
    5. All waves must follow the correct sequence and direction.
    
    ## Pivot and Wave Definitions
    - Pivot Types: 1 (Higher High/Low), -1 (Lower Low/High)
    - Wave Directions and Labels:
      - Upward: 1, 3, 5, 7 (B)
      - Downward: 2, 4, 6 (A), 8 (C)
    
    ## Analysis Tasks
    1. Identify potential 5-wave impulse structures.
    2. Classify pivots into appropriate wave labels.
    3. Ensure all waves adhere to Elliott Wave rules.
    4. Generate up to 3 most probable wave counts.
    
    ## Output Format
    Provide results as a JSON array of wave count scenarios:
    
    \`\`\`json
    [
      {
        "waves": [
          {"from": "pivotId", "to": "pivotId", "label": 1},
          {"from": "pivotId", "to": "pivotId", "label": 2},
          {"from": "pivotId", "to": "pivotId", "label": 3},
          {"from": "pivotId", "to": "pivotId", "label": 4},
          {"from": "pivotId", "to": "pivotId", "label": 5},
          {"from": "pivotId", "to": "pivotId", "label": 6}, 
          {"from": "pivotId", "to": "pivotId", "label": 7}, 
          {"from": "pivotId", "to": "pivotId", "label": 8} 
        ]
      },
      ...
    ]
    \`\`\`
    
    ## Wave Label Mapping
    - 1, 2, 3, 4, 5: Impulse waves
    - 6: Wave A
    - 7: Wave B
    - 8: Wave C
    
    ## Input Data - Pivots
    The following data should be analyzed:
    \`\`\`json
   ${JSON.stringify(retracements, null, 2)}
    \`\`\`
    
    ## Additional Guidelines
    1. Prioritize adherence to Elliott Wave rules over fitting all pivots.
    2. Consider alternative counts if the primary doesn't fit perfectly.
    3. Ensure wave 2 doesn't break the starting point of wave 1.
    4. Validate that pivots classified as wave 1 are indeed highs, not lows.
    5. Use numerical labels 6, 7, and 8 for waves A, B, and C respectively.
    
    ## Example Input and Output
    
    ### Input:
    \`\`\`json
    [
      {
        "id": "6a7a8e49-4a99-492b-ab64-6403b9967f91",
        "type": -1,
        "price": 0.113839,
        "time": 867763800
      },
      {
        "id": "c323eec7-d0bd-4924-834d-708b6d135701",
        "type": 1,
        "price": 0.265625,
        "time": 870442200
      },
      {
        "id": "b43a2351-4626-4b1d-af9a-b73e0a61f89a",
        "type": -1,
        "price": 0.113839,
        "time": 880986600
      },
      {
        "id": "09eae808-ab7a-49b0-afbe-ba4f908447f2",
        "type": 1,
        "price": 0.178571,
        "time": 883665000
      }
    ]
    \`\`\`
    
    ### Output:
    \`\`\`json
    [
      {
        "waves": [
          {"from": "pivot1", "to": "pivot2", "label": 1},
          {"from": "pivot2", "to": "pivot3", "label": 2},
          {"from": "pivot3", "to": "pivot4", "label": 3},
          {"from": "pivot4", "to": "pivot5", "label": 4},
          {"from": "pivot5", "to": "pivot6", "label": 5},
          {"from": "pivot6", "to": "pivot7", "label": 6},
          {"from": "pivot7", "to": "pivot8", "label": 7},
          {"from": "pivot8", "to": "pivot9", "label": 8}
        ]
      }
    ]
    \`\`\`
    `;

    const aiResponse = await this.aiService.runModel({
      max_tokens: 4096,
      temperature: 0,
      prompt: elliottWaveAnalystPrompt,
    });

    //"\n# Elliott Wave Analyst Prompt\n\n## Objective\nAnalyze given price pivots using Elliott Wave principles to identify valid wave structures, focusing on accurate classification of waves 1, 2, 3, 4, 5, and A, B, C (represented as 6, 7, 8).\n\n## Key Rules\n1. Wave 1 always starts from the first pivot.\n2. Wave 2 must not retrace more than 100% of Wave 1.\n3. Wave 3 cannot be the shortest among waves 1, 3, and 5.\n4. Wave 4 must not overlap with Wave 1's price territory.\n5. All waves must follow the correct sequence and direction.\n\n## Pivot and Wave Definitions\n- Pivot Types: 1 (Higher High/Low), -1 (Lower Low/High)\n- Wave Directions and Labels:\n  - Upward: 1, 3, 5, 7 (B)\n  - Downward: 2, 4, 6 (A), 8 (C)\n\n## Analysis Tasks\n1. Identify potential 5-wave impulse structures.\n2. Classify pivots into appropriate wave labels.\n3. Ensure all waves adhere to Elliott Wave rules.\n4. Generate up to 3 most probable wave counts.\n\n## Output Format\nProvide results as a JSON array of wave count scenarios:\n\n[\n  {\n    \"waves\": [\n      {\"from\": \"pivotId\", \"to\": \"pivotId\", \"label\": 1},\n      {\"from\": \"pivotId\", \"to\": \"pivotId\", \"label\": 2},\n      ...\n      {\"from\": \"pivotId\", \"to\": \"pivotId\", \"label\": 6}, // Wave A\n      {\"from\": \"pivotId\", \"to\": \"pivotId\", \"label\": 7}, // Wave B\n      {\"from\": \"pivotId\", \"to\": \"pivotId\", \"label\": 8}  // Wave C\n    ]\n  },\n  ...\n]\n\n## Wave Label Mapping\n- 1, 2, 3, 4, 5: Impulse waves\n- 6: Wave A\n- 7: Wave B\n- 8: Wave C\n\n## Input Data\nRetracement data will be provided in the following format:\n[{\"id\":\"7e668b1c-f656-4bcc-a5bd-1b5d420644f7\",\"candleIndex\":0,\"type\":-1,\"price\":0.049107,\"time\":394378200},{\"id\":\"26e920c7-59e6-4c6d-bf43-1a530de66656\",\"candleIndex\":5,\"type\":1,\"price\":0.155692,\"time\":407601000},{\"id\":\"02c3150c-7d7f-4a42-a69d-67a963e8301b\",\"candleIndex\":6,\"type\":-1,\"price\":0.121652,\"time\":410452200},{\"id\":\"02117085-3039-4ad8-8992-ef0b4d358a42\",\"candleIndex\":11,\"type\":1,\"price\":0.282366,\"time\":423322200},{\"id\":\"cdea8769-76b5-4420-a21a-31722b683574\",\"candleIndex\":37,\"type\":-1,\"price\":0.063616,\"time\":491751000},{\"id\":\"f2078705-2f10-45a3-bafc-29a50a093a6f\",\"candleIndex\":47,\"type\":1,\"price\":0.174665,\"time\":518103000},{\"id\":\"c97302f1-0c92-4d6c-8ca3-05122bb52858\",\"candleIndex\":48,\"type\":-1,\"price\":0.133928,\"time\":520608600},{\"id\":\"040673f6-4b7a-4df4-8b50-d7ab32ac46bd\",\"candleIndex\":63,\"type\":1,\"price\":0.533482,\"time\":560093400},{\"id\":\"5353cdbf-f28f-439c-bb8b-c2b11d87e58d\",\"candleIndex\":99,\"type\":-1,\"price\":0.216518,\"time\":654787800},{\"id\":\"ea3fcf0f-f8f3-484c-b069-b0aedad70300\",\"candleIndex\":105,\"type\":1,\"price\":0.654017,\"time\":670516200},{\"id\":\"4c387ba5-9282-4ab4-a4ff-892a0c3b4a9e\",\"candleIndex\":185,\"type\":-1,\"price\":0.113839,\"time\":880986600},{\"id\":\"73f2e4dc-ea12-40db-871e-32a29ede7ea1\",\"candleIndex\":193,\"type\":1,\"price\":0.390625,\"time\":902151000},{\"id\":\"c2c37c4a-e8a9-4b77-9a9e-09e7c08a1f44\",\"candleIndex\":195,\"type\":-1,\"price\":0.254464,\"time\":907248600},{\"id\":\"6d4c1c3e-991b-4f2f-b8ec-b79fd700cf24\",\"candleIndex\":195,\"type\":1,\"price\":0.368861,\"time\":907248600},{\"id\":\"de45fee1-9f70-4bfb-8063-0197dbac7e1d\",\"candleIndex\":197,\"type\":-1,\"price\":0.282366,\"time\":912522600},{\"id\":\"78b16641-ea5a-48e4-ac0e-6eab4ee17457\",\"candleIndex\":198,\"type\":1,\"price\":0.422433,\"time\":915201000},{\"id\":\"35b28235-531f-4b70-aea3-8b225acd2ba8\",\"candleIndex\":200,\"type\":-1,\"price\":0.285714,\"time\":920298600},{\"id\":\"577a3f3a-6c93-4d07-9761-65f69d48efc2\",\"candleIndex\":206,\"type\":1,\"price\":0.715401,\"time\":936192600},{\"id\":\"d6bfcf03-d4c7-49f2-baa1-9d79c83bff03\",\"candleIndex\":206,\"type\":-1,\"price\":0.512834,\"time\":936192600},{\"id\":\"d8eb5c90-e284-4b92-8012-4a952b0b4725\",\"candleIndex\":210,\"type\":1,\"price\":1.08482,\"time\":946909800},{\"id\":\"a79f27cb-2b16-4d6a-932c-f5032eae248f\",\"candleIndex\":210,\"type\":-1,\"price\":0.772321,\"time\":946909800},{\"id\":\"5086709c-d629-4999-8210-2b1c13f8be45\",\"candleIndex\":212,\"type\":1,\"price\":1.342633,\"time\":951921000},{\"id\":\"1bc27280-c72a-460a-8343-d2342f0f8f9d\",\"candleIndex\":249,\"type\":-1,\"price\":0.227143,\"time\":1049207400},{\"id\":\"7dedbdb0-4ec5-49c1-997a-7776f9716e23\",\"candleIndex\":255,\"type\":1,\"price\":0.446625,\"time\":1065015000},{\"id\":\"22203a56-3733-4077-82b2-4ee3c09d1e4f\",\"candleIndex\":257,\"type\":-1,\"price\":0.34375,\"time\":1070289000},{\"id\":\"805eb168-40e6-4a1c-81ca-bd60ecaa8e69\",\"candleIndex\":271,\"type\":1,\"price\":1.622856,\"time\":1107268200},{\"id\":\"81c1ea46-a27e-4c09-ab2e-3e98d7b46ba2\",\"candleIndex\":274,\"type\":-1,\"price\":1.182499,\"time\":1115040600},{\"id\":\"71bc505f-8d92-4b20-827d-454eb79a9cee\",\"candleIndex\":282,\"type\":1,\"price\":3.085711,\"time\":1136298600},{\"id\":\"0b1b8216-f518-4d61-a447-caea260d4c46\",\"candleIndex\":288,\"type\":-1,\"price\":1.791427,\"time\":1151933400},{\"id\":\"a1ef86c0-cfd8-42ba-9500-8acd7bf677f6\",\"candleIndex\":300,\"type\":1,\"price\":5.318566,\"time\":1183383000},{\"id\":\"d94de694-c2b3-4bf7-9962-8bac74f47d7d\",\"candleIndex\":301,\"type\":-1,\"price\":3.986425,\"time\":1185975000},{\"id\":\"82d8cb8e-0d30-474c-b9d7-c37c44070af0\",\"candleIndex\":304,\"type\":1,\"price\":6.881421,\"time\":1193923800},{\"id\":\"c4a1ca5c-fcae-4123-9290-4949f57375cb\",\"candleIndex\":304,\"type\":-1,\"price\":5.379637,\"time\":1193923800},{\"id\":\"90b42449-6734-49e2-a347-efc5739014a6\",\"candleIndex\":305,\"type\":1,\"price\":7.248565,\"time\":1196692200},{\"id\":\"1aa66ff7-05d1-48a3-a19d-375494c2e927\",\"candleIndex\":318,\"type\":-1,\"price\":2.792854,\"time\":1230906600},{\"id\":\"0d1bd313-218c-4622-aa3f-566def329837\",\"candleIndex\":333,\"type\":1,\"price\":9.730703,\"time\":1270128600},{\"id\":\"97d7346c-890d-454d-a29b-f5f5bd911cda\",\"candleIndex\":334,\"type\":-1,\"price\":7.116064,\"time\":1272893400},{\"id\":\"88090722-2287-461c-9f6d-6c900dd5d2c6\",\"candleIndex\":362,\"type\":1,\"price\":25.181049,\"time\":1346765400},{\"id\":\"4b9931ad-52db-4b7a-8cdc-6609171192cc\",\"candleIndex\":369,\"type\":-1,\"price\":13.753561,\"time\":1364823000},{\"id\":\"35e06149-14b1-4958-9427-ffeceb95c939\",\"candleIndex\":393,\"type\":1,\"price\":33.635,\"time\":1427895000},{\"id\":\"09c331bd-a2e5-4e61-b35f-fc6cf83a04f2\",\"candleIndex\":406,\"type\":-1,\"price\":22.3675,\"time\":1462195800},{\"id\":\"d5fda1f8-3bd0-441f-bca7-589e4dc02f65\",\"candleIndex\":435,\"type\":1,\"price\":58.3675,\"time\":1538400600},{\"id\":\"605e2390-0526-4776-8778-320e431374f3\",\"candleIndex\":438,\"type\":-1,\"price\":35.5,\"time\":1546439400},{\"id\":\"02c35b6d-b897-4f09-a2e3-f6535ceab247\",\"candleIndex\":450,\"type\":1,\"price\":81.9625,\"time\":1577975400},{\"id\":\"ae7f5ac9-3662-4204-b76f-0f4811ce155b\",\"candleIndex\":452,\"type\":-1,\"price\":53.1525,\"time\":1583159400},{\"id\":\"e09d1d0d-a43c-494c-b268-975cdb8b4393\",\"candleIndex\":458,\"type\":1,\"price\":137.98,\"time\":1598967000},{\"id\":\"31de1991-58a0-4fad-855c-afafaac023b9\",\"candleIndex\":458,\"type\":-1,\"price\":103.1,\"time\":1598967000},{\"id\":\"99b39cb9-3435-4656-8343-880c8056d416\",\"candleIndex\":474,\"type\":1,\"price\":182.94,\"time\":1641220200},{\"id\":\"0dd87c19-1635-44fa-9c71-bc98c4872e3c\",\"candleIndex\":486,\"type\":-1,\"price\":124.17,\"time\":1672756200},{\"id\":\"eca18eef-1e2a-449e-bc67-74a5b5aa45c0\",\"candleIndex\":504,\"type\":1,\"price\":221.55,\"time\":1719840600}]\n\n## Additional Guidelines\n1. Prioritize adherence to Elliott Wave rules over fitting all pivots.\n2. Consider alternative counts if the primary doesn't fit perfectly.\n3. Ensure wave 2 doesn't break the starting point of wave 1.\n4. Validate that pivots classified as wave 1 are indeed highs, not lows.\n5. Use numerical labels 6, 7, and 8 for waves A, B, and C respectively.\n"

    /*  [
      {
        "waves": [
          {"from": "daee5d05-5850-4763-8c8f-7ac80a303fb0", "to": "067fd201-02dd-4b39-a0f0-63c0bac1b55d", "label": 1, "degree": 1},
          {"from": "067fd201-02dd-4b39-a0f0-63c0bac1b55d", "to": "a8086145-0d66-45e9-ae0e-ba8e9c7d8e2f", "label": 2, "degree": 1},
          {"from": "a8086145-0d66-45e9-ae0e-ba8e9c7d8e2f", "to": "d002dd59-c645-4167-9fe6-8dfa0d105d09", "label": 3, "degree": 1},
          {"from": "d002dd59-c645-4167-9fe6-8dfa0d105d09", "to": "248c6f95-2c48-4aa2-bd2e-9fe62512e2f1", "label": 4, "degree": 1},
          {"from": "248c6f95-2c48-4aa2-bd2e-9fe62512e2f1", "to": "d0c9f01f-927b-4a18-abac-b6f5f4f90e65", "label": 5, "degree": 1}
        ]
      },
      {
        "waves": [
          {"from": "20ded421-6757-4d40-90b0-a20b372d9b89", "to": "165b7a21-8e48-4282-a2d6-e41230e74e51", "label": 1, "degree": 5},
          {"from": "165b7a21-8e48-4282-a2d6-e41230e74e51", "to": "3df14baf-435e-4b7e-99c0-e58f67bc5d9a", "label": 3, "degree": 5},
          {"from": "3df14baf-435e-4b7e-99c0-e58f67bc5d9a", "to": "9064b1b1-28d6-44c8-af34-ca72b2dc6f0c", "label": 4, "degree": 5},
          {"from": "9064b1b1-28d6-44c8-af34-ca72b2dc6f0c", "to": "3cccf198-3f9b-45aa-8824-5d290fd56150", "label": 5, "degree": 5}
        ]
      }
    ] */

    const response = (aiResponse as string[]).join('');
    console.log('Response ', response);
    const extractJson = (text: string): object[] => {
      // Use a regular expression to extract the JSON array
      const match = text.match(/```json\s*([^`]+)\s*```/);
      if (match) {
        const jsonString = match[1].trim();
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          console.error('Failed to parse JSON:', error);
        }
      } else {
        console.error('No JSON found in the provided text.');
      }
      return [];
    };

    const waveCounts = extractJson(response) as AICluster[];
    const aiClusters = this.convertAIResultToCluster(waveCounts, pivots);
    console.log(aiClusters);

    return aiClusters;
    const majorClusters = this.clusterService.findMajorStructure(pivots, candles);
    return majorClusters;
    console.log('majorClusters', majorClusters);
    this.chartService.createCandlestickChart(candles, pivots, 'z-wave-count.png', false);
    this.chartService.createCandlestickChart(candles, retracements, 'z-scale-wave-count.png', true);

    const motivePatterns = this.getWave1Patterns(candles, retracements, degree2Use, logScale);

    const waveClusters: ClusterWaves[] = [];
    for (const pattern of motivePatterns) {
      const clusters = pattern.find();
      if (!clusters.length) continue;
      waveClusters.push(...clusters);
    }

    return waveClusters;
  }

  getSubWaveCounts(candles: CandleDto[], degree: number, startPivot: Pivot, endPivot: Pivot, logScale: boolean): ClusterWaves[] {
    const pivots = this.candleService.getZigZag(candles);

    this.chartService.createCandlestickChart(candles, pivots, 'z-wave-count.png', false);

    const motivePatterns = this.getWave1Patterns(candles, pivots, degree - 1, logScale);

    const isTargetInsidePivots = !!pivots.find(
      (p) => endPivot && p.time === endPivot.time && p.price === endPivot.price && p.type === endPivot.type,
    );

    const waveClusters: ClusterWaves[] = [];
    for (const pattern of motivePatterns) {
      isTargetInsidePivots && pattern.setTargetPivot(endPivot);
      const clusters = pattern.find();
      if (!clusters.length) continue;
      waveClusters.push(...clusters);
    }

    const filteredCluster = isTargetInsidePivots
      ? waveClusters.filter((w) => {
          if (w.waves.length !== 5) return false;
          const lastWave = w.waves[w.waves.length - 1];

          if (lastWave.pEnd.price !== endPivot.price || lastWave.pEnd.time !== endPivot.time) return false;
          return true;
        })
      : waveClusters;

    return filteredCluster;
  }

  private getPivotsInfo(candles: CandleDto[], definition: number): CandlesInfo {
    const pivots = this.candleService.getZigZag(candles);
    const retracements = this.candleService.generateRetracements(pivots, definition);

    const degreeEnum = WaveDegreeCalculator.calculateWaveDegree(candles);
    const degree = degreeToString(degreeEnum);

    return {
      degree: {
        title: degree,
        value: degreeEnum,
      },
      pivots,
      retracements,
    };
  }

  private getWave1Patterns(candles: CandleDto[], pivots: Pivot[], degree: Degree, logScale: boolean): MotiveWaveInterface[] {
    const fibonacci = new Fibonacci(logScale);
    return [
      new MotiveExtendedWave3(candles, pivots, fibonacci, degree),
      new MotiveExtendedWave1(candles, pivots, fibonacci, degree),
      new MotiveContractingDiagonal(candles, pivots, fibonacci, degree),
      new MotiveExpandingDiagonal(candles, pivots, fibonacci, degree),
    ];
  }
}
