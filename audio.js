/* ==========================================================================
   PRIMARY PURPOSE: Procedural Sound Synthesis Engine (SoundManager).
   Generates all game audio in real-time using the Web Audio API.
   ========================================================================= */

window.SoundManager = {
  ctx: null,
  activeChannelCount: 0,
  maxConcurrent: 5,
  masterGain: null,
  sfxGain: null,

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);

        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        compressor.knee.setValueAtTime(20, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.08, this.ctx.currentTime);

        this.masterGain.connect(compressor);
        compressor.connect(this.ctx.destination);
        this.updateVolumes();
      } catch (e) {
        console.warn("Failed to initialize Web AudioContext:", e);
        return false;
      }
    }
    // Secure AudioContext state transitions for mobile background throttling
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch((err) => {
        console.warn(
          "AudioContext resume postponed (waiting for user gesture):",
          err,
        );
      });
    }
    return true;
  },

  updateVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const targetMaster = window.playerStats.mute
      ? 0
      : window.playerStats.volumeMaster || 0.5;
    const targetSFX = window.playerStats.volumeSFX || 0.5;
    this.masterGain.gain.setTargetAtTime(
      Math.max(0, Math.min(1, targetMaster)),
      now,
      0.015,
    );
    this.sfxGain.gain.setTargetAtTime(
      Math.max(0, Math.min(1, targetSFX)),
      now,
      0.015,
    );
  },

  play(type) {
    if (window.playerStats.mute) return;
    if (!this.init()) return;
    if (this.activeChannelCount >= this.maxConcurrent) return;
    this.activeChannelCount++;
    const now = this.ctx.currentTime;
    const dest = this.sfxGain;
    switch (type) {
      case "swing":
        this.synthesizeSwing(now, dest);
        break;
      case "block":
        this.synthesizeBlock(now, dest);
        break;
      case "parry":
        this.synthesizeParry(now, dest);
        break;
      case "spell":
        this.synthesizeSpell(now, dest);
        break;
      case "fairy":
        this.synthesizeFairy(now, dest);
        break;
      case "death":
        this.synthesizeDeath(now, dest);
        break;
      case "defeat":
        this.synthesizeDefeat(now, dest);
        break;
      case "revive":
        this.synthesizeRevive(now, dest);
        break;
    }
  },

  synthesizeSwing(now, dest) {
    const duration = window.randFloat(0.08, 0.12);
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const bufferSize = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(
      1,
      bufferSize,
      this.ctx.sampleRate,
    );
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(window.randFloat(1100, 1500), now);
    noiseFilter.frequency.exponentialRampToValueAtTime(
      window.randFloat(300, 450),
      now + duration,
    );
    noiseFilter.Q.setValueAtTime(3.5, now);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(gainNode);
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(window.randFloat(240, 310), now);
    osc.frequency.exponentialRampToValueAtTime(
      window.randFloat(70, 95),
      now + duration,
    );
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.06, now + 0.006);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.85);
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    gainNode.connect(dest);
    noiseSource.start(now);
    osc.start(now);
    noiseSource.stop(now + duration);
    osc.stop(now + duration);
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeBlock(now, dest) {
    const duration = 0.16;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.14, now + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const baseOsc = this.ctx.createOscillator();
    baseOsc.type = "triangle";
    baseOsc.frequency.setValueAtTime(130, now);
    baseOsc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
    const baseGain = this.ctx.createGain();
    baseGain.gain.setValueAtTime(0.08, now);
    baseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    baseOsc.connect(baseGain);
    baseGain.connect(gainNode);
    const ironChime1 = this.ctx.createOscillator();
    ironChime1.type = "sine";
    ironChime1.frequency.setValueAtTime(440, now);
    const ironChime2 = this.ctx.createOscillator();
    ironChime2.type = "sine";
    ironChime2.frequency.setValueAtTime(659.25, now);
    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0.04, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    ironChime1.connect(chimeGain);
    ironChime2.connect(chimeGain);
    chimeGain.connect(gainNode);
    const noiseLength = this.ctx.sampleRate * 0.06;
    const noiseBuffer = this.ctx.createBuffer(
      1,
      noiseLength,
      this.ctx.sampleRate,
    );
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) output[i] = Math.random() * 2 - 1;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(1400, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.03, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);
    gainNode.connect(dest);
    baseOsc.start(now);
    ironChime1.start(now);
    ironChime2.start(now);
    noiseSource.start(now);
    baseOsc.stop(now + duration);
    ironChime1.stop(now + duration);
    ironChime2.stop(now + duration);
    noiseSource.stop(now + duration);
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeParry(now, dest) {
    const duration = 0.45;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const frequencies = [880, 1046.5, 1318.5, 1760];
    const oscillators = [];
    const metalGain = this.ctx.createGain();
    metalGain.gain.setValueAtTime(0.05, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    frequencies.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(
        f + window.randFloat(-10, 10),
        now + 0.18,
      );
      osc.connect(metalGain);
      oscillators.push(osc);
    });
    const pingOsc = this.ctx.createOscillator();
    pingOsc.type = "triangle";
    pingOsc.frequency.setValueAtTime(2400, now);
    pingOsc.frequency.exponentialRampToValueAtTime(1100, now + 0.045);
    const pingGain = this.ctx.createGain();
    pingGain.gain.setValueAtTime(0.07, now);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    pingOsc.connect(pingGain);
    pingGain.connect(gainNode);
    const noiseLength = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(
      1,
      noiseLength,
      this.ctx.sampleRate,
    );
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) output[i] = Math.random() * 2 - 1;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(3200, now);
    noiseFilter.Q.setValueAtTime(3.5, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.025, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);
    metalGain.connect(gainNode);
    gainNode.connect(dest);
    oscillators.forEach((o) => o.start(now));
    pingOsc.start(now);
    noiseSource.start(now);
    oscillators.forEach((o) => o.stop(now + duration));
    pingOsc.stop(now + duration);
    noiseSource.stop(now + duration);
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeSpell(now, dest) {
    const duration = 0.45;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const freqs = [329.63, 392.0, 493.88, 587.33];
    const oscillators = [];
    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0, now);
    chordGain.gain.linearRampToValueAtTime(0.05, now + 0.08);
    chordGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const bpFilter = this.ctx.createBiquadFilter();
    bpFilter.type = "bandpass";
    bpFilter.frequency.setValueAtTime(300, now);
    bpFilter.frequency.exponentialRampToValueAtTime(3000, now + duration);
    bpFilter.Q.setValueAtTime(4.0, now);
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 1.015, now + duration);
      osc.connect(bpFilter);
      oscillators.push(osc);
    });
    bpFilter.connect(chordGain);
    chordGain.connect(gainNode);
    const noiseLength = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(
      1,
      noiseLength,
      this.ctx.sampleRate,
    );
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) output[i] = Math.random() * 2 - 1;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const hpFilter = this.ctx.createBiquadFilter();
    hpFilter.type = "highpass";
    hpFilter.frequency.setValueAtTime(4000, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.03, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noiseSource.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(gainNode);
    gainNode.connect(dest);
    oscillators.forEach((osc) => osc.start(now));
    noiseSource.start(now);
    oscillators.forEach((osc) => osc.stop(now + duration));
    noiseSource.stop(now + duration);
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeFairy(now, dest) {
    const notes = [987.77, 1318.51, 1975.53];
    const noteLength = 0.05;
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);
      noteGain.gain.setValueAtTime(0, noteTime);
      noteGain.gain.linearRampToValueAtTime(0.08, noteTime + 0.005);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength);
      osc.connect(noteGain);
      noteGain.connect(dest);
      osc.start(noteTime);
      osc.stop(noteTime + noteLength);
    });
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      250,
    );
  },

  synthesizeDeath(now, dest) {
    const duration = 0.35;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const lowOsc = this.ctx.createOscillator();
    lowOsc.type = "triangle";
    lowOsc.frequency.setValueAtTime(120, now);
    lowOsc.frequency.exponentialRampToValueAtTime(25, now + 0.12);
    const lowGain = this.ctx.createGain();
    lowGain.gain.setValueAtTime(0.08, now);
    lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    lowOsc.connect(lowGain);
    lowGain.connect(gainNode);
    const noiseLength = this.ctx.sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(
      1,
      noiseLength,
      this.ctx.sampleRate,
    );
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) output[i] = Math.random() * 2 - 1;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const lpFilter = this.ctx.createBiquadFilter();
    lpFilter.type = "lowpass";
    lpFilter.frequency.setValueAtTime(600, now);
    lpFilter.frequency.exponentialRampToValueAtTime(80, now + duration);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noiseSource.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(gainNode);
    const soulOsc = this.ctx.createOscillator();
    soulOsc.type = "sine";
    soulOsc.frequency.setValueAtTime(800, now);
    soulOsc.frequency.exponentialRampToValueAtTime(100, now + duration);
    const soulGain = this.ctx.createGain();
    soulGain.gain.setValueAtTime(0.02, now);
    soulGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    soulOsc.connect(soulGain);
    soulGain.connect(gainNode);
    gainNode.connect(dest);
    lowOsc.start(now);
    noiseSource.start(now);
    soulOsc.start(now);
    lowOsc.stop(now + duration);
    noiseSource.stop(now + duration);
    soulOsc.stop(now + duration);
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeDefeat(now, dest) {
    const duration = 1.6;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const freqs = [87.31, 110.0, 130.81, 174.61];
    const oscillators = [];
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(350, now);
    lowpass.frequency.exponentialRampToValueAtTime(80, now + duration);
    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 0.99, now + duration);
      osc.connect(lowpass);
      oscillators.push(osc);
    });
    const subOsc = this.ctx.createOscillator();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(43.65, now);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.15, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(gainNode);
    lowpass.connect(gainNode);
    gainNode.connect(dest);
    oscillators.forEach((o) => o.start(now));
    subOsc.start(now);
    oscillators.forEach((o) => o.stop(now + duration));
    subOsc.stop(now + duration);
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeRevive(now, dest) {
    const duration = 1.8;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const noteTime = now + delay;
      const chimeOsc = this.ctx.createOscillator();
      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(freq, noteTime);
      const chimeGain = this.ctx.createGain();
      chimeGain.gain.setValueAtTime(0, noteTime);
      chimeGain.gain.linearRampToValueAtTime(0.05, noteTime + 0.01);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(gainNode);
      chimeOsc.start(noteTime);
      chimeOsc.stop(noteTime + 0.65);
    });
    const padOsc1 = this.ctx.createOscillator();
    padOsc1.type = "triangle";
    padOsc1.frequency.setValueAtTime(130.81, now);
    const padOsc2 = this.ctx.createOscillator();
    padOsc2.type = "triangle";
    padOsc2.frequency.setValueAtTime(164.81, now);
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0, now);
    padGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
    padGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    padOsc1.connect(padGain);
    padOsc2.connect(padGain);
    padGain.connect(gainNode);
    gainNode.connect(dest);
    padOsc1.start(now);
    padOsc2.start(now);
    padOsc1.stop(now + duration);
    padOsc2.stop(now + duration);
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },
};

/* --- PROCEDURAL LOOT DROP ACOUSTIC SYNTHESIZER --- */
window.SoundManager.playLootDrop = function (stars) {
  let audioCtx = window.SoundManager.audioCtx || window.SoundManager.ctx;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.SoundManager.audioCtx = audioCtx;
    } catch (e) {
      console.warn("Web Audio API not supported on this browser.", e);
      return;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let masterVol =
    window.playerStats.volumeMaster !== undefined
      ? window.playerStats.volumeMaster
      : 0.5;
  let sfxVol =
    window.playerStats.volumeSFX !== undefined
      ? window.playerStats.volumeSFX
      : 0.8;
  let finalVol = masterVol * sfxVol;
  if (window.playerStats.mute) finalVol = 0;
  if (finalVol <= 0) return;

  let now = audioCtx.currentTime;

  let s = parseInt(stars, 10);
  if (isNaN(s)) {
    if (stars === "UNIQUE") s = 5;
    else s = 0;
  }
  s = Math.max(0, Math.min(5, s));

  let decayDuration = 0.25 * Math.exp(0.35 * s);
  decayDuration = Math.max(0.2, Math.min(1.8, decayDuration));

  let activeOscillatorsCount = 1 + Math.floor(s * 0.6);

  let lfoRate = 4.0 + s * 1.5;
  let lfoDepth = Math.max(0, (s - 2) * 5.0);

  let baseFreq = 261.63;
  if (s === 1) baseFreq = 329.63;
  if (s === 2) baseFreq = 392.0;
  if (s === 3) baseFreq = 523.25;
  if (s === 4) baseFreq = 659.25;
  if (s === 5) baseFreq = 783.99;

  const chordMultipliers = [1.0, 1.25, 1.5, 1.875];

  let masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(finalVol * 0.15, now + 0.015);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);
  masterGain.connect(audioCtx.destination);

  let lfo = null;
  let lfoGain = null;
  if (lfoDepth > 0) {
    lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(lfoRate, now);
    lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(lfoDepth, now);
    lfo.connect(lfoGain);
    lfo.start(now);
  }

  let oscillators = [];
  for (let i = 0; i < activeOscillatorsCount; i++) {
    let osc = audioCtx.createOscillator();
    let mult = chordMultipliers[i] || 1.0;
    let targetFreq = baseFreq * mult;

    if (i > 0) {
      osc.detune.setValueAtTime((i % 2 === 0 ? 5 : -5) * (s * 0.5), now);
    }

    if (s >= 4) {
      osc.type = i % 2 === 0 ? "triangle" : "sine";
    } else {
      osc.type = "sine";
    }

    osc.frequency.setValueAtTime(targetFreq, now);

    if (lfoGain) {
      lfoGain.connect(osc.frequency);
    }

    let delayOffset = 0;
    if (s >= 3 && i > 0) {
      delayOffset = i * 0.075;
    }

    let oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.setValueAtTime(0, now + delayOffset);
    oscGain.gain.linearRampToValueAtTime(
      1.0 / activeOscillatorsCount,
      now + delayOffset + 0.02,
    );
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(now + delayOffset);
    osc.stop(now + decayDuration + 0.1);
    oscillators.push(osc);
  }

  setTimeout(
    () => {
      if (lfo) lfo.disconnect();
      if (lfoGain) lfoGain.disconnect();
      oscillators.forEach((osc) => osc.disconnect());
      masterGain.disconnect();
    },
    (decayDuration + 0.5) * 1000,
  );
};

/* --- TACTILE INTERFACE SYNTHESIZER & AUTO-BINDINGS --- */

// Track timestamp to prevent sweep fatigue
window.SoundManager.lastHoverTime = 0;

// 1. Synthesize a Satisfying, Soft, "Bubbly Pop" Button Click
window.SoundManager.playClick = function () {
  let audioCtx = window.SoundManager.audioCtx || window.SoundManager.ctx;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.SoundManager.audioCtx = audioCtx;
    } catch (e) {
      return;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let masterVol =
    window.playerStats.volumeMaster !== undefined
      ? window.playerStats.volumeMaster
      : 0.5;
  let sfxVol =
    window.playerStats.volumeSFX !== undefined
      ? window.playerStats.volumeSFX
      : 0.8;
  let finalVol = masterVol * sfxVol;
  if (window.playerStats.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Primary bubble pop: short, upward-sweeping pure sine wave
  let osc1 = audioCtx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(450, now);
  osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.035);

  let gain1 = audioCtx.createGain();
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(finalVol * 0.18, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);

  // Secondary bubble pop: tiny companion offset to complete the bubbly "pop" texture
  let osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(700, now + 0.01);
  osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.03);

  let gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0, now + 0.01);
  gain2.gain.linearRampToValueAtTime(finalVol * 0.1, now + 0.014);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);

  osc1.start(now);
  osc1.stop(now + 0.06);
  osc2.start(now + 0.01);
  osc2.stop(now + 0.06);

  setTimeout(() => {
    osc1.disconnect();
    gain1.disconnect();
    osc2.disconnect();
    gain2.disconnect();
  }, 150);
};

// 2. Synthesize Reward/Purchase "Gold Chime & Settle" Sound
window.SoundManager.playPurchase = function () {
  let audioCtx = window.SoundManager.audioCtx || window.SoundManager.ctx;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.SoundManager.audioCtx = audioCtx;
    } catch (e) {
      return;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let masterVol =
    window.playerStats.volumeMaster !== undefined
      ? window.playerStats.volumeMaster
      : 0.5;
  let sfxVol =
    window.playerStats.volumeSFX !== undefined
      ? window.playerStats.volumeSFX
      : 0.8;
  let finalVol = masterVol * sfxVol;
  if (window.playerStats.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Phase A: Rewarding upward pentatonic cascade (magical transition)
  const notes = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
  const noteDelay = 0.035; // Fast, cascading roll
  const oscs = [];
  const gains = [];

  notes.forEach((freq, index) => {
    let osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + index * noteDelay);

    let gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.setValueAtTime(0, now + index * noteDelay);
    gainNode.gain.linearRampToValueAtTime(
      finalVol * 0.08,
      now + index * noteDelay + 0.01,
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + index * noteDelay + 0.22,
    );

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(now + index * noteDelay);
    osc.stop(now + index * noteDelay + 0.25);

    oscs.push(osc);
    gains.push(gainNode);
  });

  // Phase B: High-resonance crystal "coin ring" at the cascade's peak
  let coinOsc1 = audioCtx.createOscillator();
  let coinOsc2 = audioCtx.createOscillator();
  coinOsc1.type = "sine";
  coinOsc2.type = "sine";
  coinOsc1.frequency.setValueAtTime(2600, now + 0.12);
  coinOsc2.frequency.setValueAtTime(3900, now + 0.12);

  let coinGain = audioCtx.createGain();
  coinGain.gain.setValueAtTime(0, now);
  coinGain.gain.setValueAtTime(0, now + 0.12);
  coinGain.gain.linearRampToValueAtTime(finalVol * 0.12, now + 0.125);
  coinGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12 + 0.18);

  coinOsc1.connect(coinGain);
  coinOsc2.connect(coinGain);
  coinGain.connect(audioCtx.destination);

  coinOsc1.start(now + 0.12);
  coinOsc2.start(now + 0.12);
  coinOsc1.stop(now + 0.35);
  coinOsc2.stop(now + 0.35);

  // Phase C: Warm structural "settle" (subtle bass anchor indicating a resolved transaction)
  let settleOsc = audioCtx.createOscillator();
  settleOsc.type = "triangle";
  settleOsc.frequency.setValueAtTime(140, now + 0.05);
  settleOsc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

  let settleGain = audioCtx.createGain();
  settleGain.gain.setValueAtTime(0, now);
  settleGain.gain.setValueAtTime(0, now + 0.05);
  settleGain.gain.linearRampToValueAtTime(finalVol * 0.15, now + 0.08);
  settleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  settleOsc.connect(settleGain);
  settleGain.connect(audioCtx.destination);

  settleOsc.start(now + 0.05);
  settleOsc.stop(now + 0.35);

  setTimeout(() => {
    oscs.forEach((o) => o.disconnect());
    gains.forEach((g) => g.disconnect());
    coinOsc1.disconnect();
    coinOsc2.disconnect();
    coinGain.disconnect();
    settleOsc.disconnect();
    settleGain.disconnect();
  }, 500);
};

// 3. Synthesize Ethereal Hover Glide (with fatigue throttle)
window.SoundManager.playHover = function () {
  let nowMs = Date.now();
  if (nowMs - window.SoundManager.lastHoverTime < 120) return;
  window.SoundManager.lastHoverTime = nowMs;

  let audioCtx = window.SoundManager.audioCtx || window.SoundManager.ctx;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.SoundManager.audioCtx = audioCtx;
    } catch (e) {
      return;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let masterVol =
    window.playerStats.volumeMaster !== undefined
      ? window.playerStats.volumeMaster
      : 0.5;
  let sfxVol =
    window.playerStats.volumeSFX !== undefined
      ? window.playerStats.volumeSFX
      : 0.8;
  let finalVol = masterVol * sfxVol;
  if (window.playerStats.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;
  let duration = 0.11;

  let osc = audioCtx.createOscillator();
  osc.type = "sine";

  osc.frequency.setValueAtTime(659.25, now);
  osc.frequency.linearRampToValueAtTime(1318.51, now + 0.075);

  let gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(finalVol * 0.02, now + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);

  setTimeout(
    () => {
      osc.disconnect();
      gainNode.disconnect();
    },
    (duration + 0.1) * 1000,
  );
};

// 4. Synthesize Sigil Sack Opening Chime sequence
window.SoundManager.playSigilSackOpen = function () {
  let audioCtx = window.SoundManager.audioCtx || window.SoundManager.ctx;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.SoundManager.audioCtx = audioCtx;
    } catch (e) {
      return;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let masterVol =
    window.playerStats.volumeMaster !== undefined
      ? window.playerStats.volumeMaster
      : 0.5;
  let sfxVol =
    window.playerStats.volumeSFX !== undefined
      ? window.playerStats.volumeSFX
      : 0.8;
  let finalVol = masterVol * sfxVol;
  if (window.playerStats.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Cloth/drawstring rustle burst (bandpass-filtered white noise)
  let rustleDuration = 0.12;
  let bufferSize = audioCtx.sampleRate * rustleDuration;
  let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  let data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  let noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;

  let noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1000, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(300, now + rustleDuration);
  noiseFilter.Q.setValueAtTime(2, now);

  let noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(finalVol * 0.15, now + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + rustleDuration);

  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noiseNode.start(now);
  noiseNode.stop(now + rustleDuration + 0.05);

  // Heavy Sigil Stone Tumbling (resonance thump)
  let thudOsc = audioCtx.createOscillator();
  thudOsc.type = "triangle";
  thudOsc.frequency.setValueAtTime(160, now + 0.04);
  thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.14);

  let thudGain = audioCtx.createGain();
  thudGain.gain.setValueAtTime(0, now);
  thudGain.gain.setValueAtTime(0, now + 0.04);
  thudGain.gain.linearRampToValueAtTime(finalVol * 0.25, now + 0.05);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  thudOsc.connect(thudGain);
  thudGain.connect(audioCtx.destination);
  thudOsc.start(now + 0.04);
  thudOsc.stop(now + 0.2);

  // Rising detuned magical sigil glow (Fifth Interval: C4/G4 -> C5/G5)
  let sweepDur = 0.35;
  let sweepOsc1 = audioCtx.createOscillator();
  let sweepOsc2 = audioCtx.createOscillator();
  sweepOsc1.type = "sine";
  sweepOsc2.type = "sine";

  sweepOsc1.frequency.setValueAtTime(261.63, now + 0.08);
  sweepOsc1.frequency.exponentialRampToValueAtTime(
    523.25,
    now + 0.08 + sweepDur,
  );
  sweepOsc2.frequency.setValueAtTime(392.0, now + 0.08);
  sweepOsc2.frequency.exponentialRampToValueAtTime(
    783.99,
    now + 0.08 + sweepDur,
  );

  let sweepGain = audioCtx.createGain();
  sweepGain.gain.setValueAtTime(0, now);
  sweepGain.gain.setValueAtTime(0, now + 0.08);
  sweepGain.gain.linearRampToValueAtTime(finalVol * 0.12, now + 0.18);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08 + sweepDur);

  sweepOsc1.connect(sweepGain);
  sweepOsc2.connect(sweepGain);
  sweepGain.connect(audioCtx.destination);

  sweepOsc1.start(now + 0.08);
  sweepOsc2.start(now + 0.08);
  sweepOsc1.stop(now + 0.08 + sweepDur + 0.05);
  sweepOsc2.stop(now + 0.08 + sweepDur + 0.05);

  setTimeout(() => {
    noiseNode.disconnect();
    noiseFilter.disconnect();
    noiseGain.disconnect();
    thudOsc.disconnect();
    thudGain.disconnect();
    sweepOsc1.disconnect();
    sweepOsc2.disconnect();
    sweepGain.disconnect();
  }, 600);
};

// 5. Synthesize Monster Card Pack Opening sequence
window.SoundManager.playCardPackOpen = function () {
  let audioCtx = window.SoundManager.audioCtx || window.SoundManager.ctx;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      window.SoundManager.audioCtx = audioCtx;
    } catch (e) {
      return;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  let masterVol =
    window.playerStats.volumeMaster !== undefined
      ? window.playerStats.volumeMaster
      : 0.5;
  let sfxVol =
    window.playerStats.volumeSFX !== undefined
      ? window.playerStats.volumeSFX
      : 0.8;
  let finalVol = masterVol * sfxVol;
  if (window.playerStats.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Foil pack tearing sound (amplitude-modulated white noise)
  let tearDur = 0.18;
  let bufferSize = audioCtx.sampleRate * tearDur;
  let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  let data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    let am = Math.sin(i * 0.05) * 0.3 + 0.7; // envelope card tear texture
    data[i] = (Math.random() * 2 - 1) * am;
  }
  let tearNode = audioCtx.createBufferSource();
  tearNode.buffer = buffer;

  let tearFilter = audioCtx.createBiquadFilter();
  tearFilter.type = "highpass";
  tearFilter.frequency.setValueAtTime(3500, now);

  let tearGain = audioCtx.createGain();
  tearGain.gain.setValueAtTime(0, now);
  tearGain.gain.linearRampToValueAtTime(finalVol * 0.18, now + 0.015);
  tearGain.gain.exponentialRampToValueAtTime(0.0001, now + tearDur);

  tearNode.connect(tearFilter);
  tearFilter.connect(tearGain);
  tearGain.connect(audioCtx.destination);
  tearNode.start(now);
  tearNode.stop(now + tearDur + 0.05);

  // dealt card flicks (3 quick sweep slips)
  const playCardFlick = (time, pitch) => {
    let flickOsc = audioCtx.createOscillator();
    flickOsc.type = "sine";
    flickOsc.frequency.setValueAtTime(pitch, time);
    flickOsc.frequency.exponentialRampToValueAtTime(pitch * 0.5, time + 0.03);

    let flickGain = audioCtx.createGain();
    flickGain.gain.setValueAtTime(0, time);
    flickGain.gain.linearRampToValueAtTime(finalVol * 0.08, time + 0.003);
    flickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    flickOsc.connect(flickGain);
    flickGain.connect(audioCtx.destination);
    flickOsc.start(time);
    flickOsc.stop(time + 0.04);

    setTimeout(() => {
      flickOsc.disconnect();
      flickGain.disconnect();
    }, 100);
  };

  playCardFlick(now + 0.06, 800);
  playCardFlick(now + 0.11, 1000);
  playCardFlick(now + 0.16, 1200);

  // Card Reveal Final snap (payoff thump)
  let snapOsc = audioCtx.createOscillator();
  snapOsc.type = "triangle";
  snapOsc.frequency.setValueAtTime(600, now + 0.22);
  snapOsc.frequency.exponentialRampToValueAtTime(150, now + 0.27);

  let snapGain = audioCtx.createGain();
  snapGain.gain.setValueAtTime(0, now);
  snapGain.gain.setValueAtTime(0, now + 0.22);
  snapGain.gain.linearRampToValueAtTime(finalVol * 0.22, now + 0.223);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.27);

  snapOsc.connect(snapGain);
  snapGain.connect(audioCtx.destination);
  snapOsc.start(now + 0.22);
  snapOsc.stop(now + 0.32);

  // Sparkling card reveal chime (rising bubbly sweep)
  let chimeOsc = audioCtx.createOscillator();
  chimeOsc.type = "sine";
  chimeOsc.frequency.setValueAtTime(880, now + 0.22);
  chimeOsc.frequency.exponentialRampToValueAtTime(2200, now + 0.22 + 0.25);

  let chimeGain = audioCtx.createGain();
  chimeGain.gain.setValueAtTime(0, now);
  chimeGain.gain.setValueAtTime(0, now + 0.22);
  chimeGain.gain.linearRampToValueAtTime(finalVol * 0.15, now + 0.25);
  chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22 + 0.3);

  chimeOsc.connect(chimeGain);
  chimeGain.connect(audioCtx.destination);
  chimeOsc.start(now + 0.22);
  chimeOsc.stop(now + 0.22 + 0.35);

  setTimeout(() => {
    tearNode.disconnect();
    tearFilter.disconnect();
    tearGain.disconnect();
    snapOsc.disconnect();
    snapGain.disconnect();
    chimeOsc.disconnect();
    chimeGain.disconnect();
  }, 700);
};

// 6. Centralized Non-Blocking DOM Event Delegator with Fallbacks
window.SoundManager.initTactileFeedback = function () {
  document.addEventListener("click", function (e) {
    if (!e.target || typeof e.target.closest !== "function") return;

    // A. Detect Sigil Sack Opening triggers
    let sackTarget = e.target.closest(
      ".open-sack, .sigil-sack, .bag-open, [class*='sigil-sack'], [id*='sigil-sack'], [class*='sack-open'], [id*='sack-open']",
    );
    if (sackTarget) {
      window.SoundManager.playSigilSackOpen();
      return;
    }

    // B. Detect Monster Card Pack Opening triggers
    let packTarget = e.target.closest(
      ".open-pack, .card-pack, .monster-pack, [class*='card-pack'], [id*='card-pack'], [class*='pack-open'], [id*='pack-open']",
    );
    if (packTarget) {
      window.SoundManager.playCardPackOpen();
      return;
    }

    // C. Detect Purchases / Upgrades / Gold Sinks / PP / QP Upgrades
    let purchaseTarget = e.target.closest(
      ".btn-buy, .buy-btn, .purchase-btn, .shop-item-buy, .gold-sink, .gold-sink-btn, .pp-upgrade, .qp-upgrade, .upgrade-btn, .btn-upgrade, [class*='buy-btn'], [class*='purchase'], [class*='upgrade'], [id*='buy'], [id*='upgrade']",
    );
    if (purchaseTarget) {
      window.SoundManager.playPurchase();
      return;
    }

    // D. Detect Normal Action Clicks (Tabs, Selectors, Slots, General Buttons)
    let clickTarget = e.target.closest(
      ".btn-action, .tab-btn, .sub-tab-btn, .slots-card, .forge-anvil-button, .custom-select-trigger, .custom-select-option",
    );
    if (clickTarget) {
      window.SoundManager.playClick();
    }
  });

  // Listen globally for hover focus on bags, cards, and shop entries
  document.addEventListener(
    "pointerenter",
    function (e) {
      if (!e.target || typeof e.target.closest !== "function") return;

      let target = e.target.closest(
        ".bag-item, .slots-card, .tab-btn, .sub-tab-btn, .shop-row, .active-effect-badge, .hub-card, .bestiary-card-item",
      );
      if (target) {
        window.SoundManager.playHover();
      }
    },
    true,
  );
};

// Auto-register listener bindings on script load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    window.SoundManager.initTactileFeedback();
  });
} else {
  window.SoundManager.initTactileFeedback();
}
