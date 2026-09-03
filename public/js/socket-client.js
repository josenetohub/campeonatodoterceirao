/**
 * Shared Socket Client & Audio Synthesizer
 */

const socket = io();

// Sons sintetizados via Web Audio API (sem necessidade de arquivos de áudio externos)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const SoundFX = {
  playTone(frequency, duration, type = "sine") {
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  },

  correct() {
    this.playTone(523.25, 0.12); // C5
    setTimeout(() => this.playTone(659.25, 0.15), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.3), 200); // G5
  },

  wrong() {
    this.playTone(220, 0.2, "sawtooth");
    setTimeout(() => this.playTone(180, 0.3, "sawtooth"), 150);
  },

  hintUnlocked() {
    // Som misterioso e brilhante para indicar a Dica de Ouro
    this.playTone(440, 0.1, "triangle");
    setTimeout(() => this.playTone(554.37, 0.15, "triangle"), 80);
    setTimeout(() => this.playTone(659.25, 0.25, "triangle"), 160);
    setTimeout(() => this.playTone(880, 0.4, "sine"), 240);
  },

  victory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, idx) => {
      setTimeout(() => this.playTone(note, 0.3, "triangle"), idx * 120);
    });
  }
};

window.SocketClient = socket;
window.SoundFX = SoundFX;
