// components/LiveEffectOverlay.tsx
import React from 'react';
import type { LiveEffectSettings } from '../../types';
import { LiveEffectType } from '../../types';

interface LiveEffectOverlayProps {
  settings: LiveEffectSettings;
}

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;
};


const LiveEffectOverlay: React.FC<LiveEffectOverlayProps> = ({ settings }) => {
  if (settings.type === LiveEffectType.None) {
    return null;
  }

  // Special case for Lightning
  if (settings.type === LiveEffectType.Lightning) {
    const style: React.CSSProperties & { [key: string]: any } = {
      position: 'fixed',
      inset: 0,
      backgroundColor: settings.color || '#FFFFFF',
      opacity: 0,
      pointerEvents: 'none',
      animationName: 'lightning-flash',
      animationDuration: `${random(settings.speed * 5, settings.speed * 15)}s`,
      animationTimingFunction: 'ease-out',
      animationIterationCount: 'infinite',
    };
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[5]">
        <div style={style} />
      </div>
    );
  }

  const particles = Array.from({ length: settings.count }).map((_, i) => {
    const size = random(settings.size * 0.8, settings.size * 1.2);
    const duration = random(settings.speed * 8, settings.speed * 12);
    const delay = random(0, -duration);
    const startLeftVw = random(0, 100);
    const endLeftVw = startLeftVw + random(-settings.windIntensity * 30, settings.windIntensity * 30);
    const rotationStart = random(0, 360);
    const rotationEnd = random(360, 720);

    // FIX: Add an explicit type to `particleStyle` to allow for both standard and custom CSS properties,
    // which resolves the type inference issue when adding properties conditionally.
    // The default `React.CSSProperties` type doesn't support custom properties (CSS variables).
    // By adding `& { [key: string]: any }`, we allow any string key, fixing the type errors.
    let particleStyle: React.CSSProperties & { [key: string]: any } = {
      '--fall-duration': `${duration}s`,
      '--fall-delay': `${delay}s`,
      '--start-x': `${startLeftVw}vw`,
      '--end-x': `${endLeftVw}vw`,
      '--rotation-start': `${rotationStart}deg`,
      '--rotation-end': `${rotationEnd}deg`,
      animationName: 'fall-effect',
    };

    if (settings.type === LiveEffectType.Rain) {
      particleStyle = {
        ...particleStyle,
        width: 2,
        height: size * 2,
        backgroundColor: settings.color || '#ADD8EE', // Slightly darker blue for rain
        borderRadius: '1px',
        filter: `blur(0.5px)`,
        '--start-opacity': 0.6,
        '--end-opacity': 0,
        '--rotation-start': `${random(-5, 5)}deg`,
        '--rotation-end': `${random(-5, 5)}deg`,
        transformOrigin: 'bottom center',
        '--fall-duration': `${random(settings.speed * 0.5, settings.speed * 1.5)}s`,
      };
    } else if (settings.type === LiveEffectType.Snow) {
      particleStyle = {
        ...particleStyle,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: settings.color || '#F0F8FF', // AliceBlue
        boxShadow: `0 0 ${size / 5}px ${settings.color || '#F0F8FF'}`,
        '--start-opacity': 0.9,
        '--end-opacity': 0.2,
      };
    } else if (settings.type === LiveEffectType.Leaves) {
      const colors = ['#A0522D', '#D2691E', '#CD5C5C', '#8FBC8F', '#DAA520']; // Sienna, Chocolate, IndianRed, DarkSeaGreen, Goldenrod
      const selectedLeafColor = colors[Math.floor(random(0, colors.length))];
      particleStyle = {
        ...particleStyle,
        width: size,
        height: size,
        backgroundColor: selectedLeafColor,
        borderRadius: '30% 70% 60% 40% / 70% 30% 70% 30%', // Irregular oval shape for leaves
        '--start-opacity': 0.9,
        '--end-opacity': 0.2,
      };
    } else if (settings.type === LiveEffectType.Clouds) {
      const cloudSize = random(settings.size * 10, settings.size * 20);
      particleStyle = {
        ...particleStyle,
        width: cloudSize,
        height: cloudSize / 3,
        backgroundColor: hexToRgba(settings.color || '#FFFFFF', 0.2),
        borderRadius: '50%',
        filter: `blur(${random(20, 40)}px)`,
        animationName: 'drift-effect',
        '--fall-duration': `${random(settings.speed * 40, settings.speed * 80)}s`,
        '--start-y': `${random(0, 40)}vh`,
        '--end-y': `${random(0, 40)}vh`,
        '--start-opacity': 0.7,
        '--end-opacity': 0.7,
      };
    } else if (settings.type === LiveEffectType.Sparks) {
      particleStyle = {
        ...particleStyle,
        width: Math.max(1, size / 8),
        height: size,
        borderRadius: '50%',
        backgroundColor: settings.color || '#FFD700',
        boxShadow: `0 0 ${size / 2}px ${settings.color || '#FFD700'}`,
        animationName: 'rise-effect',
        '--fall-duration': `${random(settings.speed * 1, settings.speed * 3)}s`,
        '--start-opacity': 1,
        '--end-opacity': 0,
      };
    } else if (settings.type === LiveEffectType.Dust) {
      particleStyle = {
        ...particleStyle,
        width: size / 2,
        height: size / 2,
        borderRadius: '50%',
        backgroundColor: hexToRgba(settings.color || '#BDB76B', 0.3),
        '--fall-duration': `${random(settings.speed * 15, settings.speed * 30)}s`,
        '--start-opacity': 0.6,
        '--end-opacity': 0,
      };
    }

    return (
      <div
        key={i}
        className="live-effect-particle"
        style={particleStyle}
      />
    );
  });

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[5]">
      {particles}
    </div>
  );
};

export default LiveEffectOverlay;