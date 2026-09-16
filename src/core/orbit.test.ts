import { describe, it, expect } from 'vitest';
import {
  solveKepler,
  computeOrbitalPeriodMinutes,
  propagateOrbit,
  generateOrbitTrajectory,
  EARTH_RADIUS_KM,
  KeplerianElements
} from './orbit';

describe('Keplerian Orbital Mechanics Core', () => {
  it('solves Kepler equation with high numerical precision for circular and eccentric orbits', () => {
    // For e = 0, E = M
    const M0 = 1.25;
    expect(solveKepler(M0, 0.0)).toBeCloseTo(M0, 6);

    // For e = 0.5, test that E - e*sin(E) == M
    const e = 0.5;
    const M = 2.1;
    const E = solveKepler(M, e);
    const calculatedM = E - e * Math.sin(E);
    expect(calculatedM).toBeCloseTo(M, 6);
  });

  it('correctly calculates LEO orbital period for ISS altitude', () => {
    // ISS at ~420km altitude
    const issSemiMajorAxis = EARTH_RADIUS_KM + 420;
    const periodMinutes = computeOrbitalPeriodMinutes(issSemiMajorAxis);

    // Standard ISS period is ~92.8 minutes
    expect(periodMinutes).toBeGreaterThan(91.0);
    expect(periodMinutes).toBeLessThan(94.0);
  });

  it('calculates MEO orbital period for GPS constellation (~12 hours)', () => {
    // GPS at ~20,200km altitude -> semi-major axis ~26,578 km
    const gpsSemiMajorAxis = EARTH_RADIUS_KM + 20180;
    const periodMinutes = computeOrbitalPeriodMinutes(gpsSemiMajorAxis);

    // 12 hours = 720 minutes
    expect(periodMinutes).toBeGreaterThan(700);
    expect(periodMinutes).toBeLessThan(730);
  });

  it('propagates orbital state vectors to geodetic bounds and physical speeds', () => {
    const testSat: KeplerianElements = {
      name: 'TestSat-LEO',
      noradId: 99999,
      semiMajorAxisKm: EARTH_RADIUS_KM + 500,
      eccentricity: 0.001,
      inclinationDeg: 45.0,
      raanDeg: 30.0,
      argOfPerigeeDeg: 10.0,
      meanAnomaly0Deg: 0.0,
      epochTimestampMs: 1726000000000,
      color: '#00ffcc',
      category: 'station'
    };

    const state = propagateOrbit(testSat, 1726000000000 + 3600 * 1000);

    // LEO speeds are around 7.6 km/s
    expect(state.speedKmS).toBeGreaterThan(7.0);
    expect(state.speedKmS).toBeLessThan(8.2);

    // Altitude should be around 500 km
    expect(state.altitudeKm).toBeGreaterThan(480);
    expect(state.altitudeKm).toBeLessThan(520);

    // Lat/Long bounds
    expect(state.latitudeDeg).toBeGreaterThanOrEqual(-46.0);
    expect(state.latitudeDeg).toBeLessThanOrEqual(46.0);
    expect(state.longitudeDeg).toBeGreaterThanOrEqual(-180.0);
    expect(state.longitudeDeg).toBeLessThanOrEqual(180.0);
  });

  it('generates a continuous closed trajectory path with specified vertex count', () => {
    const testSat: KeplerianElements = {
      name: 'TestSat-LEO',
      noradId: 99999,
      semiMajorAxisKm: EARTH_RADIUS_KM + 600,
      eccentricity: 0.02,
      inclinationDeg: 60.0,
      raanDeg: 0.0,
      argOfPerigeeDeg: 0.0,
      meanAnomaly0Deg: 0.0,
      epochTimestampMs: 1726000000000,
      color: '#00ffcc',
      category: 'science'
    };

    const trajectory = generateOrbitTrajectory(testSat, 64);
    expect(trajectory.length).toBe(65); // 64 segments + 1 closing point

    // First and last points should match (closed loop)
    expect(trajectory[0].x).toBeCloseTo(trajectory[64].x, 3);
    expect(trajectory[0].y).toBeCloseTo(trajectory[64].y, 3);
    expect(trajectory[0].z).toBeCloseTo(trajectory[64].z, 3);
  });
});
