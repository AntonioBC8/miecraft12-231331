/**
 * Minecraft Web 3D - Advanced Shaders & Visual Effects
 * Includes:
 * 1. Radiant Sun Bloom & Volumetric Lens Glare Shader (dynamic screen-space sunburst)
 * 2. Atmospheric Day/Sunset/Night Color Grading & Tone Mapping Shader
 * 3. Cinematic 3D Depth Vignette
 * 4. Animated Underwater Caustics & Refraction Blur
 */
import * as THREE from 'three';

export interface SunScreenPosition {
  x: number;
  y: number;
  visible: boolean;
  intensity: number;
}

export class ShaderEffectsManager {
  private container: HTMLElement;
  private overlayElement: HTMLDivElement | null = null;
  private vignetteElement: HTMLDivElement | null = null;
  private sunBloomElement: HTMLDivElement | null = null;
  private sunRaysElement: HTMLDivElement | null = null;
  private atmosphereTint: HTMLDivElement | null = null;
  private underwaterCanvas: HTMLCanvasElement | null = null;
  private underwaterCtx: CanvasRenderingContext2D | null = null;
  private time: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createScreenShaders(container);
  }

  private createScreenShaders(container: HTMLElement) {
    // 1. Master Overlay Container
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 pointer-events-none z-10 overflow-hidden';
    overlay.style.mixBlendMode = 'normal';

    // 2. Atmospheric Color Grading & Tone Tint (dynamically blends with time of day)
    const atmo = document.createElement('div');
    atmo.className = 'absolute inset-0 pointer-events-none transition-colors duration-500';
    atmo.style.mixBlendMode = 'overlay';
    atmo.style.opacity = '0.35';
    overlay.appendChild(atmo);
    this.atmosphereTint = atmo;

    // 3. Sun Bloom Flare & Radiant Sunburst (centered on the sun in screen space)
    const bloom = document.createElement('div');
    bloom.className = 'absolute pointer-events-none rounded-full';
    bloom.style.width = '420px';
    bloom.style.height = '420px';
    bloom.style.transform = 'translate(-50%, -50%)';
    bloom.style.background = 'radial-gradient(circle, rgba(255, 235, 170, 0.75) 0%, rgba(255, 185, 75, 0.35) 40%, rgba(255, 150, 40, 0.12) 65%, transparent 80%)';
    bloom.style.mixBlendMode = 'screen';
    bloom.style.opacity = '0';
    bloom.style.transition = 'opacity 0.15s ease-out';
    overlay.appendChild(bloom);
    this.sunBloomElement = bloom;

    // 4. Anamorphic Sun Glare Streaks (horizontal god ray glare)
    const rays = document.createElement('div');
    rays.className = 'absolute pointer-events-none';
    rays.style.width = '850px';
    rays.style.height = '140px';
    rays.style.transform = 'translate(-50%, -50%) rotate(-12deg)';
    rays.style.background = 'radial-gradient(ellipse at center, rgba(255, 245, 200, 0.55) 0%, rgba(255, 180, 80, 0.22) 50%, transparent 85%)';
    rays.style.mixBlendMode = 'screen';
    rays.style.opacity = '0';
    rays.style.transition = 'opacity 0.15s ease-out';
    overlay.appendChild(rays);
    this.sunRaysElement = rays;

    // 5. Cinematic Vignette (darkens screen edges for realistic depth)
    const vignette = document.createElement('div');
    vignette.className = 'absolute inset-0 pointer-events-none';
    vignette.style.background = 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.38) 100%)';
    overlay.appendChild(vignette);
    this.vignetteElement = vignette;

    // 6. Underwater Caustics & Water Distortion Layer
    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300';
    canvas.style.opacity = '0';
    canvas.style.background = 'linear-gradient(to bottom, rgba(16, 78, 139, 0.45), rgba(10, 45, 90, 0.65))';
    canvas.style.backdropFilter = 'blur(1.5px)';
    overlay.appendChild(canvas);
    this.underwaterCanvas = canvas;
    this.underwaterCtx = canvas.getContext('2d');

    this.overlayElement = overlay;
    container.appendChild(overlay);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    if (this.underwaterCanvas) {
      this.underwaterCanvas.width = window.innerWidth / 4;
      this.underwaterCanvas.height = window.innerHeight / 4;
    }
  }

  public update(
    delta: number,
    isHeadInWater: boolean,
    sunDot: number,
    timeOfDay: number,
    sunScreenPos?: SunScreenPosition
  ) {
    this.time += delta;

    // 1. Sun Bloom & Glare Shader
    if (this.sunBloomElement && this.sunRaysElement) {
      if (sunScreenPos && sunScreenPos.visible && sunScreenPos.intensity > 0.05) {
        const opacity = Math.min(1.0, Math.pow(Math.max(0, sunDot), 2.2) * sunScreenPos.intensity * 1.3);
        this.sunBloomElement.style.left = `${sunScreenPos.x}px`;
        this.sunBloomElement.style.top = `${sunScreenPos.y}px`;
        this.sunBloomElement.style.opacity = `${opacity}`;

        this.sunRaysElement.style.left = `${sunScreenPos.x}px`;
        this.sunRaysElement.style.top = `${sunScreenPos.y}px`;
        this.sunRaysElement.style.opacity = `${opacity * 0.75}`;
      } else {
        this.sunBloomElement.style.opacity = '0';
        this.sunRaysElement.style.opacity = '0';
      }
    }

    // 2. Atmospheric Color Grading Shader
    if (this.atmosphereTint) {
      // timeOfDay: 0.25 = dawn, 0.5 = noon, 0.75 = sunset, 0.0 = midnight
      if (timeOfDay > 0.22 && timeOfDay < 0.32) {
        // Sunrise golden warmth
        this.atmosphereTint.style.backgroundColor = 'rgba(255, 170, 70, 0.18)';
      } else if (timeOfDay >= 0.32 && timeOfDay < 0.68) {
        // Crisp sunlit midday
        this.atmosphereTint.style.backgroundColor = 'rgba(255, 250, 230, 0.04)';
      } else if (timeOfDay >= 0.68 && timeOfDay < 0.78) {
        // Sunset fiery crimson-gold
        this.atmosphereTint.style.backgroundColor = 'rgba(255, 100, 30, 0.22)';
      } else {
        // Moonlit deep indigo
        this.atmosphereTint.style.backgroundColor = 'rgba(15, 30, 65, 0.16)';
      }
    }

    // 3. Underwater Caustics & Fog
    if (this.underwaterCanvas && this.underwaterCtx) {
      if (isHeadInWater) {
        this.underwaterCanvas.style.opacity = '1';
        this.renderUnderwaterCaustics();
      } else {
        this.underwaterCanvas.style.opacity = '0';
      }
    }
  }

  private renderUnderwaterCaustics() {
    if (!this.underwaterCtx || !this.underwaterCanvas) return;
    const ctx = this.underwaterCtx;
    const w = this.underwaterCanvas.width;
    const h = this.underwaterCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 3;

    // Animated caustic waves
    const t = this.time * 2.5;
    for (let y = 10; y < h; y += 18) {
      ctx.beginPath();
      for (let x = 0; x < w; x += 12) {
        const offset = Math.sin(x * 0.05 + t + y * 0.04) * 8 + Math.cos(x * 0.03 - t * 0.7) * 4;
        if (x === 0) ctx.moveTo(x, y + offset);
        else ctx.lineTo(x, y + offset);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  public dispose() {
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
  }
}
