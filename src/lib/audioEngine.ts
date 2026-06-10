import { AudioControls, SoundBeautifierPreset, VoiceTuningParams } from '../types';

class PitchShifterNode {
  ctx: AudioContext;
  public input: GainNode;
  public output: GainNode;

  private delay1: DelayNode;
  private delay2: DelayNode;
  private gain1: GainNode;
  private gain2: GainNode;

  private bufferSource: AudioBufferSourceNode | null = null;
  private splitter: ChannelSplitterNode | null = null;

  private modGain1: GainNode;
  private modGain2: GainNode;

  private delayTime: number = 0.040; // 40ms depth
  private pitch: number = 1.0; // pitch ratio (0.5 to 2.0)

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.delay1 = ctx.createDelay(1.0);
    this.delay2 = ctx.createDelay(1.0);

    this.gain1 = ctx.createGain();
    this.gain2 = ctx.createGain();

    this.modGain1 = ctx.createGain();
    this.modGain2 = ctx.createGain();

    // Connect audio paths
    this.input.connect(this.delay1);
    this.input.connect(this.delay2);

    this.delay1.connect(this.gain1);
    this.delay2.connect(this.gain2);

    this.gain1.connect(this.output);
    this.gain2.connect(this.output);

    // Initialize modulations
    this.initModulation();
  }

  private initModulation() {
    const size = 44100; // 1 second buffer
    const buffer = this.ctx.createBuffer(4, size, this.ctx.sampleRate);
    
    const ramp1 = buffer.getChannelData(0); // Ramp 1
    const ramp2 = buffer.getChannelData(1); // Ramp 2
    const fade1 = buffer.getChannelData(2); // Fade 1
    const fade2 = buffer.getChannelData(3); // Fade 2

    for (let i = 0; i < size; i++) {
      const t = i / size;
      ramp1[i] = t;
      ramp2[i] = (t + 0.5) % 1.0;
      
      fade1[i] = Math.sin(Math.PI * t);
      fade2[i] = Math.sin(Math.PI * ((t + 0.5) % 1.0));
    }

    // Create a loop source
    this.bufferSource = this.ctx.createBufferSource();
    this.bufferSource.buffer = buffer;
    this.bufferSource.loop = true;

    this.splitter = this.ctx.createChannelSplitter(4);
    this.bufferSource.connect(this.splitter);

    // Channel 0 (Ramp 1) modulates delay1.delayTime
    this.splitter.connect(this.modGain1, 0);
    this.modGain1.connect(this.delay1.delayTime);

    // Channel 1 (Ramp 2) modulates delay2.delayTime
    this.splitter.connect(this.modGain2, 1);
    this.modGain2.connect(this.delay2.delayTime);

    // Channel 2 (Fade 1) controls gain1.gain
    this.splitter.connect(this.gain1.gain, 2);

    // Channel 3 (Fade 2) controls gain2.gain
    this.splitter.connect(this.gain2.gain, 3);

    // Start buffer playback
    this.bufferSource.start(0);

    // Set default pitch parameters
    this.setPitch(this.pitch);
  }

  public setPitch(pitchRatio: number) {
    this.pitch = pitchRatio;
    if (this.pitch === 1.0) {
      if (this.modGain1) this.modGain1.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.modGain2) this.modGain2.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.delay1) this.delay1.delayTime.setValueAtTime(0, this.ctx.currentTime);
      if (this.delay2) this.delay2.delayTime.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    const D = this.delayTime;
    const f = Math.abs(pitchRatio - 1.0) / D;

    // Set loop playbackRate
    if (this.bufferSource) {
      this.bufferSource.playbackRate.setValueAtTime(f, this.ctx.currentTime);
    }

    if (pitchRatio > 1.0) {
      this.modGain1.gain.setValueAtTime(-D, this.ctx.currentTime);
      this.modGain2.gain.setValueAtTime(-D, this.ctx.currentTime);
      this.delay1.delayTime.setValueAtTime(D, this.ctx.currentTime);
      this.delay2.delayTime.setValueAtTime(D, this.ctx.currentTime);
    } else {
      this.modGain1.gain.setValueAtTime(D, this.ctx.currentTime);
      this.modGain2.gain.setValueAtTime(D, this.ctx.currentTime);
      this.delay1.delayTime.setValueAtTime(0.002, this.ctx.currentTime); // minor offset to prevent negative
      this.delay2.delayTime.setValueAtTime(0.002, this.ctx.currentTime);
    }
  }

  public disconnect() {
    try {
      this.bufferSource?.stop();
    } catch (e) {}
    try {
      this.input.disconnect();
      this.output.disconnect();
      this.delay1.disconnect();
      this.delay2.disconnect();
      this.gain1.disconnect();
      this.gain2.disconnect();
      this.modGain1.disconnect();
      this.modGain2.disconnect();
      this.splitter?.disconnect();
    } catch (e) {}
  }
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | AudioWorkletNode | OscillatorNode | AudioNode | null = null;
  private synthInterval: any = null;

  // Nodes in chain
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private screechOsc: OscillatorNode | null = null;
  private screechGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private ringModCarrier: OscillatorNode | null = null;
  private ringModGain: GainNode | null = null;
  private ringModDryGain: GainNode | null = null;
  private ringModWetGain: GainNode | null = null;
  private outputMasterGain: GainNode | null = null;

  // Voice Changer Nodes
  private voiceChangerInputGain: GainNode | null = null;
  private pitchShifter: PitchShifterNode | null = null;
  private voiceFilter1: BiquadFilterNode | null = null;
  private voiceFilter2: BiquadFilterNode | null = null;
  private voiceTremoloGain: GainNode | null = null;
  private voiceTremoloLfo: OscillatorNode | null = null;
  private voiceTremoloLfoLogger: GainNode | null = null;
  private currentVoiceEffect: string = 'none';

  private voiceTunings: { [key: string]: VoiceTuningParams } = {
    none: {
      pitch: 1.0,
      filter1Type: 'peaking', filter1Freq: 1000, filter1Gain: 0, filter1Q: 1.0,
      filter2Type: 'highshelf', filter2Freq: 4000, filter2Gain: 0, filter2Q: 1.0,
      tremoloDepth: 0.0, tremoloFreq: 4.5
    },
    loli: {
      pitch: 1.68,
      filter1Type: 'highpass', filter1Freq: 220, filter1Gain: 0, filter1Q: 1.0,
      filter2Type: 'peaking', filter2Freq: 3000, filter2Gain: 5.0, filter2Q: 1.0,
      tremoloDepth: 0.0, tremoloFreq: 4.5
    },
    yujie: {
      pitch: 1.22,
      filter1Type: 'peaking', filter1Freq: 200, filter1Gain: 4.0, filter1Q: 1.2,
      filter2Type: 'highshelf', filter2Freq: 5000, filter2Gain: -3.0, filter2Q: 1.0,
      tremoloDepth: 0.0, tremoloFreq: 4.5
    },
    shaofu: {
      pitch: 1.38,
      filter1Type: 'peaking', filter1Freq: 320, filter1Gain: 2.5, filter1Q: 1.0,
      filter2Type: 'peaking', filter2Freq: 4000, filter2Gain: 1.5, filter2Q: 0.8,
      tremoloDepth: 0.0, tremoloFreq: 4.5
    },
    child: {
      pitch: 1.88,
      filter1Type: 'highpass', filter1Freq: 260, filter1Gain: 0, filter1Q: 1.5,
      filter2Type: 'peaking', filter2Freq: 1200, filter2Gain: 4.5, filter2Q: 1.5,
      tremoloDepth: 0.0, tremoloFreq: 4.5
    },
    elderly: {
      pitch: 0.76,
      filter1Type: 'highpass', filter1Freq: 110, filter1Gain: 0, filter1Q: 1.0,
      filter2Type: 'highshelf', filter2Freq: 3500, filter2Gain: -5.0, filter2Q: 1.0,
      tremoloDepth: 0.22, tremoloFreq: 4.5
    },
    ceo: {
      pitch: 0.86,
      filter1Type: 'peaking', filter1Freq: 115, filter1Gain: 6.0, filter1Q: 1.0,
      filter2Type: 'peaking', filter2Freq: 2600, filter2Gain: 4.0, filter2Q: 1.2,
      tremoloDepth: 0.0, tremoloFreq: 4.5
    }
  };

  // Monitor Node
  private monitorGainNode: GainNode | null = null;
  private isMonitorEnabled: boolean = true;

  // Synth oscillators
  private synthOscs: OscillatorNode[] = [];
  private synthGain: GainNode | null = null;

  // Configuration state
  private activeSourceType: string = 'synth-loop'; // 'microphone' | 'synth-loop' | 'heavy-metal' | 'sine-wave'
  private controls: AudioControls = {
    gain: 450,
    distortion: 85,
    bass: 12,
    screech: 60,
    feedback: 75,
    ringMod: 40
  };

  private isRunning: boolean = false;
  private dbUpdateInterval: any = null;
  private rmsIn: number = 0;
  private rmsOut: number = 0;

  constructor() {}

  public get running() {
    return this.isRunning;
  }

  public get sourceType() {
    return this.activeSourceType;
  }

  public async start(sourceType: string = 'synth-loop'): Promise<boolean> {
    if (this.isRunning) {
      if (sourceType !== this.activeSourceType) {
        await this.setSource(sourceType);
      }
      return true;
    }

    try {
      this.activeSourceType = sourceType;
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Create Analyser nodes
      this.inputAnalyser = this.ctx.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.outputAnalyser = this.ctx.createAnalyser();
      this.outputAnalyser.fftSize = 256;

      // Master Output Master Gain
      this.outputMasterGain = this.ctx.createGain();
      this.outputMasterGain.gain.setValueAtTime(0.5, this.ctx.currentTime); // keep overall level safe

      // Monitor Master Routing Node
      this.monitorGainNode = this.ctx.createGain();
      this.monitorGainNode.gain.setValueAtTime(this.isMonitorEnabled ? 1.0 : 0.0, this.ctx.currentTime);

      // Voice Changer processing nodes
      this.voiceChangerInputGain = this.ctx.createGain();
      this.pitchShifter = new PitchShifterNode(this.ctx);
      
      this.voiceFilter1 = this.ctx.createBiquadFilter();
      this.voiceFilter1.type = 'peaking';
      this.voiceFilter1.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.voiceFilter1.gain.setValueAtTime(0, this.ctx.currentTime);
      
      this.voiceFilter2 = this.ctx.createBiquadFilter();
      this.voiceFilter2.type = 'highshelf';
      this.voiceFilter2.frequency.setValueAtTime(4000, this.ctx.currentTime);
      this.voiceFilter2.gain.setValueAtTime(0, this.ctx.currentTime);
      
      this.voiceTremoloGain = this.ctx.createGain();
      this.voiceTremoloGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      
      this.voiceTremoloLfo = this.ctx.createOscillator();
      this.voiceTremoloLfo.type = 'sine';
      this.voiceTremoloLfo.frequency.setValueAtTime(4.5, this.ctx.currentTime); // 4.5Hz tremor
      
      this.voiceTremoloLfoLogger = this.ctx.createGain();
      this.voiceTremoloLfoLogger.gain.setValueAtTime(0, this.ctx.currentTime); // zero tremor by default
      
      this.voiceTremoloLfo.connect(this.voiceTremoloLfoLogger);
      this.voiceTremoloLfoLogger.connect(this.voiceTremoloGain.gain);
      this.voiceTremoloLfo.start();

      this.updateVoiceEffects();

      // Build chain nodes
      this.gainNode = this.ctx.createGain();
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.oversample = '4x';

      // Bass Filter (Lowshelf)
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.setValueAtTime(150, this.ctx.currentTime);

      // Screech Filter (High-pass/Peaking feedback)
      this.screechFilter = this.ctx.createBiquadFilter();
      this.screechFilter.type = 'peaking';
      this.screechFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
      this.screechFilter.Q.setValueAtTime(5, this.ctx.currentTime);

      // We can also generate a slight synthetic high screech sound that blends in when screech control is turned up
      this.screechOsc = this.ctx.createOscillator();
      this.screechOsc.type = 'sawtooth';
      this.screechOsc.frequency.setValueAtTime(3500, this.ctx.currentTime);
      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.screechOsc.connect(this.screechGain);

      // Delay + Feedback Loop
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.18, this.ctx.currentTime); // 180ms delay
      this.feedbackGain = this.ctx.createGain();
      this.feedbackGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Connect Delay loop
      this.delayNode.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayNode); // feedback loop to delay

      // Ring Modulator Nodes
      this.ringModCarrier = this.ctx.createOscillator();
      this.ringModCarrier.type = 'sine';
      this.ringModCarrier.frequency.setValueAtTime(350, this.ctx.currentTime);

      this.ringModGain = this.ctx.createGain(); // This acts as multiplication node in routing
      this.ringModDryGain = this.ctx.createGain();
      this.ringModWetGain = this.ctx.createGain();

      // Start the dynamic sources
      this.screechOsc.start();
      this.ringModCarrier.start();

      // Setup processing pipeline connection
      await this.setupSource();
      this.connectPipeline();
      this.updateNodes();

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.isRunning = true;
      this.startLevelMonitoring();
      return true;
    } catch (e) {
      console.error('Failed to start audio engine:', e);
      this.isRunning = false;
      return false;
    }
  }

  private connectPipeline() {
    if (!this.ctx || !this.inputAnalyser || !this.gainNode || !this.distortionNode ||
        !this.bassFilter || !this.screechFilter || !this.screechGain || !this.delayNode ||
        !this.feedbackGain || !this.ringModCarrier || !this.ringModGain ||
        !this.ringModDryGain || !this.ringModWetGain || !this.outputAnalyser || !this.outputMasterGain ||
        !this.monitorGainNode || !this.voiceChangerInputGain || !this.pitchShifter || 
        !this.voiceFilter1 || !this.voiceFilter2 || !this.voiceTremoloGain) {
      return;
    }

    try {
      // Clear any remaining nodes if rebuilding
      this.screechGain.disconnect();
      this.feedbackGain.disconnect();
      this.voiceChangerInputGain.disconnect();
      this.pitchShifter.output.disconnect();
      this.voiceFilter1.disconnect();
      this.voiceFilter2.disconnect();
      this.voiceTremoloGain.disconnect();

      // 1. Source -> Input Analyser -> Voice Changer Input Gain
      this.inputAnalyser.connect(this.voiceChangerInputGain);

      // 1b. Route voice effect dynamically
      if (this.currentVoiceEffect === 'none') {
        this.voiceChangerInputGain.connect(this.gainNode);
      } else {
        this.voiceChangerInputGain.connect(this.pitchShifter.input);
        this.pitchShifter.output.connect(this.voiceFilter1);
        this.voiceFilter1.connect(this.voiceFilter2);
        this.voiceFilter2.connect(this.voiceTremoloGain);
        this.voiceTremoloGain.connect(this.gainNode);
      }

      // 2. Gain -> Distortion (WaveShaper)
      this.gainNode.connect(this.distortionNode);

      // 3. Distortion -> Bass low shelf filter
      this.distortionNode.connect(this.bassFilter);

      // 4. Bass Filter -> Screech filtering
      this.bassFilter.connect(this.screechFilter);

      // Connect the synthetic screech sound parallel generator into Screech filter to simulate screech
      this.screechGain.connect(this.screechFilter);

      // 5. Screech Filter splits into dry delay path and delayed path
      this.screechFilter.connect(this.delayNode); // to feedback delay

      // Also connect delay output back to main stream
      this.delayNode.connect(this.ringModDryGain); // Delay feeds forward to Ring Mod dry
      this.screechFilter.connect(this.ringModDryGain); // Original feeds forward to Ring Mod dry

      // 6. Ring modulation: Carrier multiplied by the dry gain output
      // We route some signal to Ring Modulation multiplication node
      this.ringModDryGain.connect(this.ringModGain);
      this.ringModCarrier.connect(this.ringModGain.gain); // multiplying by carrier oscillator

      // Wet path
      this.ringModGain.connect(this.ringModWetGain);

      // Mix dry and wet signals into output analyser
      this.ringModDryGain.connect(this.outputAnalyser);
      this.ringModWetGain.connect(this.outputAnalyser);

      // Output Analyser -> Master Gain -> Monitor Gain -> Destination
      this.outputAnalyser.connect(this.outputMasterGain);
      this.outputMasterGain.connect(this.monitorGainNode);
      this.monitorGainNode.connect(this.ctx.destination);
    } catch (err) {
      console.warn('Pipeline routing warning:', err);
    }
  }

  private async setupSource() {
    if (!this.ctx || !this.inputAnalyser) return;

    // Disconnect old source
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }

    this.stopSynthTicks();
    this.closeMicStream();

    if (this.activeSourceType === 'microphone') {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
        this.sourceNode = this.ctx.createMediaStreamSource(this.micStream);
        this.sourceNode.connect(this.inputAnalyser);
      } catch (e) {
        console.error('Microphone access denied or error, falling back to synthesizer loop:', e);
        this.activeSourceType = 'synth-loop';
        this.setupSynthLoopSource();
      }
    } else if (this.activeSourceType === 'synth-loop') {
      this.setupSynthLoopSource();
    } else if (this.activeSourceType === 'heavy-metal') {
      this.setupHeavyMetalSynth();
    } else {
      // Sine wave continuous
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      
      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(this.inputAnalyser);
      
      osc.start();
      this.sourceNode = osc;
    }
  }

  private setupSynthLoopSource() {
    if (!this.ctx || !this.inputAnalyser) return;

    // Create a client-side sound generator (synthesizer rhythmic notes)
    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.synthGain.connect(this.inputAnalyser);
    this.sourceNode = this.synthGain;

    let beat = 0;
    const playTick = () => {
      if (!this.ctx || !this.synthGain) return;
      
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      // Drum/Beat patterns
      if (beat % 4 === 0) {
        // Kick drum style boom
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      } else if (beat % 4 === 2) {
        // Snare style high band
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        // Noise burst
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(300, now);
        const gainNoise = this.ctx.createGain();
        gainNoise.gain.setValueAtTime(0.12, now);
        gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc2.connect(gainNoise);
        gainNoise.connect(this.synthGain);
        osc2.start(now);
        osc2.stop(now + 0.15);
      } else {
        // High hat metallic tick
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(12000, now);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      }

      // Synth melody line
      const melodies = [110, 130, 98, 146, 110, 165, 87, 130];
      const melodyFreq = melodies[beat % melodies.length];
      if (beat % 2 === 0) {
        const lead = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        lead.type = 'sawtooth';
        lead.frequency.setValueAtTime(melodyFreq, now);
        lead.frequency.linearRampToValueAtTime(melodyFreq * 2, now + 0.2);
        
        leadGain.gain.setValueAtTime(0.08, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        lead.connect(leadGain);
        leadGain.connect(this.synthGain);
        lead.start(now);
        lead.stop(now + 0.3);
      }

      osc.connect(gainNode);
      gainNode.connect(this.synthGain);

      osc.start(now);
      osc.stop(now + 0.3);

      beat++;
    };

    // Trigger tick every 200ms (300 BPM!)
    this.synthInterval = setInterval(playTick, 280);
    playTick(); // trigger initial
  }

  private setupHeavyMetalSynth() {
    if (!this.ctx || !this.inputAnalyser) return;

    // Heavy Metal feedback loop simulator
    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.synthGain.connect(this.inputAnalyser);
    this.sourceNode = this.synthGain;

    let tick = 0;
    const playRockTick = () => {
      if (!this.ctx || !this.synthGain) return;
      
      const now = this.ctx.currentTime;
      // Power chords structure: Base freq + Perfect fifth
      const chords = [
        [82.41, 123.47], // E
        [98.00, 146.83], // G
        [110.00, 164.81], // A
        [116.54, 174.61], // A#
        [110.00, 164.81], // A
        [82.41, 123.47], // E
        [73.42, 110.00], // D
        [82.41, 123.47]  // E
      ];

      const currentChord = chords[Math.floor(tick / 2) % chords.length];
      
      // Left note
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(currentChord[0], now);

      // Right note
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(currentChord[1], now);

      // Slight frequency modulation to simulate guitar flutter
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(6, now); // 6 Hz vibrato
      lfoGain.gain.setValueAtTime(2, now); // depth 2Hz
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.18, now);
      if (tick % 2 === 0) {
        g.gain.exponentialRampToValueAtTime(0.04, now + 0.35); // stroke punch
      } else {
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.38); // release
      }

      osc1.connect(g);
      osc2.connect(g);
      g.connect(this.synthGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      lfo.stop(now + 0.4);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);

      tick++;
    };

    this.synthInterval = setInterval(playRockTick, 350);
    playRockTick();
  }

  private stopSynthTicks() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.synthOscs.forEach(o => {
      try { o.stop(); } catch(e) {}
    });
    this.synthOscs = [];
    this.synthGain = null;
  }

  private closeMicStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      this.micStream = null;
    }
  }

  public async setSource(sourceType: string): Promise<boolean> {
    this.activeSourceType = sourceType;
    if (this.isRunning && this.ctx) {
      await this.setupSource();
      this.connectPipeline();
      this.updateNodes();
      return true;
    }
    return false;
  }

  public async toggleActive(forceState?: boolean): Promise<boolean> {
    const targetState = forceState !== undefined ? forceState : !this.isRunning;
    if (targetState) {
      return await this.start(this.activeSourceType);
    } else {
      await this.stop();
      return false;
    }
  }

  public async stop() {
    this.isRunning = false;
    this.stopLevelMonitoring();
    this.stopSynthTicks();
    this.closeMicStream();

    if (this.pitchShifter) {
      this.pitchShifter.disconnect();
      this.pitchShifter = null;
    }

    if (this.voiceTremoloLfo) {
      try { this.voiceTremoloLfo.stop(); } catch(e) {}
      this.voiceTremoloLfo = null;
    }

    // Close or suspend Context
    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }

    // Nullify Node structures
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.gainNode = null;
    this.distortionNode = null;
    this.bassFilter = null;
    this.screechFilter = null;
    this.screechOsc = null;
    this.screechGain = null;
    this.delayNode = null;
    this.feedbackGain = null;
    this.ringModCarrier = null;
    this.ringModGain = null;
    this.ringModDryGain = null;
    this.ringModWetGain = null;
    this.outputMasterGain = null;
    this.sourceNode = null;

    this.voiceChangerInputGain = null;
    this.voiceFilter1 = null;
    this.voiceFilter2 = null;
    this.voiceTremoloGain = null;
    this.voiceTremoloLfoLogger = null;
    this.monitorGainNode = null;
  }

  public setControls(newControls: AudioControls) {
    this.controls = { ...newControls };
    this.updateNodes();
  }

  public setMonitorEnabled(enabled: boolean) {
    this.isMonitorEnabled = enabled;
    if (this.monitorGainNode && this.ctx) {
      this.monitorGainNode.gain.setTargetAtTime(enabled ? 1.0 : 0.0, this.ctx.currentTime, 0.05);
    }
  }

  public getMonitorEnabled(): boolean {
    return this.isMonitorEnabled;
  }

  public setVoiceEffect(effect: string) {
    this.currentVoiceEffect = effect;
    if (this.isRunning && this.ctx) {
      this.updateVoiceEffects();
      this.connectPipeline();
    }
  }

  public getVoiceEffect(): string {
    return this.currentVoiceEffect;
  }

  public getVoiceTunings() {
    return this.voiceTunings;
  }

  public updateVoiceTuning(effect: string, tuning: Partial<VoiceTuningParams>) {
    if (this.voiceTunings[effect]) {
      this.voiceTunings[effect] = { ...this.voiceTunings[effect], ...tuning };
      if (this.currentVoiceEffect === effect && this.isRunning && this.ctx) {
        this.updateVoiceEffects();
      }
    }
  }

  private updateVoiceEffects() {
    if (!this.ctx || !this.pitchShifter || !this.voiceFilter1 || !this.voiceFilter2 || !this.voiceTremoloLfoLogger) return;

    const t = this.ctx.currentTime;
    const effect = this.currentVoiceEffect;
    const tuning = this.voiceTunings[effect] || this.voiceTunings.none;

    // Apply voice-changing pitch
    this.pitchShifter.setPitch(tuning.pitch);

    // Apply Filter 1 configuration
    this.voiceFilter1.type = tuning.filter1Type;
    this.voiceFilter1.frequency.setTargetAtTime(tuning.filter1Freq, t, 0.05);
    this.voiceFilter1.gain.setTargetAtTime(tuning.filter1Gain, t, 0.05);
    if (tuning.filter1Q !== undefined) {
      this.voiceFilter1.Q.setTargetAtTime(tuning.filter1Q, t, 0.05);
    }

    // Apply Filter 2 configuration
    this.voiceFilter2.type = tuning.filter2Type;
    this.voiceFilter2.frequency.setTargetAtTime(tuning.filter2Freq, t, 0.05);
    this.voiceFilter2.gain.setTargetAtTime(tuning.filter2Gain, t, 0.05);
    if (tuning.filter2Q !== undefined) {
      this.voiceFilter2.Q.setTargetAtTime(tuning.filter2Q, t, 0.05);
    }

    // Apply Tremolo depth amplitude modulation
    this.voiceTremoloLfoLogger.gain.setTargetAtTime(tuning.tremoloDepth, t, 0.05);

    // Apply Tremolo oscillation rate
    if (this.voiceTremoloLfo) {
      this.voiceTremoloLfo.frequency.setTargetAtTime(tuning.tremoloFreq, t, 0.05);
    }
  }

  private updateNodes() {
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Peak master Gain mapping (0% to 1000% gain)
    // GAIN in DB controls
    if (this.gainNode) {
      // 450% corresponds to 4.5 multiplier
      const multiplier = this.controls.gain / 100;
      this.gainNode.gain.setTargetAtTime(multiplier, t, 0.05);
    }

    // 2. Distortion WaveShaper mapping
    if (this.distortionNode) {
      const distPercent = this.controls.distortion; // 0 - 100
      if (distPercent === 0) {
        this.distortionNode.curve = null;
      } else {
        // Curve map multiplier
        const k = distPercent * 2.5; // Scale to up to 250
        this.distortionNode.curve = this.makeDistortionCurve(k);
      }
    }

    // 3. Bass Filter mapping (-12 to +24 dB)
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(this.controls.bass, t, 0.05);
    }

    // 4. Screech Filter mapping: high frequency resonance simulation
    // We increase Q (resonance peak bandwidth) and frequency gain
    if (this.screechFilter) {
      const scr = this.controls.screech; // 0 - 100
      this.screechFilter.frequency.setTargetAtTime(2500 + scr * 15, t, 0.05); // up to 4000 Hz
      this.screechFilter.gain.setTargetAtTime(scr * 0.35, t, 0.05); // up to +35 dB peak!
      this.screechFilter.Q.setTargetAtTime(1 + scr * 0.2, t, 0.05); // fine-tuned resonance sharp curve
    }

    // Parallel screech noise audio generator when Screech is real high
    if (this.screechGain && this.screechOsc) {
      const scr = this.controls.screech; // 0 - 100
      if (scr > 50) {
        // High frequency continuous loop oscillating screaming
        const noiseScreechStrength = (scr - 50) / 500; // peak max 10% volume to protect ears but sound cool!
        this.screechGain.gain.setTargetAtTime(noiseScreechStrength, t, 0.1);
        this.screechOsc.frequency.setTargetAtTime(3000 + Math.sin(t * 10) * 1500, t, 0.1);
      } else {
        this.screechGain.gain.setTargetAtTime(0.0, t, 0.1);
      }
    }

    // 5. Feedback Delay mapping (0 to 100%)
    if (this.feedbackGain && this.delayNode) {
      const fdbk = this.controls.feedback; // 0 - 100
      const fbMultiplier = (fdbk / 100) * 0.85; // cap feedback at 85% to avoid blowouts
      this.feedbackGain.gain.setTargetAtTime(fbMultiplier, t, 0.05);

      // Adjust delayTime based on feedback density
      const calculatedDelay = 0.08 + (fdbk / 100) * 0.35; // 80ms to 430ms delay
      this.delayNode.delayTime.setTargetAtTime(calculatedDelay, t, 0.1);
    }

    // 6. Ring Modulation mapping
    if (this.ringModCarrier && this.ringModWetGain && this.ringModDryGain) {
      const rm = this.controls.ringMod; // 0-100
      // frequency carrier pitch represents RingMod Value
      const modFreq = 100 + rm * 12; // 100Hz to 1300Hz modulation
      this.ringModCarrier.frequency.setTargetAtTime(modFreq, t, 0.05);

      // Dry / Wet mix scaling
      const wetRatio = rm / 100;
      this.ringModWetGain.gain.setTargetAtTime(wetRatio, t, 0.05);
      this.ringModDryGain.gain.setTargetAtTime(1.0 - (wetRatio * 0.3), t, 0.05); // keep slightly active
    }
  }

  private makeDistortionCurve(amount: number) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Symmetric distortion wave shaping curve formula
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private startLevelMonitoring() {
    this.stopLevelMonitoring();

    const inBuffer = new Uint8Array(128);
    const outBuffer = new Uint8Array(128);

    const updateDB = () => {
      if (!this.isRunning || !this.inputAnalyser || !this.outputAnalyser) return;

      this.inputAnalyser.getByteTimeDomainData(inBuffer);
      this.outputAnalyser.getByteTimeDomainData(outBuffer);

      // Compute RMS (Root Mean Square) for volume levels
      let sumIn = 0;
      let sumOut = 0;
      for (let i = 0; i < 128; i++) {
        const valIn = (inBuffer[i] - 128) / 128;
        const valOut = (outBuffer[i] - 128) / 128;
        sumIn += valIn * valIn;
        sumOut += valOut * valOut;
      }

      const rmsInVal = Math.sqrt(sumIn / 128);
      const rmsOutVal = Math.sqrt(sumOut / 128);

      // Smooth levels
      this.rmsIn = this.rmsIn * 0.7 + rmsInVal * 0.3;
      this.rmsOut = this.rmsOut * 0.7 + rmsOutVal * 0.3;
    };

    this.dbUpdateInterval = setInterval(updateDB, 100);
  }

  private stopLevelMonitoring() {
    if (this.dbUpdateInterval) {
      clearInterval(this.dbUpdateInterval);
      this.dbUpdateInterval = null;
    }
  }

  // Retrieve current RMS dB levels
  public getDbLevels(): { inDb: number; outDb: number } {
    if (!this.isRunning) {
      return { inDb: -60, outDb: -60 };
    }

    // Convert RMS to Decibels: dB = 20 * log10(Ratio)
    // Ref level is 1
    let dbIn = 20 * Math.log10(this.rmsIn + 0.000001);
    let dbOut = 20 * Math.log10(this.rmsOut + 0.000001);

    // Filter DB range between -60dB and +6dB
    dbIn = Math.max(-60, Math.min(6, dbIn + 18)); // offset to match screen looks
    dbOut = Math.max(-60, Math.min(6, dbOut + 22));

    // If completely silent, return nominal background noise limits
    if (dbIn < -55) dbIn = -50 - Math.random() * 5;
    if (dbOut < -55) dbOut = -50 - Math.random() * 5;

    return {
      inDb: parseFloat(dbIn.toFixed(1)),
      outDb: parseFloat(dbOut.toFixed(1))
    };
  }

  // Get analyser arrays for canvas renderer
  public getAnalyser(): { input: AnalyserNode | null; output: AnalyserNode | null } {
    return {
      input: this.inputAnalyser,
      output: this.outputAnalyser
    };
  }

  // Custom text readout routed inside the filters
  public speakPhrase(text: string, voicePreset: string = 'default') {
    if (!this.isRunning || !this.ctx) {
      alert('请先将控制台切换为 [ACTIVE] 处于运行状态，再进行语音播报！');
      return;
    }

    // Since we don't always have simple redirect media node from speech, 
    // we can use standard window.speechSynthesis to play a clean utterance,
    // and simultaneously inject electronic impulse triggers in WebAudio to simulate vocal feedback!
    // Or we can speak normally and user can hear, while we modulate the synthesizer sound!
    
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;

      synth.cancel(); // stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;

      // Adjust parameters based on presets
      if (voicePreset === 'robot') {
        utterance.pitch = 0.4;
        utterance.rate = 0.85;
      } else if (voicePreset === 'screech') {
        utterance.pitch = 1.8;
        utterance.rate = 1.2;
      } else if (voicePreset === 'nuke') {
        utterance.pitch = 0.1;
        utterance.rate = 0.6;
      }

      // Simultaneously trigger rich audio effects in soundboard loop
      let timer: any = null;
      let startNow = this.ctx.currentTime;

      // Let's fire brief synthetic electric crackles while they read
      let count = 0;
      timer = setInterval(() => {
        if (!this.isRunning || !this.ctx || !synth.speaking) {
          clearInterval(timer);
          return;
        }

        // Crackle impulse oscillator injected
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(100 + Math.random() * 800, this.ctx.currentTime);
        g.gain.setValueAtTime(0.04, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(g);
        if (this.inputAnalyser) {
          g.connect(this.inputAnalyser);
        }
        osc.start();
        osc.stop(this.ctx.currentTime + 0.11);
        count++;
      }, 150);

      synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  // Preset loading helpers
  public getBeautifierPresets(): SoundBeautifierPreset[] {
    return [
      {
        id: 'radio',
        name: '复古电台主播',
        englishLabel: 'RADIO STAR',
        description: '温暖厚重的中低频，重塑模拟电极管广播的醇厚磁性男声/女声。',
        gain: 480,
        distortion: 15,
        bass: 18,
        screech: 10,
        feedback: 20,
        ringMod: 0,
        tag: '磁性',
        icon: 'Radio'
      },
      {
        id: 'esports',
        name: '电竞现场重音',
        englishLabel: 'E-SPORTS VIPER',
        description: '高爆发、高瞬态响应，适合激烈吃鸡开黑和嘈杂网络通话的重型增强。',
        gain: 650,
        distortion: 40,
        bass: 14,
        screech: 30,
        feedback: 0,
        ringMod: 10,
        tag: '电竞',
        icon: 'Sword'
      },
      {
        id: 'warm-vocal',
        name: '温暖纯净播客',
        englishLabel: 'WARM PODCAST',
        description: '高清晰度纯人声增益。去除齿音啸叫，保留温润扎实的中音色彩。',
        gain: 350,
        distortion: 5,
        bass: 8,
        screech: 0,
        feedback: 15,
        ringMod: 0,
        tag: '磁性',
        icon: 'Mic'
      },
      {
        id: 'cyber-soldier',
        name: '赛博机械士兵',
        englishLabel: 'CYBER SOLDIER',
        description: '融合 450Hz 的环形金属载波与延迟共振，塑造战地机械铠甲音。',
        gain: 550,
        distortion: 65,
        bass: 6,
        screech: 40,
        feedback: 55,
        ringMod: 65,
        tag: '搞怪',
        icon: 'Cpu'
      },
      {
        id: 'metal-screamer',
        name: '重金属嘶吼狂热',
        englishLabel: 'HEAVY METAL SCREAM',
        description: '极限啸叫共振，重载失真狂潮，给电吉他和极喉嘶吼而生的核平方案。',
        gain: 900,
        distortion: 95,
        bass: 24,
        screech: 70,
        feedback: 60,
        ringMod: 25,
        tag: '重金属',
        icon: 'Flame'
      },
      {
        id: 'telephone',
        name: '战壕复古电话',
        englishLabel: 'WAR TRENCH PHONE',
        description: '极窄带音频传输，削减极高极低音频。经典 1940 年代野战电话音色。',
        gain: 420,
        distortion: 45,
        bass: -12,
        screech: 85,
        feedback: 10,
        ringMod: 50,
        tag: '复古',
        icon: 'PhoneCall'
      }
    ];
  }
}
