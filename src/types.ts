export type Tab = 'control' | 'beautify' | 'driver';

export interface AudioControls {
  gain: number;        // 0% - 1000% (represented as 0 to 1000)
  distortion: number;  // 0% - 100% (0 to 100)
  bass: number;        // -12dB to +24dB (-12 to 24)
  screech: number;     // 0% - 100% (0 to 100) - high-pass squeal
  feedback: number;    // 0% - 100% (0 to 100) - delay feedback amount
  ringMod: number;     // 0% - 100% (0 to 100) - ring modulator frequency/mix
}

export interface SystemStatus {
  isActive: boolean;
  inputDevice: string;
  outputDevice: string;
  isNuked: boolean;
  cpuUsage: number;
  memoryUsage: number;
  latencyMs: number;
  inDb: number;
  outDb: number;
}

export interface SoundBeautifierPreset {
  id: string;
  name: string;
  englishLabel: string;
  description: string;
  gain: number;
  distortion: number;
  bass: number;
  screech: number;
  feedback: number;
  ringMod: number;
  tag: string; // e.g. "电竞", "磁性", "搞怪", "复古"
  icon: string; // lucide icon name
}

export interface VoiceTuningParams {
  pitch: number;             // 0.5 to 2.0
  filter1Type: BiquadFilterType;
  filter1Freq: number;       // 50 to 5000
  filter1Gain: number;       // -15 to +15
  filter1Q?: number;
  filter2Type: BiquadFilterType;
  filter2Freq: number;       // 500 to 10000
  filter2Gain: number;       // -15 to +15
  filter2Q?: number;
  tremoloDepth: number;      // 0.0 to 1.0
  tremoloFreq: number;       // 1.0 to 15.0
}

