import './style.css';
import { OrbitariumScene } from './renderer/scene';
import { setupUI, updateHUD } from './ui/hud';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const scene = new OrbitariumScene(container, (sat, telem) => {
    updateHUD(sat, telem);
  });

  setupUI(scene);
});
