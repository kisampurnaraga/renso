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

  private schedule() {
    const context = this.context;
    if (!context || !this.active) return;
    const beat = this.preset === 'ambient' ? 1.15 : this.preset === 'lofi' ? 0.82 : 0.56;
    // Recover from a suspended/throttled tab without scheduling a burst of old notes.
    this.next = Math.max(this.next, context.currentTime + 0.02);
    while (this.next < context.currentTime + 0.35) {
      const chords = [[48, 55, 60, 64], [45, 52, 57, 60], [53, 60, 65, 69], [43, 50, 55, 59]];
      const chord = chords[Math.floor(this.step / 8) % chords.length];
      if (this.step % 8 === 0) chord.forEach((note, i) => this.note(note, this.next + i * 0.025, beat * 7, 0.13));
      const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
      this.note(chord[pattern[this.step % 8]] + 12, this.next, beat * 1.65, this.preset === 'ambient' ? 0.09 : 0.18);
      if (this.preset !== 'ambient' && this.step % 2 === 0) this.note(chord[0] - 12, this.next, beat * 0.65, 0.19);
      if (this.preset === 'bright' && this.step % 4 === 3) this.note(chord[2] + 24, this.next + beat / 2, beat, 0.08);
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
    if (context && context.state !== 'closed') {
      if (master && context.state === 'running') {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0, context.currentTime, 0.04);
        setTimeout(() => { void context.close().catch(() => {}); }, 200);
      } else void context.close().catch(() => {});
    }
  }
}
