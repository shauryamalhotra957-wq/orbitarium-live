/**
 * Keplerian Orbital Mechanics & Ephemeris Propagation Engine
 * SGP-adjacent analytical solver for astrodynamics simulation
 */

export interface KeplerianElements {
  name: string;
  noradId: number;
  semiMajorAxisKm: number; // a (km)
  eccentricity: number;    // e (dimensionless, 0 <= e < 1)
  inclinationDeg: number;  // i (degrees)
  raanDeg: number;         // Right Ascension of the Ascending Node Ω (degrees)
  argOfPerigeeDeg: number; // Argument of Perigee ω (degrees)
  meanAnomaly0Deg: number; // Mean Anomaly at epoch M0 (degrees)
  epochTimestampMs: number;// Reference epoch in ms
  color: string;
  category: 'station' | 'constellation' | 'science' | 'navigation';
}

export interface SatelliteState {
  positionKm: { x: number; y: number; z: number };
  velocityKmS: { x: number; y: number; z: number };
  speedKmS: number;
  altitudeKm: number;
  latitudeDeg: number;
  longitudeDeg: number;
  periodMinutes: number;
  apoapsisKm: number;
  periapsisKm: number;
}

// Earth physical parameters (WGS84)
export const EARTH_RADIUS_KM = 6378.137;
export const EARTH_MU = 398600.4418; // km^3 / s^2 (Standard gravitational parameter)
export const EARTH_ROTATION_RATE_RAD_S = 7.2921159e-5; // radians / sec

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Solve Kepler's equation for Eccentric Anomaly (E):
 * M = E - e * sin(E)
 * using Newton-Raphson iteration
 */
export function solveKepler(meanAnomalyRad: number, eccentricity: number, tolerance = 1e-7, maxIter = 30): number {
  // Normalize M to [0, 2pi)
  let M = meanAnomalyRad % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  let E = eccentricity > 0.8 ? Math.PI : M;

  for (let i = 0; i < maxIter; i++) {
    const f = E - eccentricity * Math.sin(E) - M;
    if (Math.abs(f) < tolerance) {
      return E;
    }
    const fPrime = 1 - eccentricity * Math.cos(E);
    E -= f / fPrime;
  }
  return E;
}

/**
 * Calculate the orbital period in minutes given semi-major axis (km)
 */
export function computeOrbitalPeriodMinutes(semiMajorAxisKm: number): number {
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / EARTH_MU);
  return periodSeconds / 60;
}

/**
 * Propagate Keplerian orbital elements to given time t (ms)
 * Returns 3D ECI coordinates (km), velocity (km/s), and geodetic coords (lat, lon, alt)
 */
export function propagateOrbit(elements: KeplerianElements, targetTimeMs: number): SatelliteState {
  const a = elements.semiMajorAxisKm;
  const e = Math.min(Math.max(elements.eccentricity, 0), 0.999);
  const inc = elements.inclinationDeg * DEG_TO_RAD;
  const raan = elements.raanDeg * DEG_TO_RAD;
  const omega = elements.argOfPerigeeDeg * DEG_TO_RAD;

  // Mean motion n (rad/s)
  const n = Math.sqrt(EARTH_MU / Math.pow(a, 3));

  // Elapsed time from epoch in seconds
  const dtSeconds = (targetTimeMs - elements.epochTimestampMs) / 1000;

  // Mean anomaly at time t
  const M0 = elements.meanAnomaly0Deg * DEG_TO_RAD;
  const M = M0 + n * dtSeconds;

  // Solve for Eccentric Anomaly E
  const E = solveKepler(M, e);

  // True Anomaly nu
  const sinNu = (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
  const cosNu = (Math.cos(E) - e) / (1 - e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  // Distance from focal point (Earth center)
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane
  const xOrb = r * Math.cos(nu);
  const yOrb = r * Math.sin(nu);

  // Velocity in orbital plane
  const p = a * (1 - e * e);
  const h = Math.sqrt(EARTH_MU * p);
  const vxOrb = -(EARTH_MU / h) * Math.sin(nu);
  const vyOrb = (EARTH_MU / h) * (e + Math.cos(nu));

  // Coordinate transformation: Perifocal/Orbital Plane -> ECI (Inertial frame)
  // R = Rz(-raan) * Rx(-inc) * Rz(-omega)
  const cosO = Math.cos(raan);
  const sinO = Math.sin(raan);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);
  const cosW = Math.cos(omega);
  const sinW = Math.sin(omega);

  const Px = cosO * cosW - sinO * sinW * cosI;
  const Py = sinO * cosW + cosO * sinW * cosI;
  const Pz = sinW * sinI;

  const Qx = -cosO * sinW - sinO * cosW * cosI;
  const Qy = -sinO * sinW + cosO * cosW * cosI;
  const Qz = cosW * sinI;

  // ECI Position (km)
  const xEci = xOrb * Px + yOrb * Qx;
  const yEci = xOrb * Py + yOrb * Qy;
  const zEci = xOrb * Pz + yOrb * Qz;

  // ECI Velocity (km/s)
  const vxEci = vxOrb * Px + vyOrb * Qx;
  const vyEci = vxOrb * Py + vyOrb * Qy;
  const vzEci = vxOrb * Pz + vyOrb * Qz;

  const speedKmS = Math.sqrt(vxEci * vxEci + vyEci * vyEci + vzEci * vzEci);
  const altitudeKm = r - EARTH_RADIUS_KM;

  // Convert ECI to Earth-Fixed (ECEF) by rotating by Greenwich Sidereal angle
  const gmstRad = (EARTH_ROTATION_RATE_RAD_S * (targetTimeMs / 1000)) % (2 * Math.PI);
  const xEcef = xEci * Math.cos(gmstRad) + yEci * Math.sin(gmstRad);
  const yEcef = -xEci * Math.sin(gmstRad) + yEci * Math.cos(gmstRad);
  const zEcef = zEci;

  // Geodetic latitude and longitude
  const latitudeDeg = Math.asin(zEcef / r) * RAD_TO_DEG;
  let longitudeDeg = Math.atan2(yEcef, xEcef) * RAD_TO_DEG;
  if (longitudeDeg > 180) longitudeDeg -= 360;
  if (longitudeDeg < -180) longitudeDeg += 360;

  const periodMinutes = computeOrbitalPeriodMinutes(a);
  const apoapsisKm = a * (1 + e) - EARTH_RADIUS_KM;
  const periapsisKm = a * (1 - e) - EARTH_RADIUS_KM;

  return {
    positionKm: { x: xEci, y: yEci, z: zEci },
    velocityKmS: { x: vxEci, y: vyEci, z: vzEci },
    speedKmS,
    altitudeKm,
    latitudeDeg,
    longitudeDeg,
    periodMinutes,
    apoapsisKm,
    periapsisKm
  };
}

/**
 * Generate vertices for the complete closed orbital ellipse trajectory
 */
export function generateOrbitTrajectory(elements: KeplerianElements, segments = 120): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = [];
  const a = elements.semiMajorAxisKm;
  const e = Math.min(Math.max(elements.eccentricity, 0), 0.999);
  const inc = elements.inclinationDeg * DEG_TO_RAD;
  const raan = elements.raanDeg * DEG_TO_RAD;
  const omega = elements.argOfPerigeeDeg * DEG_TO_RAD;

  const cosO = Math.cos(raan);
  const sinO = Math.sin(raan);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);
  const cosW = Math.cos(omega);
  const sinW = Math.sin(omega);

  const Px = cosO * cosW - sinO * sinW * cosI;
  const Py = sinO * cosW + cosO * sinW * cosI;
  const Pz = sinW * sinI;

  const Qx = -cosO * sinW - sinO * cosW * cosI;
  const Qy = -sinO * sinW + cosO * cosW * cosI;
  const Qz = cosW * sinI;

  for (let i = 0; i <= segments; i++) {
    const nu = (i / segments) * 2 * Math.PI;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
    const xOrb = r * Math.cos(nu);
    const yOrb = r * Math.sin(nu);

    points.push({
      x: xOrb * Px + yOrb * Qx,
      y: xOrb * Py + yOrb * Qy,
      z: xOrb * Pz + yOrb * Qz
    });
  }

  return points;
}
