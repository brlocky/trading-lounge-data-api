// Define a utility function to create label mappings
function createEnumLabelMappings<T extends object>(enumType: T, labels: { [key in keyof T]: string }): { value: number; label: string }[] {
  return Object.keys(enumType)
    .filter((key) => isNaN(Number(key)))
    .map((key) => ({
      value: enumType[key as keyof T] as unknown as number,
      label: labels[key as keyof T],
    }));
}

// Utility function to get the label of an enum value
function getEnumLabel(enumValue: number, labelMappings: { value: number; label: string }[]): string {
  const found = labelMappings.find((mapping) => mapping.value === enumValue);
  return found ? found.label : 'Unknown';
}

export enum PivotType {
  HIGH = 1,
  LOW = -1,
}
const PivotTypeLabels = createEnumLabelMappings(PivotType, {
  HIGH: 'High',
  LOW: 'Low',
});
export function pivotTypeToString(pivotType: PivotType): string {
  return getEnumLabel(pivotType, PivotTypeLabels);
}

export enum Trend {
  UP = 1,
  DOWN = -1,
}
const TrendLabels = createEnumLabelMappings(Trend, {
  UP: 'Up',
  DOWN: 'Down',
});
export function trendToString(trend: Trend): string {
  return getEnumLabel(trend, TrendLabels);
}

// Define the WaveName enum
export enum WaveName {
  _1 = 1,
  _2 = 2,
  _3 = 3,
  _4 = 4,
  _5 = 5,
  _A = 6,
  _B = 7,
  _C = 8,
  _D = 9,
  _E = 10,
  _X = 11,
  _Y = 12,
  _Z = 13,
}
const WaveNameLabels = createEnumLabelMappings(WaveName, {
  _1: '1',
  _2: '2',
  _3: '3',
  _4: '4',
  _5: '5',
  _A: 'A',
  _B: 'B',
  _C: 'C',
  _D: 'D',
  _E: 'E',
  _X: 'X',
  _Y: 'Y',
  _Z: 'Z',
});
export function waveNameToString(waveName: WaveName): string {
  return getEnumLabel(waveName, WaveNameLabels);
}

// Define the Degree enum
export enum Degree {
  MINISCULE = 1,
  SUBMICRO,
  MICRO,
  SUBMINUETTE,
  MINUETTE,
  MINUTE,
  MINOR,
  INTERMEDIATE,
  PRIMARY,
  CYCLE,
  SUPERCYCLE,
  GRANDSUPERCYCLE,
  SUBMILLENNIUM,
  MILLENNIUM,
  SUPERMILLENNIUM,
}
const DegreeLabels = createEnumLabelMappings(Degree, {
  MINISCULE: 'Miniscule',
  SUBMICRO: 'Submicro',
  MICRO: 'Micro',
  SUBMINUETTE: 'Subminuette',
  MINUETTE: 'Minuette',
  MINUTE: 'Minute',
  MINOR: 'Minor',
  INTERMEDIATE: 'Intermediate',
  PRIMARY: 'Primary',
  CYCLE: 'Cycle',
  SUPERCYCLE: 'Supercycle',
  GRANDSUPERCYCLE: 'Grandsupercycle',
  SUBMILLENNIUM: 'Submillennium',
  MILLENNIUM: 'Millennium',
  SUPERMILLENNIUM: 'Supermillennium',
});
export function degreeToString(degree: Degree): string {
  return getEnumLabel(degree, DegreeLabels);
}

// Define the WaveType enum
export enum WaveType {
  UNKNOWN = 0,
  MOTIVE = 1,
  MOTIVE_EXTENDED_1 = 2,
  MOTIVE_EXTENDED_3 = 3,
  MOTIVE_EXTENDED_5 = 4,
  MOTIVE_CONTRACTING_DIAGONAL = 5,
  MOTIVE_EXPANDING_DIAGONAL = 6,
}
const WaveTypeLabels = createEnumLabelMappings(WaveType, {
  UNKNOWN: 'Unknown',
  MOTIVE: 'Motive',
  MOTIVE_EXTENDED_1: 'Motive Extended 1',
  MOTIVE_EXTENDED_3: 'Motive Extended 3',
  MOTIVE_EXTENDED_5: 'Motive Extended 5',
  MOTIVE_CONTRACTING_DIAGONAL: 'Motive Contracting Diagonal',
  MOTIVE_EXPANDING_DIAGONAL: 'Motive Expanding Diagonal',
});
export function waveTypeToString(waveType: WaveType): string {
  return getEnumLabel(waveType, WaveTypeLabels);
}

// Functions to change the Degree
export function decreaseDegree(degree: Degree): Degree {
  if (degree > Degree.MINISCULE) {
    return degree - 1;
  }
  return degree;
}

export function increaseDegree(degree: Degree): Degree {
  const maxDegree = Object.keys(Degree).length / 2; // Since both key and value pairs exist
  if (degree < maxDegree) {
    return degree + 1;
  }
  return degree;
}
