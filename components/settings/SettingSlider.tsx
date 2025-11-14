// components/SettingSlider.tsx
import React from 'react';

interface SettingSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (value: number) => void;
}

export const SettingSlider: React.FC<SettingSliderProps> = ({ label, value, min, max, step, unit = '', onChange }) => (
    <div className="flex flex-col">
        <div className="flex justify-between items-center mb-1">
            <label className="text-base text-text-secondary">{label}</label>
            <span className="text-base text-text-primary font-mono">{value.toFixed(label === 'Blur' ? 0 : 2)}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-border-color rounded-lg appearance-none cursor-pointer accent-accent"
        />
    </div>
);
