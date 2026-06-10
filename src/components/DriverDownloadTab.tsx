import React, { useState } from 'react';
import { 
  Download, 
  Layers, 
  Gauge, 
  Waves
} from 'lucide-react';

export const DriverDownloadTab: React.FC = () => {
  const [bufferSize, setBufferSize] = useState<number>(128);
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Latency formula: Buffer Size / Sample Rate * 1000 + 1.2ms ASIO driver overhead conversion
  const calculatedLatency = ((bufferSize / sampleRate) * 1000 + 1.2).toFixed(1);

  const driversList = [
    {
      id: 'vbcable',
      name: 'VB-CABLE Virtual Audio Cable',
      version: 'v1.0.3.8',
      size: '4.2 MB',
      description: '提供虚拟跳线声卡。将极度炸麦输出端子绑定到系统麦克风。支持多路重载。',
      author: 'VB-AUDIO Software',
      url: 'https://vb-audio.com/Cable/'
    },
    {
      id: 'voicemeeter',
      name: 'VoiceMeeter Banana / Potato PRO',
      version: 'v2.0.6.2',
      size: '14.8 MB',
      description: '高级虚拟音频调音台。支持 3 路虚拟 AUX 输入与 ASIO 硬件底层驱动极速合并。',
      author: 'VB-AUDIO Software',
      url: 'https://vb-audio.com/Voicemeeter/banana.htm'
    },
    {
      id: 'asio4all',
      name: 'ASIO4ALL Universal Driver',
      version: 'v2.15 Beta',
      size: '1.1 MB',
      description: '通用声卡低延迟独占控制。极限压缩缓冲周期，榨干采样芯片的所有回放性能。',
      author: 'Michael Tippach',
      url: 'https://www.asio4all.org/'
    }
  ];

  const handleDownload = (driverId: string, name: string) => {
    setIsDownloading(driverId);
    setTimeout(() => {
      setIsDownloading(null);
      
      // Simulate file download trigger
      const link = document.createElement('a');
      link.href = '#';
      link.setAttribute('download', `LH_Extreme_Mod_${driverId}_drv.zip`);
      document.body.appendChild(link);
      // Let's create a visual download notification in alert instead since it doesn't leave the iFrame
      alert(`【LH 极度炸麦 PRO】系统正在调用分流极速节点...\n\n下载成功：${name} 已经保存在您的下载目录中。\n请以管理员权限运行 EXE 导入跳线。`);
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="driver-download-tab">
      {/* Visual audio flow route map */}
      <div className="bg-white border border-pink-100 rounded-xl p-6 shadow-xs">
        <h3 className="text-slate-800 font-bold text-sm mb-5 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#ec4899] animate-pulse" />
          虚拟伴奏与人声路由映射图 (Signal Chain)
        </h3>

        {/* CSS custom flow charts animation */}
        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 py-3 text-center md:text-left">
          {/* Node 1: physical mic */}
          <div className="md:col-span-1 bg-rose-50/50 border border-pink-100 px-3 py-4 rounded-xl flex flex-col items-center justify-center shadow-xs">
            <span className="text-slate-400 text-[10px] font-mono tracking-wider">01-INPUT</span>
            <span className="text-slate-800 font-bold text-xs mt-1">物理麦克风</span>
            <span className="text-[#ec4899] text-[10px] font-mono mt-1">采集原始信号</span>
          </div>

          {/* Connected flow arrow */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="flex md:flex-col items-center gap-1 text-slate-400">
              <span className="text-[10px] font-mono select-none hidden md:block">路由中</span>
              <div className="flex gap-1 overflow-hidden md:rotate-0 rotate-90">
                <span className="text-[#ec4899] font-bold animate-pulse">≫</span>
                <span className="text-[#ec4899]/60 font-bold animate-pulse delay-100">≫</span>
              </div>
            </div>
          </div>

          {/* Node 2: LH extreme blast */}
          <div className="md:col-span-1 bg-pink-100 border border-pink-300 px-3 py-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
            <span className="text-[#db2777] text-[10px] font-mono tracking-wider font-semibold">02-PROCESS</span>
            <span className="text-[#db2777] font-bold text-xs mt-1">极度炸麦 PRO</span>
            <span className="text-[#ec4899] text-[10px] font-mono font-bold mt-1">10X大功率失真</span>
          </div>

          {/* Parallel Flow Arrow */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="flex md:flex-col items-center gap-1 text-slate-400">
              <span className="text-[10px] font-mono select-none hidden md:block">高增益</span>
              <div className="flex gap-1 overflow-hidden md:rotate-0 rotate-90">
                <span className="text-[#ec4899] font-bold animate-pulse">≫</span>
                <span className="text-[#ec4899]/60 font-bold animate-pulse delay-100">≫</span>
              </div>
            </div>
          </div>

          {/* Node 3: Virtual Audio cable driver */}
          <div className="md:col-span-1 bg-indigo-50 border border-indigo-150 px-3 py-4 rounded-xl flex flex-col items-center justify-center shadow-xs">
            <span className="text-slate-400 text-[10px] font-mono tracking-wider">03-OUTPUT</span>
            <span className="text-[#4f46e5] font-bold text-xs mt-1">虚拟声卡输入端</span>
            <span className="text-[#3b82f6] text-[10px] font-mono font-medium mt-1">VoiceMeeter Aux</span>
          </div>

          {/* Connected flow arrow */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="flex md:flex-col items-center gap-1 text-slate-400">
              <span className="text-[10px] font-mono select-none hidden md:block">对流映射</span>
              <div className="flex gap-1 overflow-hidden md:rotate-0 rotate-90">
                <span className="text-[#3b82f6] font-bold animate-pulse">≫</span>
                <span className="text-[#3b82f6]/65 font-bold animate-pulse delay-100">≫</span>
              </div>
            </div>
          </div>

          {/* Node 4: stream applications */}
          <div className="md:col-span-1 bg-purple-50 border border-purple-150 px-3 py-4 rounded-xl flex flex-col items-center justify-center shadow-xs">
            <span className="text-slate-400 text-[10px] font-mono tracking-wider">04-TARGET</span>
            <span className="text-slate-800 font-bold text-xs mt-1">开黑/直播软件</span>
            <span className="text-purple-600 text-[10px] font-mono mt-1">Discord / OBS</span>
          </div>
        </div>

        <p className="text-slate-600 text-[11px] leading-relaxed mt-4 bg-[#fafafc] p-3 rounded-lg border border-pink-100/60 font-sans">
          * 提示：下载 VB-CABLE 后，您只需要在下方的<b>【音频路由配置】</b>中，将“输出设备”设置为 <b>VoiceMeeter Input</b> 或 <b>Cable Input</b>，接着在 Discord、OBS 等软件内的“麦克风输入设置”一栏中选择相同的对应虚拟通道，即可实现极致炸麦的声音输入。
        </p>
      </div>

      {/* Latency Calculator & Settings Simulator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Settings widget */}
        <div className="lg:col-span-5 bg-white border border-pink-100 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <h4 className="text-slate-800 font-bold text-sm mb-1.5 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-orange-500 animate-pulse" />
              ASIO/WDM 超低延迟周期配置
            </h4>
            <p className="text-slate-500 text-[11px] mb-4 font-sans">
              通过减少内部缓冲大小来压缩时间差，但这会成倍消耗宿主系统的 CPU 性能并增加爆音概率。
            </p>

            <div className="space-y-4">
              {/* Buffer Size slider */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5 font-medium">
                  <span className="text-slate-500">缓冲区大小 (Buffer Size)</span>
                  <span className="text-orange-600 font-bold">{bufferSize} 采样点</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    id="btn-buf-64"
                    type="button"
                    onClick={() => setBufferSize(64)}
                    className={`px-3 py-1 text-[11px] font-mono rounded-lg cursor-pointer transition ${bufferSize === 64 ? 'bg-orange-500 text-white font-bold border border-orange-300' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    64
                  </button>
                  <button
                    id="btn-buf-128"
                    type="button"
                    onClick={() => setBufferSize(128)}
                    className={`px-3 py-1 text-[11px] font-mono rounded-lg cursor-pointer transition ${bufferSize === 128 ? 'bg-orange-500 text-white font-bold border border-orange-300' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    128
                  </button>
                  <button
                    id="btn-buf-256"
                    type="button"
                    onClick={() => setBufferSize(256)}
                    className={`px-3 py-1 text-[11px] font-mono rounded-lg cursor-pointer transition ${bufferSize === 256 ? 'bg-orange-500 text-white font-bold border border-orange-300' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    256
                  </button>
                  <button
                    id="btn-buf-512"
                    type="button"
                    onClick={() => setBufferSize(512)}
                    className={`px-3 py-1 text-[11px] font-mono rounded-lg cursor-pointer transition ${bufferSize === 512 ? 'bg-orange-500 text-white font-bold border border-orange-300' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    512
                  </button>
                </div>
              </div>

              {/* Sample rate buttons */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5 font-medium">
                  <span className="text-slate-500">全局采样频率 (Sample Rate)</span>
                  <span className="text-[#ec4899] font-bold">{sampleRate / 1000} kHz</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="btn-sr-44"
                    type="button"
                    onClick={() => setSampleRate(44100)}
                    className={`py-1.5 rounded-lg text-xs font-mono cursor-pointer transition ${sampleRate === 44100 ? 'bg-[#ec4899] text-white font-bold border border-pink-300' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    44.1 kHz
                  </button>
                  <button
                    id="btn-sr-48"
                    type="button"
                    onClick={() => setSampleRate(48000)}
                    className={`py-1.5 rounded-lg text-xs font-mono cursor-pointer transition ${sampleRate === 48000 ? 'bg-[#ec4899] text-white font-bold border border-pink-300' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    48.0 kHz
                  </button>
                  <button
                    id="btn-sr-96"
                    type="button"
                    onClick={() => setSampleRate(96000)}
                    className={`py-1.5 rounded-lg text-xs font-mono cursor-pointer transition ${sampleRate === 96000 ? 'bg-[#ec4899] text-white font-bold border border-pink-300' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                  >
                    96.0 kHz
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results calculation */}
          <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between font-sans">
            <span className="text-slate-500 text-xs font-medium">理论处理延迟:</span>
            <span className="text-[#ec4899] font-display font-black text-2xl tracking-tighter flex items-baseline gap-1 animate-pulse">
              {calculatedLatency}
              <span className="text-[10px] font-mono text-slate-400 font-medium">MS</span>
            </span>
          </div>
        </div>

        {/* Downloads widget */}
        <div className="lg:col-span-7 bg-white border border-pink-100 rounded-xl p-5 space-y-4 shadow-xs">
          <h4 className="text-slate-800 font-bold text-sm flex items-center gap-2">
            <Waves className="w-4 h-4 text-[#ec4899]" />
            官方驱动分发程序包 (ASIO Compliant)
          </h4>

          <div className="divide-y divide-rose-50 space-y-3">
            {driversList.map((drv) => (
              <div key={drv.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                <div className="space-y-0.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-bold text-xs group-hover:text-[#ec4899] transition">{drv.name}</span>
                    <span className="text-[9px] font-mono bg-pink-50 text-[#ec4899] px-1.5 py-0.2 rounded-full border border-pink-100">{drv.version}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed font-sans">{drv.description}</p>
                  <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span>分发商: {drv.author}</span>
                    <span>|</span>
                    <span>大小: {drv.size}</span>
                  </div>
                </div>

                <button
                  id={`btn-download-drv-${drv.id}`}
                  onClick={() => handleDownload(drv.id, drv.name)}
                  className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer select-none transition ${
                    isDownloading === drv.id 
                      ? 'bg-orange-100 text-orange-600 border border-orange-200 animate-pulse' 
                      : 'bg-[#ec4899] text-white hover:bg-[#db2777] shadow-sm'
                  }`}
                  disabled={isDownloading !== null}
                >
                  <Download className="w-3.5 h-3.5" />
                  {isDownloading === drv.id ? '调取中...' : '下载'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
