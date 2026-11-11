import { Component, DestroyRef, afterNextRender, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AudioBufferSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, canEncodeAudio, canEncodeVideo,
} from 'mediabunny';
import { Look, drawFrame, titleFont } from './draw';
import { DEFAULTS, FORMATS, GREEN_SCREEN, Numeric, OPTIONS, RANGES, Settings, fallFor, sanitize, snap } from './settings';
import { FPS, animate, spectrum } from './spectrum';

const SAMPLE_RATE = 48000; // AAC-friendly; decoding resamples everything to this
const MAX_MINUTES = 10; // decoded audio is held in memory (~23 MB per minute)
const MAX_IMAGE_MB = 20;
const STORAGE_KEY = 'soundwave-settings';

function loadSettings(): Settings {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'));
  } catch {
    return DEFAULTS; // storage blocked (private mode) or corrupt: just start fresh
  }
}

@Component({
  selector: 'app-soundwave',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './soundwave.html',
})
export class Soundwave {
  options = OPTIONS;
  ranges = RANGES;
  greenScreen = GREEN_SCREEN;
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  audio = viewChild.required<ElementRef<HTMLAudioElement>>('audio');

  fileName = signal('');
  audioUrl = signal<string | undefined>(undefined);
  status = signal(''); // "Reading…" / "Analyzing…" while busy
  error = signal('');
  progress = signal<number | null>(null); // 0..1 while exporting
  download = signal<{ url: string; name: string } | undefined>(undefined);
  exporting = computed(() => this.progress() !== null);
  busy = computed(() => this.exporting() || !!this.status());

  settings = signal(loadSettings());
  size = computed(() => FORMATS[this.settings().format]);
  title = signal('');
  image = signal<ImageBitmap | undefined>(undefined);
  imageName = signal('');

  duration = signal(0);
  trimStart = signal(0);
  trimEnd = signal(0);
  trimError = computed(() => {
    const [start, end, duration] = [this.trimStart(), this.trimEnd(), this.duration()];
    if (!(start >= 0 && end <= duration)) return `Start and end must be between 0 and ${duration.toFixed(1)} seconds.`;
    if (end - start < 1) return 'End must be at least 1 second after start.';
    return '';
  });

  private raw = signal<{ bars: number; data: Float32Array } | undefined>(undefined);
  private anim = computed(() => {
    const raw = this.raw();
    const s = this.settings();
    return raw && animate(raw.data, raw.bars, s.sensitivity, fallFor(s.smoothness));
  });
  look = computed<Look>(() => ({ ...this.settings(), title: this.title().trim(), image: this.image() }));

  private buffer?: AudioBuffer;
  private destroyed = false;

  constructor() {
    effect(() => {
      const s = this.settings();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        // Remembering settings is a convenience; if storage is blocked the page still works.
      }
    });

    let raf = 0;
    const loop = () => {
      this.drawPreview();
      raf = requestAnimationFrame(loop);
    };
    afterNextRender(loop);
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      cancelAnimationFrame(raf);
      this.image()?.close();
      this.revokeUrls();
    });
  }

  update(patch: Partial<Settings>) {
    const barsChanged = patch.bars !== undefined && patch.bars !== this.settings().bars;
    this.settings.update(s => ({ ...s, ...patch }));
    if (barsChanged) this.analyze();
  }

  choose<K extends keyof Settings>(key: K, value: Settings[K]) {
    this.update({ [key]: value } as Partial<Settings>);
  }

  /** Slider or stepper change for a numeric setting; `delta` steps by the setting's step size. */
  setNumber(key: Numeric, value: number, delta = 0) {
    this.choose(key, snap(key, value + delta * RANGES[key][2]));
  }

  resetSettings() {
    this.update({ ...DEFAULTS });
  }

  async load(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // so picking the same file again still fires (change)
    if (!file) return;

    this.revokeUrls();
    this.buffer = undefined;
    this.raw.set(undefined);
    this.error.set('');
    this.fileName.set(file.name);
    this.status.set(`Reading ${file.name}…`);
    try {
      const buffer = await new OfflineAudioContext(1, 1, SAMPLE_RATE).decodeAudioData(await file.arrayBuffer());
      if (buffer.duration > MAX_MINUTES * 60) throw new Error(`Recordings up to ${MAX_MINUTES} minutes are supported.`);
      this.buffer = buffer;
      this.duration.set(buffer.duration);
      this.trimStart.set(0);
      this.trimEnd.set(Math.floor(buffer.duration * 10) / 10);
      await this.analyze();
      this.audioUrl.set(URL.createObjectURL(file));
    } catch (e) {
      this.buffer = undefined;
      this.fileName.set('');
      this.error.set(e instanceof DOMException
        ? "That file couldn't be read as audio. Try an MP3, WAV, M4A or OGG file."
        : (e as Error).message);
    } finally {
      this.status.set('');
    }
  }

  /** The slow FFT pass; reruns only when the bar count changes. */
  private async analyze() {
    const buffer = this.buffer;
    if (!buffer) return;
    const bars = this.settings().bars;
    this.status.set('Analyzing…');
    await new Promise(r => setTimeout(r)); // let the status paint before the main thread is busy
    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
    this.raw.set({ bars, data: spectrum(channels, buffer.sampleRate, bars) });
    this.status.set('');
  }

  async loadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error.set('');
    try {
      if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG, WebP or GIF).');
      if (file.size > MAX_IMAGE_MB * 1e6) throw new Error(`Images up to ${MAX_IMAGE_MB} MB are supported.`);
      const bitmap = await createImageBitmap(file);
      this.image()?.close();
      this.image.set(bitmap);
      this.imageName.set(file.name);
    } catch (e) {
      this.error.set(e instanceof DOMException ? "That image couldn't be opened." : (e as Error).message);
    }
  }

  clearImage() {
    this.image()?.close();
    this.image.set(undefined);
    this.imageName.set('');
  }

  numberFrom(event: Event) {
    return (event.target as HTMLInputElement).valueAsNumber;
  }

  trimToPlayhead(which: 'start' | 'end') {
    const t = Math.round(this.audio().nativeElement.currentTime * 10) / 10;
    (which === 'start' ? this.trimStart : this.trimEnd).set(t);
  }

  async export() {
    const { buffer } = this;
    const anim = this.anim();
    if (!buffer || !anim || this.busy() || this.trimError()) return;
    this.audio().nativeElement.pause();
    this.error.set('');
    this.revokeDownload();
    this.progress.set(0);

    const { width, height } = this.size();
    const look = this.look();
    const [start, end] = [this.trimStart(), this.trimEnd()];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    try {
      const supported = await canEncodeVideo('avc', { width, height })
        && await canEncodeAudio('aac', { numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
      if (!supported) throw new Error("This browser can't create MP4 videos. Try the latest Chrome, Edge or Safari.");
      if (look.title) await document.fonts.load(titleFont(look, 40));

      const video = new CanvasSource(canvas, { codec: 'avc', quality: QUALITY_HIGH });
      const audio = new AudioBufferSource({ codec: 'aac', quality: QUALITY_HIGH });
      output.addVideoTrack(video, { frameRate: FPS });
      output.addAudioTrack(audio);
      await output.start();
      await audio.add(slice(buffer, start, end));

      const first = Math.floor(start * FPS);
      const last = Math.ceil(end * FPS);
      for (let f = first; f < last; f++) {
        if (this.destroyed) throw new Error('Export cancelled.');
        drawFrame(ctx, anim, f, look);
        await video.add((f - first) / FPS, 1 / FPS);
        if (f % FPS === 0) {
          this.progress.set((f - first) / (last - first));
          await new Promise(r => setTimeout(r)); // let the progress bar repaint
        }
      }
      await output.finalize();

      const blob = new Blob([output.target.buffer!], { type: 'video/mp4' });
      const name = this.fileName().replace(/\.[^.]+$/, '') + '-soundwave.mp4';
      this.download.set({ url: URL.createObjectURL(blob), name });
    } catch (e) {
      await output.cancel().catch(() => undefined);
      this.error.set((e as Error).message || 'Export failed.');
    } finally {
      this.progress.set(null);
    }
  }

  private drawPreview() {
    const ctx = this.canvas().nativeElement.getContext('2d')!;
    const frame = Math.floor(this.audio().nativeElement.currentTime * FPS);
    drawFrame(ctx, this.anim(), frame, this.look());
  }

  private revokeDownload() {
    const d = this.download();
    if (d) URL.revokeObjectURL(d.url);
    this.download.set(undefined);
  }

  private revokeUrls() {
    this.revokeDownload();
    const url = this.audioUrl();
    if (url) URL.revokeObjectURL(url);
    this.audioUrl.set(undefined);
  }
}

/** Copy of the audio between start and end seconds. */
function slice(buffer: AudioBuffer, start: number, end: number): AudioBuffer {
  const from = Math.round(start * buffer.sampleRate);
  const to = Math.min(buffer.length, Math.round(end * buffer.sampleRate));
  const out = new AudioBuffer({ length: to - from, numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
  for (let c = 0; c < buffer.numberOfChannels; c++) out.copyToChannel(buffer.getChannelData(c).subarray(from, to), c);
  return out;
}
