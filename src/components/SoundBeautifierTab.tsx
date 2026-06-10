import React, { useState, useEffect } from 'react';
import { AudioEngine } from '../lib/audioEngine';
import { VoiceTuningParams } from '../types';
import { 
  Radio, 
  Sparkles, 
  Sliders, 
  RotateCcw, 
  Activity, 
  HelpCircle,
  TrendingUp,
  Volume2
} from 'lucide-react';

interface SoundBeautifierTabProps {
  engine: AudioEngine;
  isActive: boolean;
  onApplyPreset: (controls: any) => void;
  currentControls: any;
  isMonitorEnabled: boolean;
  onToggleMonitor: () => void;
  currentVoiceEffect: string;
  onVoiceEffectChange: (effect: string) => void;
}

// Baseline values for restoration
const DEFAULT_PRESETS: { [key: string]: VoiceTuningParams } = {
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

export const SoundBeautifierTab: React.FC<SoundBeautifierTabProps> = ({
  engine,
  isActive,
  isMonitorEnabled,
  onToggleMonitor,
  currentVoiceEffect,
  onVoiceEffectChange
}) => {
  // Read dynamic active presets from engine to make sure slider values match current states
  const [activeTuning, setActiveTuning] = useState<VoiceTuningParams>(() => {
    const tunings = engine.getVoiceTunings();
    return tunings[currentVoiceEffect] || DEFAULT_PRESETS.none;
  });

  // Keep state local updated when current voice type changes
  useEffect(() => {
    const tunings = engine.getVoiceTunings();
    setActiveTuning(tunings[currentVoiceEffect] || DEFAULT_PRESETS.none);
  }, [currentVoiceEffect]);

  const handleSliderChange = (paramKey: keyof VoiceTuningParams, value: number) => {
    const nextTuning = { ...activeTuning, [paramKey]: value };
    setActiveTuning(nextTuning as VoiceTuningParams);
    engine.updateVoiceTuning(currentVoiceEffect, { [paramKey]: value });
  };

  const handleResetToDefault = () => {
    const baseline = DEFAULT_PRESETS[currentVoiceEffect] || DEFAULT_PRESETS.none;
    setActiveTuning(baseline);
    engine.updateVoiceTuning(currentVoiceEffect, baseline);
  };

  const activeProfileLabel = () => {
    const labels: { [key: string]: string } = {
      none: '原声绿通 (Bypass)',
      loli: '元气萝莉 (Cute Loli)',
      yujie: '高冷御姐 (Royal Sister)',
      shaofu: '温婉少妇 (Lady Tone)',
      child: '呆萌幼齿 (Playful Kid)',
      elderly: '沧桑老人 (Old Shaky)',
      ceo: '磁性总裁 (Lord CEO)'
    };
    return labels[currentVoiceEffect] || currentVoiceEffect;
  };

  const isF1Highpass = activeTuning.filter1Type === 'highpass';

  return (
    <div className="space-y-6" id="sound-beautifier-tab-container">
      {/* Real-time Ears Return Monitoring toggle panel */}
      <div className="bg-white border border-pink-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <h4 className="text-slate-800 font-bold text-sm flex items-center gap-2">
            <span className="p-1 rounded-md bg-pink-50 text-[#ec4899]"><Radio className="w-4 h-4" /></span>
            监听耳机返听 (Direct Monitoring Earback)
          </h4>
          <p className="text-slate-500 text-xs leading-normal">
            实时将处理后的变声及美化后的人声音频回传至您的物理耳机，消除本地声卡传输阻力，畅爽纠音。
          </p>
        </div>
        <button
          id="btn-beautify-tab-monitor"
          onClick={onToggleMonitor}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider border cursor-pointer select-none transition-all duration-300 flex items-center gap-2 ${
            isMonitorEnabled
              ? 'bg-gradient-to-r from-pink-500 to-rose-450 text-white border-transparent shadow-md shadow-pink-100 animate-pulse'
              : 'bg-[#fafafc] text-slate-550 border-pink-100 hover:border-pink-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isMonitorEnabled ? 'bg-white' : 'bg-slate-400'}`} />
          耳返监听: {isMonitorEnabled ? '开启 (ON)' : '关闭 (OFF)'}
        </button>
      </div>

      {/* Grid of the 6 Voice profiles + Bypass */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200/50 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-25 pointer-events-none">
          <Sparkles className="w-24 h-24 text-pink-300 animate-pulse" />
        </div>
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#fbcfe8] text-[#db2777] font-semibold text-[10px] px-2.5 py-0.5 rounded-full font-mono border border-pink-200 shadow-xs">MORPH PROFILES</span>
            <h3 className="text-slate-800 font-bold font-display text-lg">6大主打变声器声相矩阵</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed font-sans">
            内置声带重组、下咽部阻值共振和声相抖动，可深度自如地变换您的音域属性。选中后可在下方通过 sliders 进行精密控制！
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 animate-fade-in" id="voice-changer-grid">
        {[
          { id: 'none', label: '原声绿通', sub: 'Bypass', desc: '原色旁路', color: 'from-slate-50 to-slate-100/50', activeColor: 'bg-slate-150 text-slate-800 border-slate-350 shadow-xs ring-2 ring-slate-200' },
          { id: 'loli', label: '元气萝莉', sub: 'Cute Loli', desc: '动漫软萌音', color: 'from-pink-50 to-rose-100/30', activeColor: 'bg-rose-100 text-[#db2777] border-pink-300 shadow-sm ring-2 ring-pink-200' },
          { id: 'yujie', label: '高冷御姐', sub: 'Royal Sister', desc: '知性成熟嗓', color: 'from-purple-50 to-pink-50/30', activeColor: 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm ring-2 ring-purple-200' },
          { id: 'shaofu', label: '温婉少妇', sub: 'Lady Tone', desc: '风韵熟女调', color: 'from-fuchsia-50 to-rose-50/20', activeColor: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 shadow-sm ring-2 ring-fuchsia-200' },
          { id: 'child', label: '呆萌幼齿', sub: 'Playful Kid', desc: '萌化幼童腔', color: 'from-amber-50 to-orange-50/30', activeColor: 'bg-amber-100 text-amber-800 border-orange-300 shadow-sm ring-2 ring-amber-200' },
          { id: 'elderly', label: '沧桑老人', sub: 'Old Shaky', desc: '沙哑沧桑音', color: 'from-stone-50 to-slate-100/40', activeColor: 'bg-stone-150 text-stone-800 border-stone-350 shadow-sm ring-2 ring-stone-200' },
          { id: 'ceo', label: '磁性总裁', sub: 'Lord CEO', desc: '低沉磁性发声', color: 'from-sky-50 to-blue-50/30', activeColor: 'bg-sky-100 text-sky-850 border-sky-300 shadow-sm ring-2 ring-sky-200' }
        ].map((p) => {
          const isSelected = currentVoiceEffect === p.id;
          return (
            <button
              key={p.id}
              id={`btn-beautified-voice-${p.id}`}
              onClick={() => onVoiceEffectChange(p.id)}
              className={`border rounded-xl p-3 text-left transition duration-300 flex flex-col justify-between cursor-pointer group h-[115px] ${
                isSelected 
                  ? p.activeColor
                  : `bg-gradient-to-b ${p.color} border-pink-100/50 hover:border-pink-300 hover:shadow-xs`
              }`}
            >
              <div>
                <div className="font-bold text-xs truncate leading-tight flex items-center justify-between">
                  <span>{p.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 ml-1" />}
                </div>
                <div className="text-[9px] font-mono opacity-60 uppercase tracking-widest mt-0.5 truncate">{p.sub}</div>
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-2 opacity-85 leading-normal group-hover:opacity-100">{p.desc}</div>
            </button>
          );
        })}
      </div>

      {/* NEW FEATURE: Sleek Live Voice Equalizer Adjustments Control Panel */}
      <div className="bg-white border border-pink-100 rounded-xl p-6 shadow-sm space-y-6" id="voice-precision-sliders-panel">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-50 text-[#ec4899] rounded-lg">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-sm flex items-center gap-1.5">
                实时声像调节面板
                <span className="text-xs font-mono font-black text-[#db2777] bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-100">
                  {activeProfileLabel()}
                </span>
              </h3>
              <p className="text-slate-500 text-[11px] font-sans mt-0.5">
                调整精细的声卡频响参数、喉咙管阻尼共鸣，对当前声相进行二次个性化优化
              </p>
            </div>
          </div>
          
          <button
            type="button"
            id="btn-tuning-reset-to-default"
            onClick={handleResetToDefault}
            className="self-start sm:self-center bg-slate-50 hover:bg-slate-150 hover:text-[#ec4899] border border-slate-200 hover:border-pink-200 text-slate-650 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs select-none cursor-pointer"
            title="将当前变声相型的各项参数还原为出厂最佳物理状态"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置预设默认
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Slider 1: Vocal Pitch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-pink-500" />
                声道音高微调 (Vocal Pitch Shift)
              </span>
              <span className="text-xs font-semibold font-mono text-[#db2777]">
                {activeTuning.pitch.toFixed(2)}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">0.5x (男低腔)</span>
              <input
                type="range"
                min="0.5"
                max="2.2"
                step="0.02"
                value={activeTuning.pitch}
                onChange={(e) => handleSliderChange('pitch', parseFloat(e.target.value))}
                className="flex-1 accent-[#ec4899] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                id="slider-tuning-pitch"
              />
              <span className="text-[10px] text-slate-400 font-mono">2.2x (卡通尖)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              改变声音的基本赫兹基音分量。增加数值会导致声线变紧变尖，降低则形成浑厚腔体音效。
            </p>
          </div>

          {/* Slider 2: Filter 1 Frequency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-500" />
                共振峰滤波器频点 (Filter 1 Freq)
              </span>
              <span className="text-xs font-semibold font-mono text-indigo-600">
                {activeTuning.filter1Freq} Hz
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">50 Hz</span>
              <input
                type="range"
                min="50"
                max="4000"
                step="10"
                value={activeTuning.filter1Freq}
                onChange={(e) => handleSliderChange('filter1Freq', parseInt(e.target.value))}
                className="flex-1 accent-indigo-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                id="slider-tuning-f1-freq"
              />
              <span className="text-[10px] text-slate-400 font-mono">4000 Hz</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              第一级共鸣滤波频段。{isF1Highpass ? '当前为【高通截止】：过滤此频率以下的胸腔杂音组件。' : '当前为【峰点加减】：修改特定气流振荡在喉部产生共震的声阈。'}
            </p>
          </div>

          {/* Slider 3: Filter 1 Gain */}
          <div className="space-y-2 opacity-95">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
                共鸣一处增益 (Filter 1 Band Gain)
              </span>
              <span className={`text-xs font-semibold font-mono ${isF1Highpass ? 'text-slate-400' : 'text-cyan-600'}`}>
                {isF1Highpass ? '无/高通直放' : `${activeTuning.filter1Gain > 0 ? '+' : ''}${activeTuning.filter1Gain} dB`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">-15 dB</span>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                disabled={isF1Highpass}
                value={activeTuning.filter1Gain}
                onChange={(e) => handleSliderChange('filter1Gain', parseFloat(e.target.value))}
                className={`flex-1 h-1.5 rounded-lg appearance-none cursor-pointer ${isF1Highpass ? 'accent-slate-200 bg-slate-100/50 cursor-not-allowed' : 'accent-cyan-500 bg-slate-100'}`}
                id="slider-tuning-f1-gain"
              />
              <span className="text-[10px] text-slate-400 font-mono">+15 dB</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {isF1Highpass ? '（当前为高通滤波状态，低音直接切除，不支持增益参数调整）' : '调大此值会增加特定胸腔共鸣频率，令声音更带有低音暖调，调小则会消除鼻音。'}
            </p>
          </div>

          {/* Slider 4: Filter 2 Frequency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                第二级亮度频点 (Filter 2 Freq)
              </span>
              <span className="text-xs font-semibold font-mono text-purple-600">
                {activeTuning.filter2Freq} Hz
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">500 Hz</span>
              <input
                type="range"
                min="500"
                max="10000"
                step="50"
                value={activeTuning.filter2Freq}
                onChange={(e) => handleSliderChange('filter2Freq', parseInt(e.target.value))}
                className="flex-1 accent-purple-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                id="slider-tuning-f2-freq"
              />
              <span className="text-[10px] text-slate-400 font-mono">10000 Hz</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              第二级修饰频段。多用于高音频区以及口齿声音细节。修改此处可优化口水音、咽音亮度。
            </p>
          </div>

          {/* Slider 5: Filter 2 Gain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-violet-500" />
                第二级频段增益 (Filter 2 Band Gain)
              </span>
              <span className="text-xs font-semibold font-mono text-violet-600">
                {activeTuning.filter2Gain > 0 ? '+' : ''}{activeTuning.filter2Gain} dB
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">-15 dB</span>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.5"
                value={activeTuning.filter2Gain}
                onChange={(e) => handleSliderChange('filter2Gain', parseFloat(e.target.value))}
                className="flex-1 accent-purple-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                id="slider-tuning-f2-gain"
              />
              <span className="text-[10px] text-slate-400 font-mono">+15 dB</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              增高可以极大开阔口部发音细节的“空气感流体”，使其亮丽富有磁性；调低则可平抑由于高音拉高带来的高频啸叫。
            </p>
          </div>

          {/* Slider 6: Tremolo Depth */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                嗓音震颤深度 (Vocal Tremolo / Vibrato Depth)
              </span>
              <span className="text-xs font-semibold font-mono text-amber-600">
                {(activeTuning.tremoloDepth * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">0% (无颤抖)</span>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.02"
                value={activeTuning.tremoloDepth}
                onChange={(e) => handleSliderChange('tremoloDepth', parseFloat(e.target.value))}
                className="flex-1 accent-amber-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                id="slider-tuning-tremolo-depth"
              />
              <span className="text-[10px] text-slate-400 font-mono">100% (波浪声)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              抖音/颤音震幅百分比。主要用于模拟老人音那种声带松弛、沧桑颤抖的状态，或制造幽灵、诡异的电音和声。
            </p>
          </div>

          {/* Slider 7: Tremolo Frequency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
                嗓音震颤频率 (Tremolo / Vibrato Speed)
              </span>
              <span className="text-xs font-semibold font-mono text-orange-600">
                {activeTuning.tremoloFreq.toFixed(1)} Hz (周/秒)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-mono">1.0 Hz (慢)</span>
              <input
                type="range"
                min="1.0"
                max="15.0"
                step="0.1"
                value={activeTuning.tremoloFreq}
                onChange={(e) => handleSliderChange('tremoloFreq', parseFloat(e.target.value))}
                className="flex-1 accent-orange-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                id="slider-tuning-tremolo-freq"
              />
              <span className="text-[10px] text-slate-400 font-mono">15.0 Hz (快)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              嗓音每秒发生抖音循环的次数。默认 4.5Hz 模拟柔顺的物理沧桑感，高于 10Hz 则产生重度重金属电音合成色值。
            </p>
          </div>

        </div>

        {/* Console activation disclaimer tip */}
        {!isActive && (
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-3 text-[11px] text-[#db2777]/90 leading-relaxed font-sans">
            💡 <strong>使用贴士</strong>：请一定要将顶部的系统模式切为 <strong className="text-emerald-600">[ACTIVE] 状态</strong> (绿色开启极度炸麦音频路由)，您的麦克风捕获输入和变声音频才可能实时传入。此时再转动调节滑块，实时耳机监听将直接呈现音色波动！
          </div>
        )}
      </div>

    </div>
  );
};
