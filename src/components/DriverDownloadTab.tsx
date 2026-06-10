import React, { useState } from 'react';
import { 
  Download, 
  HelpCircle,
  CheckCircle2,
  Settings
} from 'lucide-react';

export const DriverDownloadTab: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      
      // Open the official direct VB-Cable download link in a new tab
      window.open('https://vb-audio.com/Cable/index.htm', '_blank');
      
      // Let's create a visual download notification
      alert('【LH 极度炸麦 PRO】已经为您跳转至 VB-AUDIO 官方安全下载页面！\n\n请在官网点击 "Download" 按钮下载对应的 Windows 或 macOS 版本安装包。\n安装完毕后重启电脑，即可在路由配置中将声音发送到各大聊天/开黑平台！');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="driver-download-tab">
      
      {/* Centered VB-Cable Premium Box */}
      <div className="bg-white border border-pink-150 rounded-2xl shadow-sm overflow-hidden" id="vbcable-card">
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 border-b border-pink-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="bg-[#fbcfe8] text-[#db2777] font-semibold text-[10px] px-2.5 py-0.5 rounded-full font-mono border border-pink-200 shadow-3xs uppercase tracking-wider">
              Virtual Driver
            </span>
            <h3 className="text-slate-800 font-bold font-display text-base">VB-CABLE 虚拟音频跳线电缆</h3>
          </div>
          <Settings className="w-5 h-5 text-pink-400 animate-spin-slow" />
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <p className="text-slate-700 text-sm leading-relaxed font-sans">
                <strong>VB-CABLE</strong> 是一款专业的虚拟跳线驱动声卡。它能在您的电脑后台安装一条虚拟“音频传输铜线”，将<b>【极度炸麦 PRO】</b>处理后的狂暴失真声或萌美变声，无损、无延迟地输送到 YY、Discord、微信、OBS 直播姬等任何开黑聊天软件中。
              </p>
              <div className="text-[11px] font-mono text-slate-450 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                <span>官方原版: v1.0.3.8</span>
                <span>|</span>
                <span>平台: Windows / macOS 兼容</span>
                <span>|</span>
                <span>授权: 免费安装使用 (Donationware)</span>
              </div>
            </div>

            <button
              id="btn-download-vbcable"
              onClick={handleDownload}
              className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm select-none transition cursor-pointer ${
                isDownloading 
                  ? 'bg-orange-100 text-orange-600 border border-orange-200 animate-pulse' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-450 text-white hover:opacity-95 shadow-md shadow-pink-150'
              }`}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4" />
              {isDownloading ? '正在拉取官方页面...' : '立即下载 VB-CABLE 驱动'}
            </button>
          </div>

          {/* Graphical Step-by-Step Guide */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-slate-800 font-bold text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#ec4899]" />
              三步极速配接开黑软件指南 (Setup Steps)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#fafafc] border border-slate-100 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-[#db2777]">
                  <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center font-mono text-[11px] font-black">1</span>
                  <span className="font-bold text-xs">解压并运行安装</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  下载完成后，解压 ZIP 压缩包。Windows 用户请右键点击 <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] text-pink-600">VBCABLE_Setup_x64.exe</code> 并选择 <b>"以管理员身份运行"</b>，点击 Install 开始安装。
                </p>
              </div>

              <div className="bg-[#fafafc] border border-slate-100 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-[#db2777]">
                  <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center font-mono text-[11px] font-black">2</span>
                  <span className="font-bold text-xs">绑定输出播放设备</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  启动电脑上的本控制台，将 <b>[ACTIVE]</b> 点亮。接着在左下方音频路由下的 <b>"输出播放设备"</b> 选择框里选择新出现的 <b>CABLE Input (VB-Audio Virtual Cable)</b>。
                </p>
              </div>

              <div className="bg-[#fafafc] border border-slate-100 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-[#db2777]">
                  <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center font-mono text-[11px] font-black">3</span>
                  <span className="font-bold text-xs">配置聊天软件的麦克风</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  打开 YY、Discord, 微信或网页直播。进入其音效设置，将 <b>"输入设备" / "麦克风"</b> 选为 <b>CABLE Output (VB-Audio Virtual Cable)</b>。您说的话将获得极致处理并传入。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/40 border border-pink-100 rounded-xl p-4 flex items-start gap-2.5">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-relaxed space-y-0.5">
              <strong className="text-slate-800">提示：配置完成后</strong>
              <p>
                由于您把原本耳返听到的声音重定向输出给虚拟电缆去了（以便发送给开黑好友），如果此时您也想实时听到自己的回音，请在 <b>[系统设置 / 音频控制面板]</b> 中找到虚拟电缆设备属性，点击“监听此设备”并指派到您耳朵插着的耳机中。
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
