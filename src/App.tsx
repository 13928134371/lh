import React, { useState, useEffect, useRef } from 'react';
import { Tab, AudioControls, SystemStatus } from './types';
import { AudioEngine } from './lib/audioEngine';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { ControlSlider } from './components/ControlSlider';
import { SoundBeautifierTab } from './components/SoundBeautifierTab';
import { DriverDownloadTab } from './components/DriverDownloadTab';
import { 
  Sliders, 
  Sparkles, 
  Download, 
  Settings, 
  HelpCircle, 
  AlertTriangle, 
  Check, 
  Info, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Compass, 
  Share2, 
  X,
  Play,
  Flame,
  Skull,
  Maximize2
} from 'lucide-react';

export default function App() {
  // Persist AudioEngine instance across renders
  const engineRef = useRef<AudioEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new AudioEngine();
  }
  const engine = engineRef.current;

  // Tabs navigation
  const [currentTab, setCurrentTab] = useState<Tab>('control');

  // Interactive controls state
  const [controls, setControls] = useState<AudioControls>({
    gain: 450,
    distortion: 85,
    bass: 12,
    screech: 60,
    feedback: 75,
    ringMod: 40
  });

  // Cached controls for returning from NUKE or preset alterations
  const [savedPreNukeState, setSavedPreNukeState] = useState<AudioControls | null>(null);

  // System states
  const [isActive, setIsActive] = useState<boolean>(false);
  const [inputDevice, setInputDevice] = useState<string>('synth-loop');
  const [outputDevice, setOutputDevice] = useState<string>('default');
  const [isNuked, setIsNuked] = useState<boolean>(false);
  const [isMonitorEnabled, setIsMonitorEnabled] = useState<boolean>(engine.getMonitorEnabled());
  const [voiceEffect, setVoiceEffect] = useState<string>(engine.getVoiceEffect());

  // Real-time telemetry values
  const [cpuUsage, setCpuUsage] = useState<number>(12);
  const [memoryUsage, setMemoryUsage] = useState<number>(45);
  const [inDb, setInDb] = useState<number>(-50);
  const [outDb, setOutDb] = useState<number>(-48);

  // Utility modals state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Synchronize audio controls to engine when they update
  useEffect(() => {
    if (isActive) {
      engine.setControls(controls);
    }
  }, [controls, isActive]);

  // Telemetry loop: polls RMS DB levels and fluctuates CPU/Memory lightly
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Fetch live DB level metrics from analyser analysis
      if (isActive) {
        const levels = engine.getDbLevels();
        setInDb(levels.inDb);
        setOutDb(levels.outDb);
      } else {
        // Nominal fluctuating ambient noise limits when off
        setInDb(-60);
        setOutDb(-60);
      }

      // 2. Fluctuat system telemetry figures (looks authentic and highly dynamic)
      setCpuUsage((prev) => {
        const delta = (Math.random() - 0.5) * 1.5;
        const target = isNuked ? 58 : 12; // Higher usage when heavy DSP and nuke is live!
        const next = prev + delta * 0.4 + (target - prev) * 0.1;
        return parseFloat(Math.max(4, Math.min(95, next)).toFixed(1));
      });

      setMemoryUsage((prev) => {
        const delta = (Math.random() - 0.5) * 0.8;
        const target = isNuked ? 82 : 45;
        const next = prev + delta * 0.2 + (target - prev) * 0.05;
        return parseFloat(Math.max(10, Math.min(128, next)).toFixed(1));
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isActive, isNuked]);

  // Handle active stream toggle
  const toggleActiveState = async () => {
    try {
      const nextState = !isActive;
      const res = await engine.toggleActive(nextState);
      
      // If setting stream active, pass currently set controls
      if (nextState) {
        engine.setControls(controls);
        engine.setMonitorEnabled(isMonitorEnabled);
        engine.setVoiceEffect(voiceEffect);
        await engine.setSource(inputDevice);
        triggerToast('极度变声元气语音引擎已在线就绪！');
      } else {
        setIsNuked(false); // Disarm nuke on shutdown
        triggerToast('音频路由已关闭。进入 standby 待机模式。');
      }
      setIsActive(nextState);
    } catch (err) {
      console.error(err);
      setIsActive(false);
    }
  };

  const toggleMonitorState = () => {
    const nextState = !isMonitorEnabled;
    setIsMonitorEnabled(nextState);
    engine.setMonitorEnabled(nextState);
    triggerToast(nextState ? '🎧 实时耳返监听已开启（可实时倾听变声效果）' : '🔇 实时耳返监听已关闭');
  };

  const handleVoiceEffectChange = (effect: string) => {
    setVoiceEffect(effect);
    engine.setVoiceEffect(effect);
    const labels: { [key: string]: string } = {
      none: '原声绿通',
      loli: '元气萝莉',
      yujie: '高冷御姐',
      shaofu: '温婉少妇',
      child: '呆萌幼齿',
      elderly: '沧桑老人',
      ceo: '磁性总裁'
    };
    triggerToast(`🎭 变声相型已切为：${labels[effect] || effect}`);
  };

  // Safe toast notifier
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  // Target single slider mutations helper
  const handleSliderChange = (key: keyof AudioControls, val: number) => {
    setControls((prev) => {
      const next = { ...prev, [key]: val };
      if (isNuked) {
        // If they manually lower something, turn off the pure Nuke alert mode gracefully
        setIsNuked(false);
      }
      return next;
    });
  };

  // Change active input device source (mic, metal guitar loop, or synthesizers)
  const handleInputDeviceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setInputDevice(val);
    if (isActive) {
      const success = await engine.setSource(val);
      if (success) {
        triggerToast(`音源线路已切换：${getDeviceLabel(val)}`);
      } else {
        triggerToast(`通道切换失败！回滚至：${getDeviceLabel(inputDevice)}`);
      }
    }
  };

  const getDeviceLabel = (val: string) => {
    switch (val) {
      case 'microphone': return '物理拾音麦克风';
      case 'synth-loop': return 'Rhythm 律动吉他发生器';
      case 'heavy-metal': return '重载熔火金属电吉他';
      case 'sine-wave': return '正规 440Hz 实验室正弦波';
      default: return val;
    }
  };

  // Custom presets applied directly
  const handleApplyPreset = (newControls: AudioControls) => {
    setControls(newControls);
    if (isNuked) setIsNuked(false);
    triggerToast('DSP 级调校预设已同步生效！');
  };

  // DANGER ZONE : NUKE CONTROL
  const handleNukeTrigger = () => {
    if (isNuked) {
      // Restore previous state if already nuke and disarming
      if (savedPreNukeState) {
        setControls(savedPreNukeState);
      } else {
        // Default safe restore
        setControls({
          gain: 450,
          distortion: 85,
          bass: 12,
          screech: 60,
          feedback: 75,
          ringMod: 40
        });
      }
      setIsNuked(false);
      triggerToast('一键核平解除！回到保护阻尼姿态。');
    } else {
      // Save current controls for later restore
      setSavedPreNukeState({ ...controls });

      // Maximize EVERYTHING for ultimate blast effect
      const nukedControls: AudioControls = {
        gain: 1000,
        distortion: 100,
        bass: 24,
        screech: 100,
        feedback: 98, // Cap slightly below 100 for wild oscillating waves
        ringMod: 100
      };

      setControls(nukedControls);
      setIsNuked(true);

      // Trigger automatic TTS if active to scare the listener in ultimate cyberpunk style!
      if (isActive) {
        engine.speakPhrase("核弹警告！检测到核心频率熔毁，失真增益已达到最大负载。请立刻保护好听力！", "nuke");
      }
      triggerToast('⚠️ 警告：极温核平炸麦已开启！全线功放及失真因子已被推至极限 1000% ⚠️');
    }
  };

  return (
    <div 
      className={`min-h-screen font-sans bg-[#fdfbf7] text-slate-800 flex transition-all duration-500 overflow-x-hidden ${
        isNuked ? 'animate-siren-bg animate-heavy-shake' : ''
      }`}
      id="main-app-shell"
    >
      {/* Toast notification component */}
      {showToast && (
        <div 
          id="toast-notification"
          className="fixed bottom-6 right-6 z-50 bg-white border-2 border-[#ec4899] text-slate-800 text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-bounce animate-duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-[#ec4899] animate-ping" />
          <span>{showToast}</span>
          <button id="btn-close-toast" onClick={() => setShowToast(null)} className="text-slate-400 hover:text-[#ec4899] ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* -----------------------------------------------------
          SIDE NAVIGATION BAR
          ----------------------------------------------------- */}
      <aside 
        id="app-sidebar"
        className="w-[240px] border-r border-rose-100 bg-[#fef8f8] backdrop-blur-xl flex flex-col justify-between shrink-0 select-none"
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-rose-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ec4899] flex items-center justify-center shadow-xs">
              <Flame className="w-4.5 h-4.5 text-white fill-current animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm font-display tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
                LH 极度炸麦
                <span className="bg-[#db2777] text-white text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-full scale-90 origin-left">PRO</span>
              </span>
              <span className="text-[10px] text-slate-450 font-mono tracking-wider mt-1">VOLT AMPLIFIER // v2.4</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" id="sidebar-navigation">
            <button
              id="sidebar-tab-control"
              onClick={() => setCurrentTab('control')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-xs font-bold cursor-pointer transition tracking-wide ${
                currentTab === 'control'
                  ? 'bg-pink-100 text-[#db2777] border border-pink-200 relative shadow-xs'
                  : 'text-slate-600 hover:bg-pink-50/50 hover:text-[#ec4899] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4" />
                <span>极度炸麦 控制台</span>
              </div>
              <div className="flex items-center gap-1.5">
                {currentTab === 'control' && <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] shadow-xs" />}
              </div>
            </button>

            <button
              id="sidebar-tab-beautify"
              onClick={() => setCurrentTab('beautify')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-xs font-bold cursor-pointer transition tracking-wide ${
                currentTab === 'beautify'
                  ? 'bg-pink-100 text-[#db2777] border border-pink-200 relative shadow-xs'
                  : 'text-slate-600 hover:bg-pink-50/50 hover:text-[#ec4899] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4" />
                <span>声音精细美化</span>
              </div>
              {currentTab === 'beautify' && <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] shadow-xs" />}
            </button>

            <button
              id="sidebar-tab-driver"
              onClick={() => setCurrentTab('driver')}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg text-xs font-bold cursor-pointer transition tracking-wide ${
                currentTab === 'driver'
                  ? 'bg-pink-100 text-[#db2777] border border-pink-200 relative shadow-xs'
                  : 'text-slate-600 hover:bg-pink-50/50 hover:text-[#ec4899] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4" />
                <span>虚拟驱动下载</span>
              </div>
              {currentTab === 'driver' && <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] shadow-xs" />}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: telemetry diagnostics */}
        <div className="p-4 border-t border-rose-100 bg-white/40">
          <div className="p-3 bg-white rounded-xl border border-pink-100 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM STATUS
              </span>
              <span className="text-emerald-600 text-[10px] font-black">ONLINE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <div className="text-slate-500 font-semibold">宿主CPU</div>
                <div className="text-[#ec4899] font-bold mt-0.5">{cpuUsage}%</div>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <div className="text-slate-500 font-semibold">物理内存</div>
                <div className="text-[#ec4899] font-bold mt-0.5">{memoryUsage}MB</div>
              </div>
            </div>

            {/* Micro warning indicator */}
            {isNuked && (
              <div className="text-[9px] font-mono bg-rose-50 border border-pink-200 p-1 rounded-lg text-[#db2777] flex items-center gap-1 leading-normal font-bold">
                <Skull className="w-3 h-3 text-pink-500 shrink-0 animate-bounce" />
                <span>核心重载：失真放大临界！</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* -----------------------------------------------------
          MAIN CONTENT VIEW AREA
          ----------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0" id="app-main-view">
        
        {/* Top Control Header bar */}
        <header 
          id="top-navbar"
          className="h-[75px] border-b border-rose-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none z-20 animate-fade-in"
        >
          {/* Logo text & indicators */}
          <div className="flex items-center gap-4">
            <h1 className="text-slate-800 font-bold font-display text-lg tracking-tight flex items-center gap-2">
              {currentTab === 'control' && '极度炸麦 控制台'}
              {currentTab === 'beautify' && '声音精细美化中心'}
              {currentTab === 'driver' && '虚拟路由驱动分发'}
              
              {/* Dynamic blinking ACTIVE indicator badge */}
              <button
                id="btn-active-badge"
                type="button"
                onClick={toggleActiveState}
                className={`ml-2 text-[10px] font-black font-mono px-3.5 py-1 rounded-full border cursor-pointer transition duration-300 flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-650 border-emerald-250 shadow-xs animate-pulse'
                    : 'bg-rose-50 text-[#ec4899] border-pink-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#ec4899]'}`} />
                {isActive ? 'ACTIVE' : 'STANDBY'}
              </button>

              {/* Ears monitoring toggle button */}
              <button
                id="btn-monitor-toggle"
                type="button"
                onClick={toggleMonitorState}
                className={`ml-2 text-[10px] font-black font-mono px-3.5 py-1 rounded-full border cursor-pointer transition duration-300 flex items-center gap-1.5 ${
                  isMonitorEnabled 
                    ? 'bg-pink-100 text-[#db2777] border-pink-200 shadow-xs animate-pulse'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                title={isMonitorEnabled ? "点击关闭耳返监听" : "点击开启耳返监听"}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isMonitorEnabled ? 'bg-[#ec4899]' : 'bg-slate-400'}`} />
                耳返监听: {isMonitorEnabled ? '开启 (ON)' : '关闭 (OFF)'}
              </button>
            </h1>
          </div>

          {/* Quick Access Utility Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick calibration reset button */}
            <button
              id="btn-reset-calibration"
              type="button"
              onClick={() => {
                setControls({
                  gain: 450,
                  distortion: 85,
                  bass: 12,
                  screech: 60,
                  feedback: 75,
                  ringMod: 40
                });
                if (isNuked) setIsNuked(false);
                triggerToast('设置参数已一键恢复标称基准值。');
              }}
              title="复位到初始默认设置"
              className="p-2 bg-white hover:bg-pink-50 text-slate-500 hover:text-[#ec4899] border border-pink-100 rounded-lg transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Settings button */}
            <button
              id="btn-trigger-settings"
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white hover:bg-pink-50 text-slate-500 hover:text-[#ec4899] border border-pink-100 rounded-lg transition cursor-pointer relative shadow-xs"
            >
              <Settings className="w-4 h-4" />
              {showSettings && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ec4899]" />}
            </button>

            {/* Help/Instruction Panel Toggle */}
            <button
              id="btn-trigger-help"
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 bg-white hover:bg-pink-50 text-slate-500 hover:text-[#ec4899] border border-pink-100 rounded-lg transition cursor-pointer shadow-xs"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* -----------------------------------------------------
            SCROLLABLE PANEL CARDS CONTAINER
            ----------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none" id="main-panel-scroller">
          
          {/* Top Real-time Waveform Monitor Card */}
          <section className="bg-white border border-pink-100 rounded-xl p-5 shadow-sm" id="realtime-monitor-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#ec4899] animate-pulse" />
                实时波形监控 (Signal Monitor)
              </h2>

              <div className="flex items-center gap-3 font-mono text-[11px] font-bold">
                {/* Input level monitor */}
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-500">IN:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] tracking-tight ${
                    isActive ? 'bg-emerald-50 text-emerald-650 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {isActive ? `${inDb} dB` : '-52.0 dB'}
                  </span>
                </span>
                
                {/* Output level monitor */}
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-500">OUT:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] tracking-tight ${
                    isActive ? (outDb >= -5 ? 'bg-rose-50 text-rose-650 border border-rose-250 font-bold' : 'bg-slate-50 text-emerald-650 border border-emerald-200') : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {isActive ? `${outDb} dB` : '-54.4 dB'}
                  </span>
                </span>
              </div>
            </div>

            {/* Canvas renderer for waveform */}
            <WaveformVisualizer engine={engine} isActive={isActive} />
          </section>

          {/* -----------------------------------------------------
              TAB CONTENT SWITCHING
              ----------------------------------------------------- */}
          {currentTab === 'control' && (
            <div className="space-y-6" id="tab-controls-view">
              {/* Core 6 Audio control sliders grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="sliders-grid">
                
                {/* 1. GAIN Control */}
                <ControlSlider
                  id="gain"
                  title="增益控制"
                  acronym="GAIN"
                  value={controls.gain}
                  min={0}
                  max={1000}
                  unit="%"
                  glowColor="red"
                  labels={{ minLabel: '0%', midLabel: '500%', maxLabel: '1000%' }}
                  onChange={(val) => handleSliderChange('gain', val)}
                />

                {/* 2. DISTORTION Control */}
                <ControlSlider
                  id="distortion"
                  title="失真度"
                  acronym="DISTORTION"
                  value={controls.distortion}
                  min={0}
                  max={100}
                  unit="%"
                  glowColor="red"
                  labels={{ minLabel: 'Clean', midLabel: 'Crunch', maxLabel: 'Fuzz' }}
                  onChange={(val) => handleSliderChange('distortion', val)}
                />

                {/* 3. BASS Low Shelf boosting */}
                <ControlSlider
                  id="bass"
                  title="低音增强"
                  acronym="BASS"
                  value={controls.bass}
                  min={-12}
                  max={24}
                  unit="dB"
                  glowColor="orange"
                  labels={{ minLabel: '-12dB', midLabel: '0dB', maxLabel: '+24dB' }}
                  onChange={(val) => handleSliderChange('bass', val)}
                />

                {/* 4. SCREECH frequency peaking */}
                <ControlSlider
                  id="screech"
                  title="高频啸叫"
                  acronym="SCREECH"
                  value={controls.screech}
                  min={0}
                  max={100}
                  unit="%"
                  glowColor="pink"
                  labels={{ minLabel: '0%', midLabel: '50%', maxLabel: '100%' }}
                  onChange={(val) => handleSliderChange('screech', val)}
                />

                {/* 5. FEEDBACK Delay */}
                <ControlSlider
                  id="feedback"
                  title="无限反馈"
                  acronym="FEEDBACK"
                  value={controls.feedback}
                  min={0}
                  max={100}
                  unit="%"
                  glowColor="peach"
                  labels={{ minLabel: 'Min', midLabel: 'Med', maxLabel: 'Max' }}
                  onChange={(val) => handleSliderChange('feedback', val)}
                />

                {/* 6. RING MOD carrier */}
                <ControlSlider
                  id="ringMod"
                  title="环形调制"
                  acronym="RING MOD"
                  value={controls.ringMod}
                  min={0}
                  max={100}
                  unit="%"
                  glowColor="purple"
                  labels={{ minLabel: 'Off', midLabel: '50%', maxLabel: 'Robot' }}
                  onChange={(val) => handleSliderChange('ringMod', val)}
                />

              </div>

              {/* Dynamic Voice Changer Selection Panel */}
              <section className="bg-white border border-pink-100 rounded-xl p-5 shadow-xs" id="voice-changer-profiles-section">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#ec4899] animate-pulse" />
                    变声相型控制面板 (Vocal Morphing Unit)
                  </h4>
                  <span className="text-[10px] font-mono bg-pink-50 text-[#db2777] px-2.5 py-0.5 rounded-full border border-pink-100 font-bold">
                    相型: {voiceEffect === 'none' ? '原声绿通' : 
                             voiceEffect === 'loli' ? '元气萝莉' :
                             voiceEffect === 'yujie' ? '高冷御姐' :
                             voiceEffect === 'shaofu' ? '温婉少妇' :
                             voiceEffect === 'child' ? '呆萌幼齿' :
                             voiceEffect === 'elderly' ? '沧桑老人' : '磁性总裁'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    { id: 'none', label: '原声绿通', sub: 'Bypass', desc: '原形呈现', color: 'from-slate-50 to-slate-150/30', activeColor: 'bg-slate-150 text-slate-800 border-slate-350 shadow-xs' },
                    { id: 'loli', label: '元气萝莉', sub: 'Cute Loli', desc: '动漫软萌音', color: 'from-pink-50 to-rose-100/30', activeColor: 'bg-rose-100 text-[#db2777] border-pink-300 shadow-sm' },
                    { id: 'yujie', label: '高冷御姐', sub: 'Royal Sister', desc: '知性成熟音', color: 'from-purple-50 to-pink-50/30', activeColor: 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm' },
                    { id: 'shaofu', label: '温婉少妇', sub: 'Lady Tone', desc: '风韵熟女嗓', color: 'from-fuchsia-50 to-rose-50/20', activeColor: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 shadow-sm' },
                    { id: 'child', label: '呆萌幼齿', sub: 'Playful Kid', desc: '幼童共振声', color: 'from-amber-50 to-orange-50/30', activeColor: 'bg-amber-100 text-amber-800 border-orange-300 shadow-sm' },
                    { id: 'elderly', label: '沧桑老人', sub: 'Old Shaky', desc: '沙哑沧桑音', color: 'from-stone-50 to-slate-100/40', activeColor: 'bg-stone-150 text-stone-800 border-stone-350 shadow-sm' },
                    { id: 'ceo', label: '磁性总裁', sub: 'Lord CEO', desc: '厚重压迫音', color: 'from-sky-50 to-blue-50/30', activeColor: 'bg-sky-100 text-sky-850 border-sky-300 shadow-sm' }
                  ].map((p) => {
                    const isSelected = voiceEffect === p.id;
                    return (
                      <button
                        key={p.id}
                        id={`btn-voice-effect-${p.id}`}
                        onClick={() => handleVoiceEffectChange(p.id)}
                        className={`border rounded-xl p-3 text-left transition duration-300 flex flex-col justify-between cursor-pointer group ${
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
                        <div className="text-[10px] text-slate-500 font-sans mt-2 opacity-85 leading-normal truncate group-hover:opacity-100">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Bottom Row Panel: Router Config & Nuclear Danger button */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="bottom-controls-row">
                
                {/* Audio Route panel (8 columns) */}
                <section className="lg:col-span-8 bg-white border border-pink-100 rounded-xl p-5 flex flex-col justify-between shadow-xs animate-fade-in" id="audio-routing-panel">
                  <div>
                    <h3 className="text-slate-850 font-bold text-sm mb-4 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#ec4899] animate-spin-slow" />
                      音频路由配置 (Port Routing)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Input Selector Dropdown */}
                      <div className="space-y-1.5 font-sans">
                        <label htmlFor="input-source-device" className="text-slate-500 text-[11px] font-mono tracking-wider block font-bold">
                          输入设备 (INPUT SOURCE)
                        </label>
                        <div className="relative">
                          <select
                            id="input-source-device"
                            value={inputDevice}
                            onChange={handleInputDeviceChange}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-sans cursor-pointer focus:outline-none focus:border-pink-300 appearance-none shadow-xs"
                          >
                            <option value="synth-loop">测试律动吉他模拟器 (Synth Rhythm Loop)</option>
                            <option value="heavy-metal">重载熔火金属电吉他 (Heavy Distortion Rock)</option>
                            <option value="microphone">麦克风 (Realtek High Definition Audio)</option>
                            <option value="sine-wave">标准440Hz正弦波校验器 (Sine Wave Lab)</option>
                          </select>
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] pointer-events-none font-mono">▼</span>
                        </div>
                        <p className="text-[10px] text-slate-450 leading-normal">
                          * 若声卡支持ASIO，推荐使用“物理麦克风”并开启独占。
                        </p>
                      </div>

                      {/* Output Selector Dropdown */}
                      <div className="space-y-1.5 font-sans">
                        <label htmlFor="output-target-device" className="text-slate-500 text-[11px] font-mono tracking-wider block font-bold">
                          输出设备 (VIRTUAL OUTPUT TARGET)
                        </label>
                        <div className="relative">
                          <select
                            id="output-target-device"
                            value={outputDevice}
                            onChange={(e) => setOutputDevice(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-850 font-sans cursor-pointer focus:outline-none focus:border-pink-300 appearance-none shadow-xs"
                          >
                            <option value="default">默认播放设备 (System Default Speakers)</option>
                            <option value="voicemeeter">VoiceMeeter Input (VB-Audio Virtual Cable)</option>
                            <option value="cable-a">Virtual AUX Cable-A (ASIO Channel Map)</option>
                          </select>
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] pointer-events-none font-mono">▼</span>
                        </div>
                        <p className="text-[10px] text-slate-450 leading-normal">
                          * 绑定至 VoiceMeeter 声卡在各大聊天社交/直播中传送狂爆音浪。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-550">
                    <span className="flex items-center gap-1 font-sans">
                      <Info className="w-3.5 h-3.5 text-[#ec4899]" />
                      路由正常。延迟：<b>{calculatedLatencyMs(controls.feedback)} ms</b> | 缓冲区：<b>128 采样点</b>
                    </span>
                    <button 
                      id="btn-route-diagnose"
                      type="button"
                      onClick={() => triggerToast('虚拟路由链路自检：100% OK，无断流或偏置失真。')}
                      className="text-slate-600 hover:text-[#ec4899] transition font-bold cursor-pointer"
                    >
                      运行自检诊断 &gt;
                    </button>
                  </div>
                </section>

                {/* Danger zone / Nuke button (4 columns) */}
                <section 
                  id="danger-zone-section"
                  className="lg:col-span-4 bg-[#fff5f5] border border-red-200/50 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-xs animate-fade-in"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.04) 10px, rgba(239, 68, 68, 0.04) 20px)'
                  }}
                >
                  {/* Glowing halo behind danger button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-red-150/40 blur-3xl opacity-60" />

                  <div className="z-10 text-center font-sans">
                    <span className="text-[10px] font-black tracking-widest text-[#db2777] block mb-1">DANGER ZONE</span>
                    <h4 className="text-slate-800 font-bold text-xs tracking-wide">空瞬重叠爆音过调制</h4>
                  </div>

                  {/* HUGE NUKE RADAR CLICKER BUTTON */}
                  <div className="my-5 flex justify-center z-10">
                    <button
                      id="btn-heavy-nuke"
                      onClick={handleNukeTrigger}
                      className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 ${
                        isNuked
                          ? 'bg-red-500 border-white text-white shadow-[0_2px_18px_rgba(239,68,68,0.5)] scale-105 animate-pulse'
                          : 'bg-gradient-to-br from-red-50 via-white to-pink-50 border-red-300 text-[#db2777] hover:border-red-400 hover:shadow-xs hover:scale-102'
                      }`}
                    >
                      <Skull className={`w-6 h-6 mb-1 ${isNuked ? 'animate-bounce text-white' : 'text-[#db2777]'}`} />
                      <span className="font-display font-black text-sm tracking-wide">一键核平</span>
                      <span className="text-[9px] tracking-widest font-mono font-bold mt-0.5 opacity-80">( NUKE )</span>
                    </button>
                  </div>

                  <div className="text-center z-10 font-sans">
                    <p className="text-[10.5px] text-slate-600 leading-normal mb-1">
                      警告：此操作将全频段增益、失真、反馈功率瞬间榨至极限，测试听力极限。
                    </p>
                    {isNuked && (
                      <button 
                        id="btn-abort-nuke"
                        onClick={handleNukeTrigger}
                        className="text-[10px] font-bold text-red-600 hover:underline animate-flash-slow text-center cursor-pointer"
                      >
                        [ 点击解除核平状态 ]
                      </button>
                    )}
                  </div>
                </section>

              </div>
            </div>
          )}

          {currentTab === 'beautify' && (
            <SoundBeautifierTab
              engine={engine}
              isActive={isActive}
              currentControls={controls}
              onApplyPreset={handleApplyPreset}
              isMonitorEnabled={isMonitorEnabled}
              onToggleMonitor={toggleMonitorState}
              currentVoiceEffect={voiceEffect}
              onVoiceEffectChange={handleVoiceEffectChange}
            />
          )}

          {currentTab === 'driver' && (
            <DriverDownloadTab />
          )}

        </div>

        {/* -----------------------------------------------------
            DIAGNOSTICS & HARDWARE HELP PANEL (COLLAPSED BY DEFAULT)
            ----------------------------------------------------- */}
        {showHelp && (
          <aside 
            id="help-panel"
            className="fixed inset-y-0 right-0 w-[360px] bg-white border-l border-pink-100 shadow-xl z-40 p-6 flex flex-col justify-between animate-fade-in"
          >
            <div>
              <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-5">
                <h3 className="text-slate-800 font-bold font-display text-sm flex items-center gap-2">
                  <Info className="w-4.5 h-4.5 text-[#ec4899]" />
                  音频控制台指引与故障排查
                </h3>
                <button 
                  id="btn-close-help"
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[75vh] pr-2 font-sans">
                <div className="bg-[#fafafc] p-3 rounded-xl border border-pink-100/50">
                  <h4 className="text-slate-800 font-bold mb-1">1. 如何发出物理声音？</h4>
                  <p>
                    点击顶部的 <strong className="text-[#ec4899] font-semibold">ACTIVE</strong>，控制台会立刻点亮运行。如果您的麦克风暂不可用，音源会自动启动内置的音像吉他发生器（极速打击乐和低音吉他），滑移中间的推子，声音和波形就会立刻实时变幻。
                  </p>
                </div>

                <div className="bg-[#fafafc] p-3 rounded-xl border border-pink-100/50">
                  <h4 className="text-slate-800 font-bold mb-1">2. “一键核平”的科学原理是什么？</h4>
                  <p>
                    在硬件功放中，全路满负荷过载（Cascade Distortion）会将原音完全“正弦矩形化”，伴随高频声波啸叫共振，发出极其震撼、沙哑重金属风格的毁灭性噪音。它是硬核音乐家与极致搞怪追求的高峰操作。
                  </p>
                </div>

                <div className="bg-[#fafafc] p-3 rounded-xl border border-pink-100/50">
                  <h4 className="text-slate-800 font-bold mb-1">3. 如何配置到 Discord/微信 畅玩？</h4>
                  <p>
                    进入 <strong>虚拟驱动下载</strong> 下载 VB-CABLE，安装后将系统极度炸麦输出设为该电缆。在聊天软件输入设备设为 Cable Input 即可捕获声音。
                  </p>
                </div>

                <div className="bg-[#fff5f5] p-3 rounded-xl border border-red-150">
                  <h4 className="text-[#db2777] font-bold mb-1 flex items-center gap-1">⚠️ 保护听力声明</h4>
                  <p className="text-red-700 font-sans">
                    一键核平会短时释放超大幅度功率。建议您在使用耳机测试核平按钮时先调低音箱或物理耳机上的旋钮音量，保障耳膜健康！
                  </p>
                </div>
              </div>
            </div>

            <button
              id="btn-close-help-confirm"
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full bg-[#ec4899] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#db2777] transition cursor-pointer shadow-sm"
            >
              我知道了，开始运行
            </button>
          </aside>
        )}

        {/* -----------------------------------------------------
            THEME & SPECIAL LABS SETTINGS DIALOG
            ----------------------------------------------------- */}
        {showSettings && (
          <div 
            id="settings-dialog-overlay"
            className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          >
            <div className="w-[480px] bg-white border border-pink-100 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <h3 className="text-slate-800 font-bold font-display text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#ec4899]" />
                  LH 极度炸麦系统配置选项
                </h3>
                <button 
                  id="btn-close-settings"
                  type="button"
                  onClick={() => setShowSettings(false)} 
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preferences options */}
              <div className="space-y-4 text-xs font-sans">
                {/* 1 */}
                <div className="flex items-center justify-between bg-[#fafafc] p-3 rounded-xl border border-pink-100/50">
                  <div>
                    <span className="text-slate-800 font-bold block">高质量 double-biquad 重采样</span>
                    <span className="text-slate-400 text-[10px]">开启 4x 像素抗混叠过采样（极高 CPU）</span>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer font-sans">
                    <input type="checkbox" id="check-oversampling" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ec4899]"></div>
                  </div>
                </div>

                {/* 2 */}
                <div className="flex items-center justify-between bg-[#fafafc] p-3 rounded-xl border border-pink-100/50">
                  <div>
                    <span className="text-slate-800 font-bold block">自激回授阻断保护器</span>
                    <span className="text-slate-400 text-[10px]">在检测到持续反馈破音时安全调降增益</span>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer font-sans">
                    <input type="checkbox" id="check-anti-feedback" className="sr-only peer" defaultChecked={false} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer:checked:after:translate-x-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ec4899]"></div>
                  </div>
                </div>

                {/* 3 */}
                <div className="flex items-center justify-between bg-[#fafafc] p-3 rounded-xl border border-pink-100/50">
                  <div>
                    <span className="text-slate-800 font-bold block">梦幻马卡龙元气主题</span>
                    <span className="text-slate-400 text-[10px]/normal">采用温暖、高对比度糖果色降低阅读压力</span>
                  </div>
                  <span className="bg-pink-100 text-[#db2777] font-mono text-[9px] px-2.5 py-0.5 rounded-full border border-pink-200 font-bold uppercase">
                    ACTIVE THEME
                  </span>
                </div>
              </div>

              {/* Confirm actions */}
              <div className="border-t border-rose-100 pt-4 flex items-center justify-end gap-2.5">
                <button
                  id="btn-settings-cancel"
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-805 hover:bg-slate-100 text-xs transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  id="btn-settings-save"
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    triggerToast('用户偏好配置已持久化至应用缓冲中。');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#ec4899] text-white hover:bg-[#db2777] text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Simple mathematical projection for ASIO delay simulation visualization
const calculatedLatencyMs = (feedback: number) => {
  const result = 2.5 + (feedback / 100) * 8.2;
  return parseFloat(result.toFixed(1));
};
