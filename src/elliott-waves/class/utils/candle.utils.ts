export interface CandleTime {
  time: number; // time in milliseconds since Unix epoch
}

export const determineCommonInterval = (candles: CandleTime[]): number => {
  const intervals = (): number[] => {
    const intervals: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const interval = (candles[i].time - candles[i - 1].time) / (60 * 60 * 24);
      intervals.push(interval);
    }
    return intervals;
  };

  const intervalCounts: { [key: number]: number } = {};
  for (const interval of intervals()) {
    if (!intervalCounts[interval]) {
      intervalCounts[interval] = 0;
    }
    intervalCounts[interval]++;
  }
  let commonInterval = 0;
  let maxCount = 0;
  for (const interval in intervalCounts) {
    if (intervalCounts[interval] > maxCount) {
      maxCount = intervalCounts[interval];
      commonInterval = parseFloat(interval);
    }
  }
  return commonInterval;
};
