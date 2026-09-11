# Orbitarium Live

> Real-time orbital dynamics, satellite constellation tracking, and space mission simulation platform.

## Overview

**Orbitarium Live** is an interactive telemetry and astrodynamics platform engineered for simulating satellite trajectories, orbital mechanics (Keplerian elements, SGP4/SDP4 propagation), and live constellation telemetry feeds.

## Planned Architecture

- **Propagation Engine**: High-precision SGP4 perturbation model, TLE ingestion, and ephemeris calculation.
- **Visualizer**: WebGL / Three.js interactive 3D celestial sphere, orbital planes, ground tracks, and sensor footprints.
- **Telemetry Stream**: Real-time WebSocket streaming of simulated and live satellite pass coordinates, AOS/LOS (Acquisition/Loss of Signal) calculations, and ground station visibility cones.

## Getting Started

`ash
# Clone the repository
git clone https://github.com/shauryamalhotra957-wq/orbitarium-live.git
cd orbitarium-live
`

## Roadmap

- [ ] SGP4 / TLE satellite pass prediction core
- [ ] 3D Earth projection with atmospheric rendering and orbit trail interpolation
- [ ] Ground station visibility and occultation calculation
- [ ] Multi-constellation support (ISS, Starlink, GPS/Galileo)

## License

MIT
