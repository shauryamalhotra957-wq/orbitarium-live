import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SATELLITE_CATALOG, GROUND_STATIONS } from '../core/satellites';
import {
  EARTH_RADIUS_KM,
  propagateOrbit,
  generateOrbitTrajectory,
  KeplerianElements,
  SatelliteState
} from '../core/orbit';

// Scaling factor: 1 Earth Radius = 10 units in Three.js world space
const WORLD_SCALE = 10 / EARTH_RADIUS_KM;

export interface SimulationState {
  simTimeMs: number;
  timeMultiplier: number;
  isPlaying: boolean;
  selectedSatellite: KeplerianElements;
  activeCategory: string;
}

export class OrbitariumScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  
  private earthMesh: THREE.Mesh;
  private atmosphereMesh: THREE.Mesh;
  private satelliteMeshes: Map<number, THREE.Group> = new Map();
  private orbitLines: Map<number, THREE.Line> = new Map();
  private groundStationMarkers: THREE.Group[] = [];

  public state: SimulationState;
  private onTelemetryUpdate?: (sat: KeplerianElements, telemetry: SatelliteState) => void;

  constructor(container: HTMLElement, onTelemetryUpdate?: (sat: KeplerianElements, telemetry: SatelliteState) => void) {
    this.container = container;
    this.onTelemetryUpdate = onTelemetryUpdate;

    this.state = {
      simTimeMs: Date.now(),
      timeMultiplier: 10, // 10x real-time speed for dynamic viewing
      isPlaying: true,
      selectedSatellite: SATELLITE_CATALOG[0],
      activeCategory: 'all'
    };

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 18, 32);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 3. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 11.5;
    this.controls.maxDistance = 150;

    // 4. Lighting (Simulating Sun & Deep Space Ambient)
    const ambientLight = new THREE.AmbientLight(0x1a2639, 1.2);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(50, 20, 30);
    this.scene.add(sunLight);

    // 5. Starfield background
    this.createStarfield();

    // 6. 3D Earth
    const earthGeometry = new THREE.SphereGeometry(10, 64, 64);
    const earthTexture = this.createProceduralEarthTexture();
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.8,
      metalness: 0.1
    });
    this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    this.scene.add(this.earthMesh);

    // Atmospheric Glow rim
    const atmosphereGeometry = new THREE.SphereGeometry(10.25, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(this.atmosphereMesh);

    // 7. Ground Stations
    this.initGroundStations();

    // 8. Satellites & Trajectories
    this.initSatellites();

    // Resize Handler
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private createStarfield() {
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 300 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * 1.1; // Slight cool blue tint
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  private createProceduralEarthTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Deep ocean blue base
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Continental shapes (Stylized cartographic continents)
    ctx.fillStyle = '#1e3a5f';
    // North America & Eurasia stylized blocks
    ctx.beginPath();
    ctx.ellipse(250, 150, 120, 70, 0, 0, Math.PI * 2);
    ctx.ellipse(650, 140, 220, 80, 0, 0, Math.PI * 2);
    ctx.ellipse(320, 320, 60, 90, 0.2, 0, Math.PI * 2); // South America
    ctx.ellipse(540, 260, 80, 100, 0, 0, Math.PI * 2); // Africa
    ctx.ellipse(800, 340, 70, 50, 0, 0, Math.PI * 2); // Australia
    ctx.fill();

    // Subtle grid lines (Latitude & Longitude)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private initGroundStations() {
    const markerGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.6, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (const station of GROUND_STATIONS) {
      const phi = (90 - station.latitudeDeg) * (Math.PI / 180);
      const theta = (station.longitudeDeg + 180) * (Math.PI / 180);

      const r = 10.1;
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);

      const group = new THREE.Group();
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
      marker.position.set(x, y, z);
      group.add(marker);

      this.scene.add(group);
      this.groundStationMarkers.push(group);
    }
  }

  private initSatellites() {
    for (const sat of SATELLITE_CATALOG) {
      // 1. Orbital Trail Line
      const points = generateOrbitTrajectory(sat, 128).map(p => 
        new THREE.Vector3(p.x * WORLD_SCALE, p.z * WORLD_SCALE, -p.y * WORLD_SCALE)
      );
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(sat.color),
        transparent: true,
        opacity: sat.noradId === this.state.selectedSatellite.noradId ? 0.85 : 0.35
      });
      const orbitLine = new THREE.Line(lineGeo, lineMat);
      this.scene.add(orbitLine);
      this.orbitLines.set(sat.noradId, orbitLine);

      // 2. Satellite Model (Group containing body + solar wings + beacon light)
      const satGroup = new THREE.Group();
      
      // Central body
      const bodyGeo = new THREE.BoxGeometry(0.35, 0.35, 0.5);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      satGroup.add(bodyMesh);

      // Solar panels
      const wingGeo = new THREE.BoxGeometry(1.2, 0.04, 0.3);
      const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.3 });
      const wingMesh = new THREE.Mesh(wingGeo, wingMat);
      satGroup.add(wingMesh);

      // Pulse indicator glow
      const glowGeo = new THREE.SphereGeometry(0.3, 12, 12);
      const glowMat = new THREE.MeshBasicMaterial({ color: sat.color, wireframe: true });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      satGroup.add(glowMesh);

      this.scene.add(satGroup);
      this.satelliteMeshes.set(sat.noradId, satGroup);
    }
  }

  public selectSatellite(noradId: number) {
    const sat = SATELLITE_CATALOG.find(s => s.noradId === noradId);
    if (sat) {
      this.state.selectedSatellite = sat;
      // Highlight trajectory
      for (const [id, line] of this.orbitLines) {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = id === noradId ? 0.95 : 0.25;
      }
    }
  }

  public filterCategory(category: string) {
    this.state.activeCategory = category;
    for (const sat of SATELLITE_CATALOG) {
      const visible = category === 'all' || sat.category === category;
      const mesh = this.satelliteMeshes.get(sat.noradId);
      const line = this.orbitLines.get(sat.noradId);
      if (mesh) mesh.visible = visible;
      if (line) line.visible = visible;
    }
  }

  public togglePlayPause(): boolean {
    this.state.isPlaying = !this.state.isPlaying;
    return this.state.isPlaying;
  }

  public setTimeMultiplier(multiplier: number) {
    this.state.timeMultiplier = multiplier;
  }

  private onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private animate() {
    requestAnimationFrame(this.animate);

    // Advance simulation time
    if (this.state.isPlaying) {
      this.state.simTimeMs += 16.6 * this.state.timeMultiplier;
    }

    // Earth rotation (approximate visual rotation)
    this.earthMesh.rotation.y += 0.0005 * (this.state.isPlaying ? 1 : 0);

    // Propagate all satellites
    let activeTelemetry: SatelliteState | null = null;

    for (const sat of SATELLITE_CATALOG) {
      const state = propagateOrbit(sat, this.state.simTimeMs);
      const mesh = this.satelliteMeshes.get(sat.noradId);

      if (mesh) {
        // Map ECI to Three.js coordinates (X -> X, Z -> Y, -Y -> Z)
        mesh.position.set(
          state.positionKm.x * WORLD_SCALE,
          state.positionKm.z * WORLD_SCALE,
          -state.positionKm.y * WORLD_SCALE
        );
        mesh.lookAt(0, 0, 0); // Orient toward Earth
      }

      if (sat.noradId === this.state.selectedSatellite.noradId) {
        activeTelemetry = state;
      }
    }

    if (activeTelemetry && this.onTelemetryUpdate) {
      this.onTelemetryUpdate(this.state.selectedSatellite, activeTelemetry);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
