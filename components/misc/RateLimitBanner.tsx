import React from 'react';
import { Timer } from 'lucide-react';

interface RateLimitBannerProps {
  secondsLeft: number;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({ secondsLeft }) => {
  return (
    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg flex items-center justify-center gap-3 mb-4">
      <Timer className="w-5 h-5" />
      <p className="text-lg font-medium">
        Too many requests. Please wait{' '}
        <span className="font-bold text-yellow-200">{secondsLeft}</span>{' '}
        seconds before trying again.
      </p>
    </div>
  );
};