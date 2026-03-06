let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const MASTER = 0.22; // nudged up slightly for punchiness

// ── Primitives ─────────────────────────────────────────────────────────────

export function playBloop(freq = 440, duration = 0.08, type: OscillatorType = 'square', vol = 1) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(MASTER * vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch { /* silently fail */ }
}

function playNoise(duration = 0.04, vol = 0.5, filterFreq = 3000, filterQ = 0.5) {
  try {
    const c = getCtx();
    const bufferSize = Math.ceil(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const source = c.createBufferSource();
    source.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const gain = c.createGain();
    gain.gain.setValueAtTime(MASTER * vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start();
  } catch { /* silently fail */ }
}

// Punchy thud: filtered noise + low sine
function playThud(vol = 1.0, pitchHz = 80) {
  try {
    const c = getCtx();
    // Low thud sine
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitchHz * 1.5, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitchHz * 0.5, c.currentTime + 0.08);
    gain.gain.setValueAtTime(MASTER * vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.15);
    // Click transient
    playNoise(0.015, vol * 0.9, 1800, 0.8);
  } catch { /* silently fail */ }
}

// ── Card sounds ────────────────────────────────────────────────────────────

let _selectPitchIdx = 0;
const SELECT_PITCHES = [880, 920, 860, 940, 900, 980]; // slight variety per click

/** Card dealt — snappy paper tick */
export function playCardDeal(index = 0) {
  setTimeout(() => {
    playNoise(0.018, 0.5, 5000, 0.4);
    playBloop(320 + index * 12, 0.03, 'square', 0.18);
    // tiny shimmer
    setTimeout(() => playBloop(600, 0.025, 'sine', 0.08), 15);
  }, index * 35);
}

/** Card selected — slot machine lever ratchet */
export function playCardSelect() {
  const freq = SELECT_PITCHES[_selectPitchIdx % SELECT_PITCHES.length];
  _selectPitchIdx++;
  // Two rapid ratchet bursts 8ms apart
  playNoise(0.012, 0.7, 5000, 0.6);
  setTimeout(() => playNoise(0.010, 0.55, 5800, 0.6), 8);
  playBloop(freq, 0.06, 'square', 0.55);
  setTimeout(() => playBloop(freq * 1.5, 0.04, 'sine', 0.18), 18);
}

/** Card deselected — satisfying snap-back thunk */
export function playCardDeselect() {
  // Lower freq thunk: 300Hz square
  playBloop(300, 0.06, 'square', 0.4);
  playNoise(0.018, 0.6, 1800, 0.7);
}

// ── Hand / action sounds ───────────────────────────────────────────────────

/** Play Hand — big satisfying THWACK (3-layer massive) */
export function playHandPlay() {
  try {
    const c = getCtx();
    // Sub-bass hit: 60Hz sine
    const sub = c.createOscillator();
    const subGain = c.createGain();
    sub.type = 'sine';
    sub.frequency.value = 60;
    subGain.gain.setValueAtTime(MASTER * 0.9, c.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.15);
    sub.connect(subGain);
    subGain.connect(c.destination);
    sub.start(c.currentTime);
    sub.stop(c.currentTime + 0.18);
    // Impact noise burst
    playNoise(0.04, 1.2, 2000, 0.3);
    // Deep thud
    playThud(1.0, 90);
    // Rising sweep 200→900Hz
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, c.currentTime + 0.02);
    osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.12);
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.setValueAtTime(MASTER * 0.5, c.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.22);
  } catch { /* silently fail */ }
}

/** Discard — descending whoosh */
export function playDiscard() {
  try {
    const c = getCtx();
    playNoise(0.06, 0.8, 2500, 0.4);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.22);
    gain.gain.setValueAtTime(MASTER * 0.55, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.22);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.25);
  } catch { /* silently fail */ }
}

/** Button press — snappy two-layer with metallic shimmer */
export function playButtonPress() {
  playNoise(0.016, 1.0, 3000, 0.5);
  playThud(0.5, 120);
  setTimeout(() => playNoise(0.010, 0.4, 6000, 0.3), 30);
}

/** Big action punch — BUY, PLAY HAND */
export function playButtonPunch() {
  try {
    const c = getCtx();
    // Deep thud 80Hz
    playThud(0.9, 80);
    // High crack noise
    playNoise(0.02, 1.0, 4500, 0.4);
    // Rising bloop 400→700Hz
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.12);
    gain.gain.setValueAtTime(MASTER * 0.55, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.18);
  } catch { /* silently fail */ }
}

/** Sort button mechanical click */
export function playSortClick() {
  playNoise(0.012, 0.7, 3500, 0.5);
  playBloop(500, 0.018, 'square', 0.4);
}

// ── Scoring sounds ─────────────────────────────────────────────────────────

/** Vault chunk — satisfying coin clinks */
export function playVaultChunk() {
  [0, 25, 55].forEach((ms, i) =>
    setTimeout(() => {
      playNoise(0.035, 0.8, 4500 - i * 400, 0.4);
      playBloop(440 + i * 110, 0.09, 'sine', 0.45);
    }, ms)
  );
}

const LEGENDARY_CHIPS = new Set(['DIAMOND', 'PLATINUM', 'MOONSTONE', 'JOKER', 'AURORA', 'ECHO']);

/** Chip fire bloop — each chip has a distinct feel */
export function playChipBloop(chipType: string) {
  const configs: Record<string, { freq: number; type: OscillatorType; vol: number; dur: number }> = {
    RED:       { freq: 330, type: 'sawtooth', vol: 0.84, dur: 0.1  },
    BLUE:      { freq: 520, type: 'square',   vol: 0.72, dur: 0.09 },
    BLACK:     { freq: 180, type: 'square',   vol: 0.96, dur: 0.14 },
    GOLD:      { freq: 660, type: 'sine',     vol: 0.84, dur: 0.13 },
    LUCKY:     { freq: 780, type: 'sine',     vol: 0.72, dur: 0.12 },
    SILVER:    { freq: 440, type: 'square',   vol: 0.72, dur: 0.1  },
    DIAMOND:   { freq: 880, type: 'sine',     vol: 0.78, dur: 0.15 },
    PLATINUM:  { freq: 740, type: 'sine',     vol: 0.84, dur: 0.13 },
    JOKER:     { freq: 550, type: 'sawtooth', vol: 0.78, dur: 0.11 },
    PENNY:     { freq: 990, type: 'square',   vol: 0.66, dur: 0.07 },
    MOONSTONE: { freq: 820, type: 'sine',     vol: 0.78, dur: 0.14 },
    AURORA:    { freq: 960, type: 'sine',     vol: 0.78, dur: 0.16 },
    ECHO:      { freq: 700, type: 'sine',     vol: 0.72, dur: 0.13 },
  };
  const cfg = configs[chipType] ?? { freq: 440, type: 'square' as OscillatorType, vol: 0.72, dur: 0.1 };
  playNoise(0.01, 0.48, 3000, 0.6);
  playBloop(cfg.freq, cfg.dur, cfg.type, cfg.vol);
  // Overtone shimmer for fancy chips
  if (['GOLD', 'DIAMOND', 'PLATINUM', 'LUCKY', 'MOONSTONE', 'AURORA', 'ECHO'].includes(chipType)) {
    setTimeout(() => playBloop(cfg.freq * 2, cfg.dur * 0.6, 'sine', cfg.vol * 0.3), 25);
  }
  // Floor thud for legendary chips
  if (LEGENDARY_CHIPS.has(chipType)) {
    playThud(0.3, 120);
  }
}

// ── Result / progression sounds ────────────────────────────────────────────

/** Round win — punchy 8-bit ascending fanfare */
export function playRoundWin() {
  // Chord stab first
  [523, 659, 784].forEach(f => playBloop(f, 0.12, 'square', 0.45));
  // Then ascending run
  const run = [523, 587, 659, 698, 784, 880, 988, 1047];
  run.forEach((freq, i) => {
    setTimeout(() => {
      playBloop(freq, 0.14, 'sine', 0.5);
      if (i === run.length - 1) {
        // Final note flourish
        setTimeout(() => playBloop(freq * 2, 0.2, 'sine', 0.3), 40);
      }
    }, 60 + i * 55);
  });
}

/** Round fail — descending 8-bit sad trombone */
export function playRoundFail() {
  const notes = [330, 294, 262, 220, 196];
  notes.forEach((freq, i) => {
    setTimeout(() => playBloop(freq, 0.2, 'sawtooth', 0.45 - i * 0.04), i * 100);
  });
  setTimeout(() => playThud(0.8, 60), 400);
}

/** Casino cha-ching — vault filled! */
export function playChaChing() {
  playThud(0.9, 100);
  playNoise(0.05, 1.0, 3500, 0.3);
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      playBloop(freq, 0.16, 'sine', 0.7 - i * 0.06);
      playBloop(freq * 1.5, 0.1, 'sine', 0.2);
    }, i * 70);
  });
  setTimeout(() => {
    playBloop(1568, 0.25, 'sine', 0.5);
    playBloop(2093, 0.2, 'sine', 0.3);
  }, 400);
}

/**
 * Score impact — scaled by score/vaultTarget ratio.
 * tier 0 (<15%): subtle   tier 1 (15-35%): medium
 * tier 2 (35-60%): big    tier 3 (60%+): massive
 */
export function playScoreImpact(score: number, vaultTarget: number, handRank: number) {
  const ratio = vaultTarget > 0 ? score / vaultTarget : 0;
  const tier = ratio >= 0.6 ? 3 : ratio >= 0.35 ? 2 : ratio >= 0.15 ? 1 : 0;

  // Hand reveal stab before chips (rank 5+ = straight+)
  if (handRank >= 5 && tier >= 1) {
    const stabNotes =
      handRank >= 8 ? [392, 523, 659, 784] : // Full House+ : 4-note stab
      handRank >= 5 ? [392, 523, 659]        : // Straight/Flush: 3-note
                     [440, 554];               // Two pair / Three: 2-note
    stabNotes.forEach((f, i) => setTimeout(() => playBloop(f, 0.1, 'square', 0.5 - i * 0.05), i * 40));
  }

  // Chip sequence pitch multiplier — climbs by tier
  // (exported so chip bloop caller can use it)
  return tier;
}

/** Chip bloop with pitch offset for building sequence */
export function playChipBloopScaled(chipType: string, seqIndex: number, tier: number) {
  const pitchClimb = tier >= 2 ? 1 + seqIndex * 0.06 : 1; // 6% pitch rise per chip in big hands
  const interval = tier >= 2 ? 110 + seqIndex * 8 : 90; // slight slowdown build
  setTimeout(() => {
    playChipBloop(chipType);
    if (pitchClimb > 1) playBloop(440 * pitchClimb, 0.02, 'sine', 0.1); // subtle shimmer
  }, seqIndex * interval);
}

/** Final score slam — scales with tier */
export function playScoreSlamFinal(tier: number) {
  if (tier === 0) {
    playBloop(523, 0.08, 'square', 0.4);
    return;
  }
  if (tier === 1) {
    playThud(0.7, 90);
    setTimeout(() => playBloop(659, 0.12, 'sine', 0.5), 60);
    setTimeout(() => playBloop(784, 0.1, 'sine', 0.35), 120);
    return;
  }
  if (tier === 2) {
    playThud(0.9, 100);
    playNoise(0.04, 0.8, 3000, 0.4);
    [523, 659, 784].forEach((f, i) => setTimeout(() => playBloop(f, 0.15, 'square', 0.55 - i * 0.05), i * 50));
    setTimeout(() => playBloop(1047, 0.2, 'sine', 0.45), 200);
    return;
  }
  // tier 3 — massive
  playThud(1.2, 80);
  playNoise(0.06, 1.2, 2500, 0.3);
  [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => {
    playBloop(f, 0.18, 'square', 0.65 - i * 0.06);
    playBloop(f * 1.5, 0.1, 'sine', 0.2);
  }, i * 60));
  setTimeout(() => {
    playBloop(1319, 0.3, 'sine', 0.6);
    playBloop(1568, 0.25, 'sine', 0.45);
    playBloop(2093, 0.2, 'sine', 0.3);
  }, 350);
}

/** Vault seal — fires when vault fills to target */
export function playVaultSeal() {
  // Distinct from round win — heavier, more mechanical
  playThud(1.1, 70);
  setTimeout(() => playNoise(0.08, 1.0, 1200, 0.4), 40);
  const notes = [220, 277, 330, 440, 554, 659];
  notes.forEach((f, i) => setTimeout(() => playBloop(f, 0.2, 'sawtooth', 0.5 - i * 0.04), 80 + i * 45));
  setTimeout(() => {
    [440, 554, 659].forEach(f => playBloop(f, 0.3, 'sine', 0.4));
  }, 420);
}

/** Shop purchase — satisfying buy click */
export function playPurchase() {
  playNoise(0.02, 0.8, 3000, 0.5);
  playBloop(550, 0.07, 'square', 0.6);
  setTimeout(() => playBloop(770, 0.1, 'sine', 0.5), 65);
  setTimeout(() => playBloop(990, 0.12, 'sine', 0.35), 130);
}

/** Score number ticking up */
export function playScoreTick() {
  playBloop(440 + Math.random() * 80, 0.025, 'square', 0.25);
}

/** Shop tab switch */
export function playTabSwitch() {
  playNoise(0.01, 0.45, 3200, 0.6);
  playBloop(620, 0.035, 'square', 0.28);
  setTimeout(() => playBloop(760, 0.03, 'sine', 0.18), 20);
}

/** Pack open click/reveal */
export function playPackOpen() {
  playNoise(0.03, 0.8, 4200, 0.45);
  [420, 560, 740].forEach((f, i) => setTimeout(() => playBloop(f, 0.08, 'square', 0.34 - i * 0.05), i * 45));
}

/** Forge hammer hit */
export function playForgeHit() {
  playThud(0.95, 85);
  playNoise(0.025, 0.8, 2600, 0.5);
  setTimeout(() => playBloop(480, 0.06, 'sawtooth', 0.25), 20);
}

/** Forge reveal shimmer */
export function playForgeReveal() {
  [660, 880, 1100].forEach((f, i) => setTimeout(() => playBloop(f, 0.12, 'sine', 0.3 - i * 0.04), i * 55));
}

export function playTimerWarn(urgent = false) {
  // Amber warn: two mid-tone blips
  // Red urgent: three high-pitched stabs
  const ctx = new AudioContext();
  const vol = 0.18;
  if (urgent) {
    [0, 0.12, 0.24].forEach(t => playBloop(880, 0.06, 'square', vol));
  } else {
    [0, 0.15].forEach(() => playBloop(550, 0.07, 'triangle', vol));
  }
  ctx.close();
}
