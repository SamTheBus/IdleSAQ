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
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
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
