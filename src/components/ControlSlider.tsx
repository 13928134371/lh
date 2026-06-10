import React from 'react';

interface ControlSliderProps {
  id: string;
  title: string;
  acronym: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  glowColor: 'red' | 'orange' | 'yellow' | 'pink' | 'peach' | 'purple';
  labels: { minLabel: string; midLabel: string; maxLabel: string };
  onChange: (val: number) => void;
}

export const ControlSlider: React.FC<ControlSliderProps> = ({
  id,
  title,
  acronym,
  value,
  min,
  max,
  unit,
  glowColor,
  labels,
  onChange
}) => {
  // Map color categories to beautiful Macaron palette definitions
  const getColorClasses = () => {
    switch (glowColor) {
      case 'red':
        return {
          text: 'text-rose-600',
          bg: 'bg-rose-400',
          accent: 'accent-rose-400',
          glow: 'shadow-[0_2px_8px_rgba(244,63,94,0.22)]',
          border: 'border-rose-200/50',
          circleBg: 'bg-rose-400',
          trackBg: 'bg-rose-100/80'
        };
      case 'orange':
        return {
          text: 'text-orange-600',
          bg: 'bg-orange-400',
          accent: 'accent-orange-400',
          glow: 'shadow-[0_2px_8px_rgba(249,115,22,0.22)]',
          border: 'border-orange-200/50',
          circleBg: 'bg-orange-400',
          trackBg: 'bg-orange-100/80'
        };
      case 'yellow':
        return {
          text: 'text-amber-600',
          bg: 'bg-amber-400',
          accent: 'accent-amber-400',
          glow: 'shadow-[0_2px_8px_rgba(217,119,6,0.22)]',
          border: 'border-amber-200/50',
          circleBg: 'bg-amber-400',
          trackBg: 'bg-amber-100/80'
        };
      case 'pink':
        return {
          text: 'text-pink-600',
          bg: 'bg-pink-400',
          accent: 'accent-pink-400',
          glow: 'shadow-[0_2px_8px_rgba(236,72,153,0.22)]',
          border: 'border-pink-200/50',
          circleBg: 'bg-pink-400',
          trackBg: 'bg-pink-100/80'
        };
      case 'peach':
        return {
          text: 'text-emerald-600',
          bg: 'bg-emerald-400',
          accent: 'accent-emerald-400',
          glow: 'shadow-[0_2px_8px_rgba(52,211,153,0.22)]',
          border: 'border-emerald-200/50',
          circleBg: 'bg-emerald-400',
          trackBg: 'bg-emerald-100/80'
        };
      case 'purple':
        return {
          text: 'text-purple-600',
          bg: 'bg-purple-400',
          accent: 'accent-purple-400',
          glow: 'shadow-[0_2px_8px_rgba(168,85,247,0.22)]',
          border: 'border-purple-200/50',
          circleBg: 'bg-purple-400',
          trackBg: 'bg-purple-100/80'
        };
    }
  };

  const colors = getColorClasses();

  // Percentage value for drawing the glowing progress trail
  const percentage = ((value - min) / (max - min)) * 100;

  // Render pretty textual representation
  const formatDisplayValue = () => {
    if (id === 'bass') {
      return value >= 0 ? `+${value} ${unit}` : `${value} ${unit}`;
    }
    return `${value}${unit}`;
  };

  return (
    <div 
      id={`slider-card-${id}`}
      className="bg-[#fafafc] border border-pink-100/80 rounded-xl p-5 flex flex-col justify-between hover:border-pink-200 hover:shadow-md transition duration-300 relative overflow-hidden"
    >
      {/* Decorative side accent lines */}
      <div className={`absolute top-0 left-0 w-1 h-8 ${colors.bg}`} />

      {/* Title block */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-slate-800 text-sm font-semibold tracking-wide flex items-center gap-1.5">
            {title}
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">
              ({acronym})
            </span>
          </span>
        </div>
        <div className={`text-2xl font-bold font-sans tracking-tight ${colors.text} flex items-baseline gap-0.5`}>
          {formatDisplayValue()}
        </div>
      </div>

      {/* Slider range track controls */}
      <div className="mt-6 flex flex-col gap-2.5">
        <div className="relative w-full h-8 flex items-center">
          {/* Custom Track Background */}
          <div className="absolute left-0 right-0 h-1.5 rounded-full bg-slate-100" />
          
          {/* Glow fill trail */}
          <div 
            className={`absolute left-0 h-1.5 rounded-full ${colors.bg} ${colors.glow}`} 
            style={{ width: `${percentage}%` }}
          />

          {/* Styled Range Input */}
          <input
            id={`input-range-${id}`}
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`absolute w-full h-full opacity-100 bg-transparent cursor-pointer appearance-none outline-none ${colors.accent} md:slider-glow-thumb`}
            style={{ margin: 0, padding: 0 }}
          />
          
          {/* Slider knob preview (glowing ball sitting at center of value) */}
          <div 
            className={`absolute w-4.5 h-4.5 rounded-full border border-white pointer-events-none transform -translate-x-1/2 flex items-center justify-center ${colors.circleBg} ${colors.glow} shadow-sm`}
            style={{ left: `${percentage}%` }}
          />
        </div>

        {/* Labels underneath */}
        <div className="flex justify-between text-[11px] text-slate-600 font-mono font-medium">
          <span className="cursor-pointer hover:text-[#ec4899] transition" onClick={() => onChange(min)}>
            {labels.minLabel}
          </span>
          <span className="cursor-pointer hover:text-[#ec4899] transition" onClick={() => onChange(min + (max - min) / 2)}>
            {labels.midLabel}
          </span>
          <span className="cursor-pointer hover:text-[#ec4899] transition" onClick={() => onChange(max)}>
            {labels.maxLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
