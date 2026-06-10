import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../lib/audioEngine';

interface WaveformVisualizerProps {
  engine: AudioEngine;
  isActive: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ engine, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [visualMode, setVisualMode] = useState<'wave' | 'frequency' | 'bento'>('wave');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Temp buffers for audio data
    const bufferLength = 128;
    const timeDataArray = new Uint8Array(bufferLength);
    const freqDataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with fine Macaron cream background
      ctx.fillStyle = '#faf7f3'; // Clean warm pastry white
      ctx.fillRect(0, 0, width, height);

      // Draw background grid lines (elegant light grey)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      
      const gridSize = 24;
      // Vertical grid lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw center reference horizontal line (fine sweet pink guide rail)
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Get real audio data if active and context exists
      const analysers = engine.getAnalyser();
      const outputAnalyser = analysers.output;
      const inputAnalyser = analysers.input;

      if (isActive && outputAnalyser && inputAnalyser) {
        // Collect current data
        outputAnalyser.getByteTimeDomainData(timeDataArray);
        outputAnalyser.getByteFrequencyData(freqDataArray);

        if (visualMode === 'wave') {
          // -----------------------------------------------------
          // DRAW NEON PINK MACARON WAVEFORM (Time Domain)
          // -----------------------------------------------------
          ctx.strokeStyle = '#ec4899'; // Bright Strawberry Pink
          ctx.lineWidth = 3.5;
          ctx.shadowColor = 'rgba(236, 72, 153, 0.3)';
          ctx.shadowBlur = 8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = timeDataArray[i] / 128.0; 
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }
          ctx.lineTo(width, height / 2);
          ctx.stroke();

          // Reset shadows
          ctx.shadowBlur = 0;

          // Draw double thin pastel guide rails
          ctx.strokeStyle = 'rgba(244, 114, 182, 0.35)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, height / 2 - 25);
          ctx.lineTo(width, height / 2 - 25);
          ctx.moveTo(0, height / 2 + 25);
          ctx.lineTo(width, height / 2 + 25);
          ctx.stroke();

        } else if (visualMode === 'frequency') {
          // -----------------------------------------------------
          // DRAW SPECTRUM BARS (Macaron candy colors)
          // -----------------------------------------------------
          const barWidth = (width / bufferLength) * 1.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (freqDataArray[i] / 255) * height * 0.85;

            // Gradient transition matching Macaron theme (Pink into Lemon into Aqua Mint)
            const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
            grad.addColorStop(0, '#ec4899'); // Strawberry
            grad.addColorStop(0.5, '#fb923c'); // Orange cream
            grad.addColorStop(1, '#34d399'); // Peppermint Mint

            ctx.fillStyle = grad;
            ctx.shadowColor = 'rgba(236, 72, 153, 0.1)';
            ctx.shadowBlur = 3;
            
            ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
          }
          ctx.shadowBlur = 0;

        } else if (visualMode === 'bento') {
          // -----------------------------------------------------
          // DRAW MIXED MACARON COMPOSITE
          // -----------------------------------------------------
          inputAnalyser.getByteTimeDomainData(timeDataArray);
          
          // Draw input wave (Sweet Peppermint green)
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)'; 
          ctx.lineWidth = 2;
          ctx.beginPath();
          let sliceW = width / bufferLength;
          let xIn = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = timeDataArray[i] / 128.0;
            const y = (v * height) / 2 - 20; 
            if (i === 0) ctx.moveTo(xIn, y);
            else ctx.lineTo(xIn, y);
            xIn += sliceW;
          }
          ctx.stroke();

          // Draw output wave (Sweet Grape candy pink)
          outputAnalyser.getByteTimeDomainData(timeDataArray);
          ctx.strokeStyle = '#db2777'; 
          ctx.lineWidth = 3;
          ctx.beginPath();
          let xOut = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = timeDataArray[i] / 128.0;
            const y = (v * height) / 2 + 10; 
            if (i === 0) ctx.moveTo(xOut, y);
            else ctx.lineTo(xOut, y);
            xOut += sliceW;
          }
          ctx.stroke();
        }

      } else {
        // -----------------------------------------------------
        // INACTIVE STANDBY - Custom Macaron standby pulse
        // -----------------------------------------------------
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)'; // Sweet pink
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        const now = Date.now() / 150;

        for (let i = 0; i < bufferLength; i++) {
          const noise = Math.sin(i * 0.15 - now) * 2 + Math.cos(i * 0.05 + now) * 0.6;
          const y = height / 2 + noise;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '500 10px monospace';
        ctx.fillText('STANDBY // 元气麦克风就绪', 16, height - 16);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [engine, isActive, visualMode]);

  return (
    <div className="w-full h-full flex flex-col relative" id="waveform-visualizer-container">
      {/* Floating Canvas Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 bg-[#fafafc]/95 backdrop-blur-md px-2 py-1 rounded-md border border-pink-100/85 shadow-sm">
        <button
          id="btn-vis-wave"
          onClick={() => setVisualMode('wave')}
          className={`px-2 py-0.5 text-[10px] font-mono rounded tracking-tight cursor-pointer transition ${
            visualMode === 'wave' 
              ? 'bg-[#ec4899] text-white shadow-xs' 
              : 'text-slate-600 hover:text-pink-600 hover:bg-rose-50'
          }`}
        >
          波形图
        </button>
        <button
          id="btn-vis-freq"
          onClick={() => setVisualMode('frequency')}
          className={`px-2 py-0.5 text-[10px] font-mono rounded tracking-tight cursor-pointer transition ${
            visualMode === 'frequency' 
              ? 'bg-[#ec4899] text-white shadow-xs' 
              : 'text-slate-600 hover:text-pink-600 hover:bg-rose-50'
          }`}
        >
          频谱柱
        </button>
        <button
          id="btn-vis-bento"
          onClick={() => setVisualMode('bento')}
          className={`px-2 py-0.5 text-[10px] font-mono rounded tracking-tight cursor-pointer transition ${
            visualMode === 'bento' 
              ? 'bg-[#ec4899] text-white shadow-xs' 
              : 'text-slate-600 hover:text-pink-600 hover:bg-rose-50'
          }`}
        >
          混合流
        </button>
      </div>

      <canvas 
        ref={canvasRef} 
        id="realtime-audio-canvas"
        className="w-full h-[155px] rounded-lg border border-pink-100 bg-[#faf7f3] block overflow-hidden shadow-sm cursor-pointer"
        title="点击切换视觉配置"
      />
    </div>
  );
};
