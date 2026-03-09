
import React from 'react';
import { POPULAR_STYLES, ImageStyle } from '../types';

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelect: (styleId: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyleId, onSelect }) => {
  return (
    <section className="max-w-6xl mx-auto px-4 mb-8">
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="w-3 h-px bg-slate-700"></span>
        Chọn phong cách
        <span className="w-3 h-px bg-slate-700"></span>
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {POPULAR_STYLES.map((style: ImageStyle) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all duration-300 flex items-center gap-2 group ${
              selectedStyleId === style.id 
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-105' 
                : 'bg-slate-800/50 backdrop-blur-sm border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className={`text-xl transition-transform duration-300 ${selectedStyleId === style.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {style.icon}
            </span>
            <div className="flex flex-col items-start">
              <span className="font-bold whitespace-nowrap text-xs">{style.name}</span>
              {selectedStyleId === style.id && (
                <span className="text-[9px] text-blue-200 font-medium animate-fade-in uppercase tracking-wider">Đang chọn</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
