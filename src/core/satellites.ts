import { KeplerianElements, EARTH_RADIUS_KM } from './orbit';

export interface GroundStation {
  name: string;
  country: string;
  latitudeDeg: number;
  longitudeDeg: number;
  elevationMeters: number;
}

export const GROUND_STATIONS: GroundStation[] = [
  { name: 'Kennedy Space Center (KSC)', country: 'USA', latitudeDeg: 28.5729, longitudeDeg: -80.6490, elevationMeters: 3 },
  { name: 'Baikonur Cosmodrome', country: 'Kazakhstan', latitudeDeg: 45.9650, longitudeDeg: 63.3050, elevationMeters: 100 },
  { name: 'Guiana Space Centre', country: 'French Guiana', latitudeDeg: 5.2372, longitudeDeg: -52.7686, elevationMeters: 15 },
  { name: 'Svalbard Satellite Station', country: 'Norway', latitudeDeg: 78.2298, longitudeDeg: 15.4078, elevationMeters: 450 },
  { name: 'Tokyo Ground Terminal', country: 'Japan', latitudeDeg: 35.6762, longitudeDeg: 139.6503, elevationMeters: 40 },
  { name: 'Canberra Deep Space Station', country: 'Australia', latitudeDeg: -35.4014, longitudeDeg: 148.9817, elevationMeters: 650 }
];

const EPOCH_BASE = 1726000000000; // Reference epoch

export const SATELLITE_CATALOG: KeplerianElements[] = [
  // Space Stations (LEO)
  {
    name: 'ISS (Zarya)',
    noradId: 25544,
    semiMajorAxisKm: EARTH_RADIUS_KM + 420,
    eccentricity: 0.0006,
    inclinationDeg: 51.64,
    raanDeg: 125.4,
    argOfPerigeeDeg: 80.2,
    meanAnomaly0Deg: 24.5,
    epochTimestampMs: EPOCH_BASE,
    color: '#38bdf8',
    category: 'station'
  },
  {
    name: 'Tiangong (CSS)',
    noradId: 48274,
    semiMajorAxisKm: EARTH_RADIUS_KM + 388,
    eccentricity: 0.0004,
    inclinationDeg: 41.47,
    raanDeg: 210.8,
    argOfPerigeeDeg: 15.0,
    meanAnomaly0Deg: 180.2,
    epochTimestampMs: EPOCH_BASE,
    color: '#f43f5e',
    category: 'station'
  },
  // Science & Telescopes
  {
    name: 'Hubble Space Telescope',
    noradId: 20580,
    semiMajorAxisKm: EARTH_RADIUS_KM + 535,
    eccentricity: 0.0003,
    inclinationDeg: 28.47,
    raanDeg: 74.3,
    argOfPerigeeDeg: 240.1,
    meanAnomaly0Deg: 110.5,
    epochTimestampMs: EPOCH_BASE,
    color: '#a855f7',
    category: 'science'
  },
  {
    name: 'NOAA-20 (JPSS-1)',
    noradId: 43013,
    semiMajorAxisKm: EARTH_RADIUS_KM + 824,
    eccentricity: 0.0001,
    inclinationDeg: 98.74, // Sun-synchronous Polar
    raanDeg: 340.5,
    argOfPerigeeDeg: 90.0,
    meanAnomaly0Deg: 45.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#10b981',
    category: 'science'
  },
  // Starlink Constellation Plane (LEO Megaconstellation)
  {
    name: 'Starlink-30121',
    noradId: 58001,
    semiMajorAxisKm: EARTH_RADIUS_KM + 550,
    eccentricity: 0.0001,
    inclinationDeg: 53.05,
    raanDeg: 45.0,
    argOfPerigeeDeg: 30.0,
    meanAnomaly0Deg: 0.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#fbbf24',
    category: 'constellation'
  },
  {
    name: 'Starlink-30122',
    noradId: 58002,
    semiMajorAxisKm: EARTH_RADIUS_KM + 550,
    eccentricity: 0.0001,
    inclinationDeg: 53.05,
    raanDeg: 45.0,
    argOfPerigeeDeg: 30.0,
    meanAnomaly0Deg: 45.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#fbbf24',
    category: 'constellation'
  },
  {
    name: 'Starlink-30123',
    noradId: 58003,
    semiMajorAxisKm: EARTH_RADIUS_KM + 550,
    eccentricity: 0.0001,
    inclinationDeg: 53.05,
    raanDeg: 45.0,
    argOfPerigeeDeg: 30.0,
    meanAnomaly0Deg: 90.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#fbbf24',
    category: 'constellation'
  },
  {
    name: 'Starlink-30124',
    noradId: 58004,
    semiMajorAxisKm: EARTH_RADIUS_KM + 550,
    eccentricity: 0.0001,
    inclinationDeg: 53.05,
    raanDeg: 45.0,
    argOfPerigeeDeg: 30.0,
    meanAnomaly0Deg: 135.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#fbbf24',
    category: 'constellation'
  },
  {
    name: 'Starlink-30125',
    noradId: 58005,
    semiMajorAxisKm: EARTH_RADIUS_KM + 550,
    eccentricity: 0.0001,
    inclinationDeg: 53.05,
    raanDeg: 45.0,
    argOfPerigeeDeg: 30.0,
    meanAnomaly0Deg: 180.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#fbbf24',
    category: 'constellation'
  },
  // GPS Navigation Constellation (MEO - Medium Earth Orbit)
  {
    name: 'GPS-BIIRM-1 (PRN 01)',
    noradId: 28874,
    semiMajorAxisKm: EARTH_RADIUS_KM + 20180,
    eccentricity: 0.005,
    inclinationDeg: 55.0,
    raanDeg: 60.0,
    argOfPerigeeDeg: 110.0,
    meanAnomaly0Deg: 0.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#34d399',
    category: 'navigation'
  },
  {
    name: 'GPS-BIIRM-2 (PRN 07)',
    noradId: 32711,
    semiMajorAxisKm: EARTH_RADIUS_KM + 20180,
    eccentricity: 0.005,
    inclinationDeg: 55.0,
    raanDeg: 120.0,
    argOfPerigeeDeg: 170.0,
    meanAnomaly0Deg: 60.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#34d399',
    category: 'navigation'
  },
  {
    name: 'GPS-BIIF-3 (PRN 25)',
    noradId: 36585,
    semiMajorAxisKm: EARTH_RADIUS_KM + 20180,
    eccentricity: 0.005,
    inclinationDeg: 55.0,
    raanDeg: 180.0,
    argOfPerigeeDeg: 230.0,
    meanAnomaly0Deg: 120.0,
    epochTimestampMs: EPOCH_BASE,
    color: '#34d399',
    category: 'navigation'
  }
];
