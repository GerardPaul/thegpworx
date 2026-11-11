import { envelope } from './waveform';

describe('envelope', () => {
  it('gives one value per frame, scaled so the loudest frame is 1', () => {
    // 3 frames of 10 samples each at 10 fps: loud, half as loud, silent (last frame partial).
    const samples = new Float32Array([...Array(10).fill(0.8), ...Array(10).fill(-0.4), ...Array(5).fill(0)]);
    const env = envelope([samples], 100, 10);
    expect(env.length).toBe(3);
    expect(env[0]).toBeCloseTo(1);
    expect(env[1]).toBeCloseTo(0.5);
    expect(env[2]).toBe(0);
  });

  it('combines channels', () => {
    const env = envelope([new Float32Array([0.5, 0.5]), new Float32Array([0, 0])], 2, 2);
    expect(Array.from(env)).toEqual([1, 1]);
  });

  it('returns zeros for silence and nothing for empty audio', () => {
    expect(Array.from(envelope([new Float32Array(4)], 4, 2))).toEqual([0, 0]);
    expect(envelope([new Float32Array(0)], 48000).length).toBe(0);
  });
});
