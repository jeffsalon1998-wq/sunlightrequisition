import React from 'react';

interface SunlightTextLogoProps {
  light?: boolean;
  collapsed?: boolean;
  isMobile?: boolean;
}

export const SunlightTextLogo = ({ light = false, collapsed = false, isMobile = false }: SunlightTextLogoProps) => {
  const textColor = light ? 'gold-text' : 'gold-text';
  const subtextColor = light ? 'gold-text opacity-70' : 'maroon-text opacity-60';
  
  return (
    <div className={`flex flex-col items-center select-none transition-all duration-500 ease-in-out ${collapsed ? 'px-1' : ''}`}>
      <div className="flex flex-col items-center">
        <span className={`logo-sunlight leading-none transition-all duration-500 ${textColor} ${
          isMobile ? 'text-3xl' : (collapsed ? 'text-2xl scale-110' : 'text-5xl')
        }`}>
          Sunlight
        </span>
        <span className={`logo-hotel uppercase transition-all duration-500 whitespace-nowrap ${subtextColor} ${
          isMobile ? 'text-[7px] -mt-1' : (collapsed ? 'text-[5px] tracking-[0.2em] -mt-1' : 'text-[10px] -mt-1 tracking-[0.4em]')
        }`}>
          Hotel, Coron
        </span>
      </div>
    </div>
  );
};
