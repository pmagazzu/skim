// Music Manager — Web Audio API based, crossfading loop player

export type MusicTrack = 'menu' | 'gameplay' | 'shop' | 'tension' | 'victory';

const TRACK_FILES: Record<MusicTrack, string> = {
  menu:     '/music/menu.mp3',
  gameplay: '/music/gameplay.mp3',
  shop:     '/music/shop.mp3',
  tension:  '/music/tension.mp3',
  victory:  '/music/victory.mp3',
};

const DEFAULT_VOLUME = 0.35;
const CROSSFADE_MS   = 1500;

let audioCtx: AudioContext | null = null;
const bufferCache = new Map<MusicTrack, AudioBuffer | null>();

// Currently playing node + gain
let currentNode:  AudioBufferSourceNode | null = null;
let currentGain:  GainNode | null = null;
let currentTrack: MusicTrack | null = null;
let masterVolume  = DEFAULT_VOLUME;
let muted         = false;

export function initMusic(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {/* ignore */});
  }
}

function getCtx(): AudioContext | null {
  return audioCtx;
}

async function loadBuffer(track: MusicTrack): Promise<AudioBuffer | null> {
  if (bufferCache.has(track)) return bufferCache.get(track)!;
  const ctx = getCtx();
  if (!ctx) return null;
  try {
    const res = await fetch(TRACK_FILES[track]);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(ab);
    bufferCache.set(track, buf);
    return buf;
  } catch {
    // File doesn't exist yet — silently no-op
    bufferCache.set(track, null);
    return null;
  }
}

function startNode(buf: AudioBuffer, gain: GainNode): AudioBufferSourceNode {
  const ctx = getCtx()!;
  const node = ctx.createBufferSource();
  node.buffer = buf;
  node.loop = true;
  node.connect(gain);
  gain.connect(ctx.destination);
  node.start(0);
  return node;
}

function effectiveVol(): number {
  return muted ? 0 : masterVolume;
}

class MusicManager {
  async play(track: MusicTrack): Promise<void> {
    if (track === currentTrack) return;
    const ctx = getCtx();
    if (!ctx) return;

    const buf = await loadBuffer(track);
    if (!buf) return; // file not available

    const now = ctx.currentTime;
    const fadeMs = CROSSFADE_MS / 1000;
    const vol = effectiveVol();

    // Fade out old
    if (currentGain && currentNode) {
      const oldGain = currentGain;
      const oldNode = currentNode;
      oldGain.gain.setValueAtTime(oldGain.gain.value, now);
      oldGain.gain.linearRampToValueAtTime(0.0001, now + fadeMs);
      setTimeout(() => {
        try { oldNode.stop(); } catch { /* ignore */ }
        oldGain.disconnect();
      }, CROSSFADE_MS + 50);
    }

    // Fade in new
    const newGain = ctx.createGain();
    newGain.gain.setValueAtTime(0.0001, now);
    newGain.gain.linearRampToValueAtTime(vol, now + fadeMs);

    const newNode = startNode(buf, newGain);
    currentNode  = newNode;
    currentGain  = newGain;
    currentTrack = track;
  }

  stop(): void {
    if (!currentNode || !currentGain) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const fadeMs = CROSSFADE_MS / 1000;
    currentGain.gain.setValueAtTime(currentGain.gain.value, now);
    currentGain.gain.linearRampToValueAtTime(0.0001, now + fadeMs);
    const nodeToStop = currentNode;
    const gainToStop = currentGain;
    setTimeout(() => {
      try { nodeToStop.stop(); } catch { /* ignore */ }
      gainToStop.disconnect();
    }, CROSSFADE_MS + 50);
    currentNode  = null;
    currentGain  = null;
    currentTrack = null;
  }

  setVolume(v: number): void {
    masterVolume = Math.max(0, Math.min(1, v));
    if (currentGain && !muted) {
      const ctx = getCtx();
      if (ctx) {
        currentGain.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.05);
      }
    }
  }

  setMuted(m: boolean): void {
    muted = m;
    if (currentGain) {
      const ctx = getCtx();
      if (ctx) {
        currentGain.gain.setTargetAtTime(effectiveVol(), ctx.currentTime, 0.05);
      }
    }
  }

  isMuted(): boolean { return muted; }
  getVolume(): number { return masterVolume; }
  getCurrentTrack(): MusicTrack | null { return currentTrack; }

  fadeToTrack(track: MusicTrack, ms = CROSSFADE_MS): void {
    // play() already crossfades; ms param reserved for future use
    void ms;
    this.play(track);
  }
}

export const musicManager = new MusicManager();
