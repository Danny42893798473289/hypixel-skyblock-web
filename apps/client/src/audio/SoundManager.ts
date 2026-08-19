type SoundId = 'menu_open' | 'menu_close' | 'item_pickup' | 'level_up' | 'combat_hit' | 'warp' | 'chat_message' | 'error';

class SoundManager {
  private ctx: AudioContext | null = null;
  private _volume = 0.3;
  private _muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  get volume() { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); this.save(); }

  get muted() { return this._muted; }
  set muted(m: boolean) { this._muted = m; this.save(); }

  load() {
    try {
      const saved = localStorage.getItem('aether_sound');
      if (saved) {
        const data = JSON.parse(saved);
        this._volume = data.volume ?? 0.3;
        this._muted = data.muted ?? false;
      }
    } catch { /* ignore */ }
  }

  private save() {
    try {
      localStorage.setItem('aether_sound', JSON.stringify({ volume: this._volume, muted: this._muted }));
    } catch { /* ignore */ }
  }

  play(sound: SoundId) {
    if (this._muted || this._volume <= 0) return;
    try {
      const ctx = this.getCtx();
      const gain = ctx.createGain();
      gain.gain.value = this._volume * 0.3;
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const now = ctx.currentTime;

      switch (sound) {
        case 'menu_open':
          osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); osc.frequency.linearRampToValueAtTime(660, now + 0.08);
          gain.gain.setValueAtTime(this._volume * 0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.1);
          break;
        case 'menu_close':
          osc.type = 'sine'; osc.frequency.setValueAtTime(660, now); osc.frequency.linearRampToValueAtTime(440, now + 0.08);
          gain.gain.setValueAtTime(this._volume * 0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.1);
          break;
        case 'item_pickup':
          osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.linearRampToValueAtTime(1200, now + 0.05);
          gain.gain.setValueAtTime(this._volume * 0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.06);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.06);
          break;
        case 'level_up':
          osc.type = 'sine'; osc.frequency.setValueAtTime(523, now);
          osc.frequency.setValueAtTime(659, now + 0.1); osc.frequency.setValueAtTime(784, now + 0.2);
          gain.gain.setValueAtTime(this._volume * 0.25, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.4);
          break;
        case 'combat_hit':
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(100, now + 0.06);
          gain.gain.setValueAtTime(this._volume * 0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.08);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.08);
          break;
        case 'warp':
          osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
          gain.gain.setValueAtTime(this._volume * 0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.2);
          break;
        case 'chat_message':
          osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(this._volume * 0.08, now); gain.gain.linearRampToValueAtTime(0, now + 0.05);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.05);
          break;
        case 'error':
          osc.type = 'square'; osc.frequency.setValueAtTime(200, now);
          gain.gain.setValueAtTime(this._volume * 0.15, now); gain.gain.linearRampToValueAtTime(0, now + 0.15);
          osc.connect(gain); osc.start(now); osc.stop(now + 0.15);
          break;
      }
    } catch { /* ignore audio errors */ }
  }
}

export const soundManager = new SoundManager();
soundManager.load();
