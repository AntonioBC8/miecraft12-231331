/**
 * Minecraft Web 3D - Procedural Web Audio Synthesizer
 */
import { BlockType } from './constants';

class AudioManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.5;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicInterval: any = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.volume;
        this.sfxGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.volume * 0.25;
        this.musicGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    } else if (enabled && !this.musicInterval) {
      this.startAmbientMusic();
    }
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) this.sfxGain.gain.value = this.volume;
    if (this.musicGain) this.musicGain.gain.value = this.volume * 0.25;
  }

  public getVolume(): number {
    return this.volume;
  }

  // Play white noise burst with bandpass filter for block steps and crunches
  private playNoise(freq: number, duration: number, gainVal: number = 0.2, type: BiquadFilterType = 'bandpass') {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start();
    whiteNoise.stop(this.ctx.currentTime + duration);
  }

  // Play footstep sound according to surface
  public playStep(blockType: BlockType) {
    if (!this.soundEnabled) return;
    switch (blockType) {
      case BlockType.GRASS:
      case BlockType.LEAVES:
        this.playNoise(800, 0.08, 0.25, 'bandpass');
        break;
      case BlockType.SAND:
        this.playNoise(600, 0.1, 0.28, 'lowpass');
        break;
      case BlockType.WOOD:
      case BlockType.PLANKS:
      case BlockType.CRAFTING_TABLE:
      case BlockType.BOOKSHELF:
        this.playTone(180, 'triangle', 0.07, 0.2);
        this.playNoise(400, 0.06, 0.15);
        break;
      case BlockType.WATER:
        this.playSplash();
        break;
      default:
        // Stone / Cobble
        this.playNoise(350, 0.07, 0.3, 'highpass');
        break;
    }
  }

  // Play mining hit / dig sound
  public playDig(blockType: BlockType) {
    if (!this.soundEnabled) return;
    const pitchOffset = (Math.random() - 0.5) * 80;
    if (blockType === BlockType.STONE || blockType === BlockType.COBBLESTONE || blockType === BlockType.BEDROCK || blockType >= BlockType.COAL_ORE) {
      this.playTone(120 + pitchOffset, 'square', 0.08, 0.15);
      this.playNoise(900 + pitchOffset, 0.07, 0.2);
    } else if (blockType === BlockType.WOOD || blockType === BlockType.PLANKS) {
      this.playTone(150 + pitchOffset, 'triangle', 0.09, 0.25);
    } else {
      this.playNoise(500 + pitchOffset, 0.08, 0.25, 'lowpass');
    }
  }

  // Play block broken pop
  public playBreak(blockType: BlockType) {
    if (!this.soundEnabled) return;
    this.playNoise(700, 0.18, 0.35, 'bandpass');
    this.playTone(90, 'sine', 0.12, 0.3);
  }

  // Play block placement
  public playPlace(blockType: BlockType) {
    if (!this.soundEnabled) return;
    this.playTone(160, 'sine', 0.1, 0.3);
    this.playNoise(400, 0.08, 0.2);
  }

  // Item pickup chime
  public playPop() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Player hurt "oof"
  public playHurt() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Water splash
  public playSplash() {
    if (!this.soundEnabled) return;
    this.playNoise(1200, 0.2, 0.25, 'bandpass');
    this.playTone(300, 'sine', 0.15, 0.1);
  }

  // Lava + Water sizzle / steam fizz
  public playFizz() {
    if (!this.soundEnabled) return;
    this.playNoise(2200, 0.45, 0.35, 'highpass');
    this.playNoise(1400, 0.35, 0.25, 'bandpass');
  }

  // Crafting victory chime
  public playCraft() {
    if (!this.soundEnabled) return;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.2);
      }, idx * 60);
    });
  }

  // Explosion for TNT
  public playExplosion() {
    if (!this.soundEnabled) return;
    this.playNoise(200, 0.8, 0.6, 'lowpass');
    this.playTone(60, 'sawtooth', 0.6, 0.5);
  }

  // Simple UI button click
  public playClick() {
    if (!this.soundEnabled) return;
    this.playTone(800, 'sine', 0.04, 0.1);
  }

  // Door creak open / close
  public playDoorOpen() {
    if (!this.soundEnabled) return;
    this.playTone(180, 'sawtooth', 0.12, 0.25);
    this.playNoise(600, 0.08, 0.15, 'bandpass');
  }

  public playDoorClose() {
    if (!this.soundEnabled) return;
    this.playTone(120, 'sawtooth', 0.15, 0.3);
    this.playNoise(400, 0.1, 0.25, 'lowpass');
  }

  public playDoor(isOpen: boolean, isMetallic: boolean = false) {
    if (!this.soundEnabled) return;
    if (isOpen) {
      if (isMetallic) {
        this.playTone(320, 'triangle', 0.15, 0.3);
        this.playNoise(1200, 0.12, 0.2, 'bandpass');
      } else {
        this.playDoorOpen();
      }
    } else {
      if (isMetallic) {
        this.playTone(200, 'triangle', 0.18, 0.35);
        this.playNoise(800, 0.14, 0.25, 'lowpass');
      } else {
        this.playDoorClose();
      }
    }
  }

  // Pure tone helper
  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  // C418-inspired peaceful ambient piano chords
  public startAmbientMusic() {
    if (!this.musicEnabled) return;
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.musicEnabled || !this.soundEnabled) return;
      this.initContext();
      if (!this.ctx || !this.musicGain) return;

      const chord = chords[chordIdx % chords.length];
      chordIdx++;
      const now = this.ctx.currentTime;

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0.001, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.15 + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 4.5);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 4.6);
      });
    };

    // Play first chord after 2s, then every 12 seconds
    setTimeout(playChord, 2000);
    this.musicInterval = setInterval(playChord, 12000);
  }
}

export const audio = new AudioManager();
