export type MusicPreset = 'ambient' | 'lofi' | 'bright';

/** Original generative instrumental patterns. No recordings or external music requests. */
export class MoodMusic {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private clock: ReturnType<typeof setInterval> | null = null;
  private active = false;
  private step = 0;
  private next = 0;
  private preset: MusicPreset = 'ambient';
  private volume = 0.35;
  private noise: AudioBuffer | null = null;

  async start(preset: MusicPreset, volume: number) {
    this.stop();
    if (!window.AudioContext) throw new Error('Browser ini belum mendukung musik. Coba Chrome atau Safari terbaru.');
    const context = new AudioContext();
    this.context = context;
    this.preset = preset;
    this.volume = volume;
    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    this.master = master;
    this.active = true;
    try {
      await context.resume();
      // A stop/visibility change can happen while the browser resumes audio.
      if (!this.active || this.context !== context) return false;
      if (context.state !== 'running') throw new Error('Musik belum dapat diputar. Ketuk Putar musik sekali lagi.');
      master.gain.linearRampToValueAtTime(this.volume * 0.38, context.currentTime + 0.8);
      this.step = 0;
      this.next = context.currentTime + 0.08;
      this.schedule();
      this.clock = setInterval(() => this.schedule(), 100);
      return true;
    } catch (error) {
      // A superseded resume failure must not stop a newer playback session.
      if (this.context !== context) return false;
      this.stop();
      throw error;
    }
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.context && this.master && this.active) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(volume * 0.38, this.context.currentTime, 0.1);
    }
  }

  private note(midi: number, time: number, duration: number, level: number, type: OscillatorType = 'sine') {
    const context = this.context;
    if (!context || !this.master) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(level, time + Math.min(0.25, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.05);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  private percussion(kind: 'kick' | 'snare' | 'hat', time: number, level: number) {
    const context = this.context;
    if (!context || !this.master) return;
    const envelope = context.createGain();
    envelope.connect(this.master);
    if (kind === 'kick') {
      const oscillator = context.createOscillator();
      oscillator.frequency.setValueAtTime(135, time);
      oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.14);
      envelope.gain.setValueAtTime(level, time);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
      oscillator.connect(envelope); oscillator.start(time); oscillator.stop(time + 0.25);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
      return;
    }
    if (!this.noise) {
      this.noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.25), context.sampleRate);
      const samples = this.noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource(); source.buffer = this.noise;
    const filter = context.createBiquadFilter(); filter.type = 'highpass';
    filter.frequency.value = kind === 'hat' ? 6500 : 1800;
    const duration = kind === 'hat' ? 0.045 : 0.16;
    envelope.gain.setValueAtTime(level, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter); filter.connect(envelope); source.start(time); source.stop(time + duration);
    source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
  }

  private schedule() {
    const context = this.context;
    if (!context || !this.active) return;
    // Ambient has no drum grid; the other rooms use eighth-note steps.
    const beat = this.preset === 'ambient' ? 1.5 : this.preset === 'lofi' ? 60 / 76 / 2 : 60 / 112 / 2;
    this.next = Math.max(this.next, context.currentTime + 0.02);
    while (this.next < context.currentTime + 0.35) {
      const step = this.step, time = this.next;
      if (this.preset === 'ambient') {
        const pads = [[50, 57, 64, 69], [46, 53, 60, 65], [48, 55, 62, 67], [53, 60, 67, 72]];
        const chord = pads[Math.floor(step / 8) % pads.length];
        if (step % 8 === 0) chord.forEach((pitch, i) => this.note(pitch, time + i * 0.18, 13, 0.16));
        if (step % 4 === 2) this.note(chord[2] + 12, time, 5.5, 0.045);
      } else if (this.preset === 'lofi') {
        const chords = [[45, 52, 55, 60], [50, 57, 60, 65], [43, 50, 53, 59], [48, 55, 59, 64]];
        const chord = chords[Math.floor(step / 16) % chords.length];
        const swing = step % 2 ? beat * 0.16 : 0;
        if ([0, 6, 10].includes(step % 16)) chord.slice(1).forEach((pitch, i) => this.note(pitch + 12, time + swing + i * 0.012, 0.65, 0.10, 'triangle'));
        if (step % 4 === 0) this.note(chord[0] - 12, time, 0.5, 0.24);
        if (step % 8 === 0 || step % 8 === 5) this.percussion('kick', time + swing, 0.32);
        if (step % 8 === 2 || step % 8 === 6) this.percussion('snare', time, 0.095);
        this.percussion('hat', time + swing, step % 2 ? 0.028 : 0.045);
      } else {
        const chords = [[53, 57, 60], [60, 64, 67], [62, 65, 69], [58, 62, 65]];
        const chord = chords[Math.floor(step / 16) % chords.length];
        const melody = [72, 76, 79, 76, 74, 72, 69, 72, 77, 76, 74, 72, 69, 67, 69, 72];
        const transpose = [0, 2, 5, -2][Math.floor(step / 16) % 4];
        this.note(melody[step % 16] + transpose, time, 0.24, 0.17, 'triangle');
        // A second, quiet harmonic gives the lead a bell-like attack.
        this.note(melody[step % 16] + transpose + 12, time, 0.09, 0.038);
        if (step % 4 === 0) {
          chord.forEach(pitch => this.note(pitch, time, 0.3, 0.085, 'triangle'));
          this.note(chord[0] - 12, time, 0.22, 0.2);
          this.percussion('kick', time, 0.25);
        }
        if (step % 8 === 2 || step % 8 === 6) this.percussion('snare', time, 0.075);
        this.percussion('hat', time, step % 2 ? 0.04 : 0.055);
      }
      this.next += beat;
      this.step++;
    }
  }

  stop() {
    this.active = false;
    if (this.clock) clearInterval(this.clock);
    this.clock = null;
    const context = this.context;
    const master = this.master;
    this.context = null;
    this.master = null;
    this.noise = null;
    if (context && context.state !== 'closed') {
      if (master && context.state === 'running') {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0, context.currentTime, 0.04);
        setTimeout(() => { void context.close().catch(() => {}); }, 200);
      } else void context.close().catch(() => {});
    }
  }
}
