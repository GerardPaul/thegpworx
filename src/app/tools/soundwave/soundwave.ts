import { Component, DestroyRef, afterNextRender, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AudioBufferSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, canEncodeAudio, canEncodeVideo,
} from 'mediabunny';
import { FPS, Palette, drawFrame, spectrum } from './spectrum';

const WIDTH = 1280;
const HEIGHT = 720;
const SAMPLE_RATE = 48000; // AAC-friendly; decoding resamples everything to this
const MAX_MINUTES = 10; // decoded audio is held in memory (~23 MB per minute)

@Component({
  selector: 'app-soundwave',
  imports: [RouterLink],
  templateUrl: './soundwave.html',
})
export class Soundwave {
  width = WIDTH;
  height = HEIGHT;
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  audio = viewChild.required<ElementRef<HTMLAudioElement>>('audio');

  fileName = signal('');
  audioUrl = signal<string | undefined>(undefined);
  loading = signal(false);
  error = signal('');
  progress = signal<number | null>(null); // 0..1 while exporting
  download = signal<{ url: string; name: string } | undefined>(undefined);
  exporting = computed(() => this.progress() !== null);

  private buffer?: AudioBuffer;
  private levels?: Float32Array;
  private destroyed = false;

  constructor() {
    let raf = 0;
    const loop = () => {
      this.drawPreview();
      raf = requestAnimationFrame(loop);
    };
    afterNextRender(loop);
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      cancelAnimationFrame(raf);
      this.revokeUrls();
    });
  }

  async load(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // so picking the same file again still fires (change)
    if (!file) return;

    this.revokeUrls();
    this.buffer = this.levels = undefined;
    this.error.set('');
    this.fileName.set(file.name);
    this.loading.set(true);
    try {
      const buffer = await new OfflineAudioContext(1, 1, SAMPLE_RATE).decodeAudioData(await file.arrayBuffer());
      if (buffer.duration > MAX_MINUTES * 60) throw new Error(`Recordings up to ${MAX_MINUTES} minutes are supported.`);
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
      this.levels = spectrum(channels, buffer.sampleRate);
      this.buffer = buffer;
      this.audioUrl.set(URL.createObjectURL(file));
    } catch (e) {
      this.fileName.set('');
      this.error.set(e instanceof DOMException
        ? "That file couldn't be read as audio. Try an MP3, WAV, M4A or OGG file."
        : (e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async export() {
    const { buffer, levels } = this;
    if (!buffer || !levels || this.exporting()) return;
    this.audio().nativeElement.pause();
    this.error.set('');
    this.revokeDownload();
    this.progress.set(0);

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d')!;
    const colors = this.palette();
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    try {
      const supported = await canEncodeVideo('avc', { width: WIDTH, height: HEIGHT })
        && await canEncodeAudio('aac', { numberOfChannels: buffer.numberOfChannels, sampleRate: buffer.sampleRate });
      if (!supported) throw new Error("This browser can't create MP4 videos. Try the latest Chrome, Edge or Safari.");

      const video = new CanvasSource(canvas, { codec: 'avc', quality: QUALITY_HIGH });
      const audio = new AudioBufferSource({ codec: 'aac', quality: QUALITY_HIGH });
      output.addVideoTrack(video, { frameRate: FPS });
      output.addAudioTrack(audio);
      await output.start();
      await audio.add(buffer);

      const frames = Math.ceil(buffer.duration * FPS);
      for (let f = 0; f < frames; f++) {
        if (this.destroyed) throw new Error('Export cancelled.');
        drawFrame(ctx, levels, f, colors);
        await video.add(f / FPS, 1 / FPS);
        if (f % FPS === 0) {
          this.progress.set(f / frames);
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
    drawFrame(ctx, this.levels ?? new Float32Array(0), frame, this.palette());
  }

  /** Current theme colours, so the video matches what the user sees. */
  private palette(): Palette {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    return { bg: `rgb(${token('--surface')})`, bar: `rgb(${token('--accent')})` };
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
