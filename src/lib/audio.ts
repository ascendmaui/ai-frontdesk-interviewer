/** PCM16 helpers for xAI Voice Agent audio (default 24 kHz mono). */

export const SAMPLE_RATE = 24_000;

export function float32ToBase64Pcm16(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
  return float32;
}

/** Down/up-sample mono float audio with linear interpolation. */
export function resampleLinear(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = src - i0;
    output[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return output;
}

export function rmsLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}
