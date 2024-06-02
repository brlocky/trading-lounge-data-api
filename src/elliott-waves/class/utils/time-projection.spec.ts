import { PivotTime, TimeProjection } from './time-projection.class';

// Tests using Jest
describe('TimeProjection', () => {
  const p0: PivotTime = { time: 1609459200 }; // 2021-01-01 00:00:00
  const p1: PivotTime = { time: 1609545600 }; // 2021-01-02 00:00:00
  const p2: PivotTime = { time: 1609632000 }; // 2021-01-03 00:00:00
  const p3: PivotTime = { time: 1609718400 }; // 2021-01-04 00:00:00
  const p4: PivotTime = { time: 1609804800 }; // 2021-01-05 00:00:00

  it('should calculate Wave 2 Time', () => {
    const result = TimeProjection.calculateWave2Time(p0, p1);
    const timeDiff = p1.time - p0.time;
    const expectedMinTime = p1.time + timeDiff * 0.382;
    const expectedMaxTime = p1.time + timeDiff * 0.618;
    const expectedMediumTime = expectedMinTime + (expectedMaxTime - expectedMinTime) / 2;

    expect(result.minTime).toBeCloseTo(expectedMinTime, 1);
    expect(result.maxTime).toBeCloseTo(expectedMaxTime, 1);
    expect(result.mediumTime).toBeCloseTo(expectedMediumTime, 1);
  });

  it('should calculate Wave 3 Time', () => {
    const result = TimeProjection.calculateWave3Time(p0, p2);
    const timeDiff = p2.time - p0.time;
    const expectedMinTime = p2.time + timeDiff * 1.618;
    const expectedMaxTime = p2.time + timeDiff * 2.618;
    const expectedMediumTime = expectedMinTime + (expectedMaxTime - expectedMinTime) / 2;

    expect(result.minTime).toBeCloseTo(expectedMinTime, 1);
    expect(result.maxTime).toBeCloseTo(expectedMaxTime, 1);
    expect(result.mediumTime).toBeCloseTo(expectedMediumTime, 1);
  });

  it('should calculate Wave 4 Time', () => {
    const result = TimeProjection.calculateWave4Time(p1, p3);
    const timeDiff = p3.time - p1.time;
    const expectedMinTime = p3.time + timeDiff * 0.382;
    const expectedMaxTime = p3.time + timeDiff * 0.618;
    const expectedMediumTime = expectedMinTime + (expectedMaxTime - expectedMinTime) / 2;

    expect(result.minTime).toBeCloseTo(expectedMinTime, 1);
    expect(result.maxTime).toBeCloseTo(expectedMaxTime, 1);
    expect(result.mediumTime).toBeCloseTo(expectedMediumTime, 1);
  });

  it('should calculate Wave 5 Time', () => {
    const result = TimeProjection.calculateWave5Time(p2, p4);
    const timeDiff = p4.time - p2.time;
    const expectedMinTime = p4.time + timeDiff * 0.618;
    const expectedMaxTime = p4.time + timeDiff * 1.618;
    const expectedMediumTime = expectedMinTime + (expectedMaxTime - expectedMinTime) / 2;

    expect(result.minTime).toBeCloseTo(expectedMinTime, 1);
    expect(result.maxTime).toBeCloseTo(expectedMaxTime, 1);
    expect(result.mediumTime).toBeCloseTo(expectedMediumTime, 1);
  });
});
