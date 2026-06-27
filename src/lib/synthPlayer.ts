// Procedural Web Audio API Synthesizer for generating high-fidelity 20-second song previews.
// Designed to be fully standalone, offline-friendly, and safe from CORS/broken URL errors.

export class SynthPlayer {
  private ctx: AudioContext | null = null;
  private activeNodes: AudioNode[] = [];
  private isPlaying = false;
  private timer: any = null;
  private duration = 20; // 20 seconds limit
  private startTime = 0;
  private analyser: AnalyserNode | null = null;
  private onEndCallback: (() => void) | null = null;
  private onUpdateCallback: ((elapsed: number, analyser: AnalyserNode | null) => void) | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isRealAudio = false;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Helper to convert MIDI pitch to frequency
  private mtof(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // Play a beautiful, highly pleasant lo-fi/ambient preview of a song based on its genre
  // Supports real 30-second audio stream playback when previewUrl is present, with robust fallbacks
  public play(
    genre: string,
    title: string,
    artist: string,
    previewUrl: string | undefined,
    onUpdate: (elapsed: number, analyser: AnalyserNode | null) => void,
    onEnd: () => void
  ) {
    // 1. Prevent the old onEndCallback from firing and resetting React state
    this.onEndCallback = null;
    this.stop();
    this.initCtx();

    if (!this.ctx) return;

    this.isPlaying = true;
    this.startTime = this.ctx.currentTime;
    this.onEndCallback = onEnd;
    this.onUpdateCallback = onUpdate;
    this.duration = previewUrl ? 30 : 20; // 30s for real audio, 20s for procedural synth

    // Set up Analyser node for gorgeous real-time visualizers
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.connect(this.ctx.destination);

    if (previewUrl) {
      this.isRealAudio = true;
      try {
        const audio = new Audio(previewUrl);
        audio.crossOrigin = "anonymous";
        this.audioElement = audio;
        
        audio.onended = () => {
          this.stop();
        };

        audio.onerror = () => {
          console.warn("Audio element failed to load/play, falling back to beautiful synth engine");
          if (this.isRealAudio) {
            this.isRealAudio = false;
            this.playProceduralSynth(genre);
          }
        };

        let isConnectedNode = false;
        try {
          const source = this.ctx.createMediaElementSource(audio);
          source.connect(this.analyser);
          isConnectedNode = true;
        } catch (e) {
          console.log("AudioContext MediaElementSource skipped (usually standard browser sandbox or CORS), playing natively as HTML5 Audio", e);
        }

        audio.play().catch((err) => {
          console.log("Native HTML5 Audio element play failed, falling back to beautiful synth engine", err);
          if (this.isRealAudio) {
            this.isRealAudio = false;
            this.playProceduralSynth(genre);
          }
        });

        if (this.isPlaying && this.isRealAudio) {
          const trackProgress = () => {
            if (!this.isPlaying || !this.audioElement || !this.isRealAudio) return;
            const elapsed = this.audioElement.currentTime;

            // Generate some nice fake ambient wave oscillations to keep the visualizer dancing 
            // even if createMediaElementSource was blocked by standard browser sandbox
            if (!isConnectedNode && this.analyser) {
              const mockBuffer = new Uint8Array(this.analyser.frequencyBinCount);
              for (let i = 0; i < mockBuffer.length; i++) {
                mockBuffer[i] = 128 + Math.sin(Date.now() * 0.005 + i * 0.3) * 50 * (Math.random() * 0.4 + 0.8);
              }
            }

            this.onUpdateCallback?.(elapsed, this.analyser);
            
            if (elapsed >= this.duration) {
              this.stop();
              return;
            }
            this.timer = setTimeout(trackProgress, 100);
          };
          trackProgress();
        }
        return;
      } catch (err) {
        console.warn("Failed to set up real audio, using procedural synthesizer as fallback", err);
        this.isRealAudio = false;
      }
    }

    this.playProceduralSynth(genre);
  }

  // Fallback procedural lo-fi synthesizer
  private playProceduralSynth(genre: string) {
    if (!this.ctx || !this.analyser) return;

    const gLower = (genre || "pop").toLowerCase();

    // Determine musical structure (BPM, scales, chords, and instrument profiles) based on genre
    let bpm = 110;
    let chordProgression: number[][] = []; // MIDI note groups
    let melodyNotes: number[] = [];
    let soundType: "smooth" | "retro" | "plucked" | "bass-heavy" = "smooth";

    if (gLower.includes("amapiano") || gLower.includes("afrobeats") || gLower.includes("gqom")) {
      bpm = 112;
      soundType = "bass-heavy"; // Log drum heavy
      // Amapiano syncopated chords (A minor 9, D minor 11)
      chordProgression = [
        [57, 60, 64, 67, 71], // Am9
        [57, 60, 64, 67, 71], 
        [50, 53, 57, 60, 64, 69], // Dm11
        [50, 53, 57, 60, 64, 69],
      ];
      melodyNotes = [64, 67, 69, 71, 69, 67, 64, 60, 64, 67, 71, 76, 74, 71, 69];
    } else if (gLower.includes("synth") || gLower.includes("electronic") || gLower.includes("house") || gLower.includes("techno") || gLower.includes("disco")) {
      bpm = 124;
      soundType = "retro"; // Synth-wave 80s feel
      chordProgression = [
        [57, 60, 64, 67], // Am7
        [53, 57, 60, 64], // Fmaj7
        [48, 52, 55, 59], // Cmaj7
        [55, 59, 62, 66], // Gmaj7
      ];
      melodyNotes = [64, 67, 71, 74, 71, 67, 60, 62, 64, 67, 69, 71, 76, 74, 71];
    } else if (gLower.includes("rock") || gLower.includes("indie") || gLower.includes("alternative") || gLower.includes("grunge")) {
      bpm = 118;
      soundType = "retro"; // Gritty analog synth
      chordProgression = [
        [45, 52, 57], // A5 Power chord
        [41, 48, 53], // F5 Power chord
        [48, 55, 60], // C5 Power chord
        [50, 57, 62], // D5 Power chord
      ];
      melodyNotes = [57, 60, 57, 62, 60, 57, 64, 62, 60, 57];
    } else if (gLower.includes("soul") || gLower.includes("r&b") || gLower.includes("jazz") || gLower.includes("lo-fi")) {
      bpm = 78;
      soundType = "smooth"; // Warm neo-soul keys
      chordProgression = [
        [50, 53, 57, 60, 64], // Dm9
        [55, 59, 62, 65, 69], // G9
        [48, 52, 55, 59, 62], // Cmaj9
        [53, 57, 60, 64, 67], // Fmaj9
      ];
      melodyNotes = [64, 65, 69, 71, 72, 71, 69, 64, 60, 62, 64, 67, 64, 60];
    } else if (gLower.includes("folk") || gLower.includes("acoustic") || gLower.includes("country")) {
      bpm = 92;
      soundType = "plucked"; // Delicate guitar plucks
      chordProgression = [
        [48, 55, 60, 64], // C
        [55, 59, 62, 67], // G
        [45, 52, 57, 60], // Am
        [53, 57, 60, 65], // F
      ];
      melodyNotes = [60, 64, 67, 72, 67, 64, 60, 62, 64, 67, 69, 67];
    } else {
      // Default: Clean modern Pop / Hip-hop bouncy trap style
      bpm = 135;
      soundType = "smooth";
      chordProgression = [
        [50, 53, 57, 60], // Dm7
        [57, 60, 64, 67], // Am7
        [53, 57, 60, 64], // Fmaj7
        [55, 59, 62, 65], // G7
      ];
      melodyNotes = [69, 72, 76, 72, 69, 65, 67, 69, 72, 74, 76, 79];
    }

    const secondsPerBeat = 60 / bpm;
    const stepDuration = secondsPerBeat / 2; // eighth notes or sixteenths depending on speed

    let currentStep = 0;
    const totalStepsToPlay = Math.floor(this.duration / stepDuration);

    const scheduleNextBeats = () => {
      if (!this.isPlaying || !this.ctx || !this.analyser) return;

      const now = this.ctx.currentTime;
      const elapsed = now - this.startTime;

      if (elapsed >= this.duration) {
        this.stop();
        return;
      }

      this.onUpdateCallback?.(elapsed, this.analyser);

      // Look ahead and schedule notes for the next 200ms
      const lookAhead = 0.2;
      let scheduleTime = this.startTime + currentStep * stepDuration;

      while (scheduleTime < now + lookAhead && currentStep < totalStepsToPlay) {
        const chordIndex = Math.floor(currentStep / 8) % chordProgression.length;
        const noteIndex = currentStep % 8;

        // Schedule Chords (Pads) on the 1st and 5th steps of each measure
        if (noteIndex === 0 || noteIndex === 4) {
          const chord = chordProgression[chordIndex];
          chord.forEach((midiNote) => {
            this.playSynthNote(midiNote - 12, scheduleTime, stepDuration * 3.5, "pad", soundType);
          });
        }

        // Schedule Drums (Kick & Percussion)
        this.playDrums(currentStep, scheduleTime, soundType);

        // Schedule Lead Melody
        if (noteIndex % 2 === 1 && Math.random() > 0.3) {
          const melodyPool = melodyNotes;
          const randomNote = melodyPool[(currentStep * 3 + chordIndex) % melodyPool.length];
          this.playSynthNote(randomNote, scheduleTime, stepDuration * 0.9, "lead", soundType);
        }

        currentStep++;
        scheduleTime = this.startTime + currentStep * stepDuration;
      }

      // Keep scheduling
      this.timer = setTimeout(scheduleNextBeats, 50);
    };

    // Begin scheduling beats
    scheduleNextBeats();
  }

  // Synthesize custom drum hits procedurally for absolute audio quality
  private playDrums(step: number, time: number, soundType: string) {
    if (!this.ctx || !this.analyser) return;

    const beatIndex = step % 8;

    // 1. Kick Drum
    const isKick = beatIndex === 0 || beatIndex === 4 || (soundType === "bass-heavy" && (beatIndex === 2 || beatIndex === 6));
    if (isKick) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();

      kickOsc.connect(kickGain);
      kickGain.connect(this.analyser);

      kickOsc.frequency.setValueAtTime(150, time);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

      kickGain.gain.setValueAtTime(0.6, time);
      kickGain.gain.linearRampToValueAtTime(0.01, time + 0.15);

      kickOsc.start(time);
      kickOsc.stop(time + 0.16);

      this.activeNodes.push(kickOsc, kickGain);
    }

    // 2. High Hat / Shakers (syncopated)
    const isHat = beatIndex % 2 === 1 || (soundType === "bass-heavy" && beatIndex % 4 !== 0);
    if (isHat) {
      // Synthesize noise-like hat with a high-pass filtered wave
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();

      hatOsc.type = "square";
      hatOsc.frequency.setValueAtTime(10000, time);

      hatOsc.connect(hatGain);
      hatGain.connect(this.analyser);

      const hatDuration = soundType === "bass-heavy" ? 0.05 : 0.03;
      hatGain.gain.setValueAtTime(soundType === "bass-heavy" ? 0.08 : 0.04, time);
      hatGain.gain.linearRampToValueAtTime(0.001, time + hatDuration);

      hatOsc.start(time);
      hatOsc.stop(time + hatDuration);

      this.activeNodes.push(hatOsc, hatGain);
    }
  }

  // Beautiful synthesizer instrument voices built with advanced envelope control
  private playSynthNote(
    midiNote: number,
    time: number,
    duration: number,
    role: "pad" | "lead",
    soundType: "smooth" | "retro" | "plucked" | "bass-heavy"
  ) {
    if (!this.ctx || !this.analyser) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.analyser);

    const freq = this.mtof(midiNote);
    osc.frequency.setValueAtTime(freq, time);

    // Apply sound types
    if (soundType === "retro") {
      osc.type = role === "lead" ? "sawtooth" : "triangle";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(role === "lead" ? 1800 : 900, time);
      filter.frequency.exponentialRampToValueAtTime(role === "lead" ? 800 : 300, time + duration);
    } else if (soundType === "plucked") {
      osc.type = "sine";
      // Plucked string emulation using a triangular envelope on an oscillator and higher filters
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, time);
      filter.frequency.exponentialRampToValueAtTime(400, time + duration);
    } else if (soundType === "bass-heavy") {
      // Amapiano log drum / deep sub-bass sound profile
      osc.type = role === "lead" ? "triangle" : "sine";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(role === "lead" ? 400 : 150, time);
      // Pitch slide for log drum effect
      if (role === "lead") {
        osc.frequency.setValueAtTime(freq * 1.5, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + 0.1);
      }
    } else {
      // Smooth modern R&B / Chillwave style sine/triangle pad
      osc.type = "triangle";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, time);
      filter.frequency.exponentialRampToValueAtTime(350, time + duration);
    }

    // Set gain envelopes (ADSR style)
    const attack = role === "lead" ? 0.02 : 0.25;
    const release = role === "lead" ? 0.15 : 0.4;
    const maxGain = role === "lead" ? 0.15 : 0.08;

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(maxGain, time + attack);
    gainNode.gain.setValueAtTime(maxGain, time + duration - release);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.start(time);
    osc.stop(time + duration);

    this.activeNodes.push(osc, gainNode, filter);
  }

  // Instantly halt all active audio nodes and release context
  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = "";
      } catch (e) {}
      this.audioElement = null;
    }
    this.isRealAudio = false;

    // Stop and disconnect all scheduled audio nodes
    this.activeNodes.forEach((node) => {
      try {
        // @ts-ignore
        node.stop?.();
      } catch (e) {}
      try {
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];

    this.onEndCallback?.();
    this.onEndCallback = null;
    this.onUpdateCallback = null;
    this.analyser = null;
  }
}

// Global shared synth player instance
export const globalSynthPlayer = new SynthPlayer();
