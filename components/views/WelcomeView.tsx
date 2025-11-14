

import React from 'react';
import { Compass, Settings, Search } from 'lucide-react';

interface WelcomeViewProps {
    title: string;
    message: string;
    icon: 'discover' | 'settings' | 'search';
}

const icons = {
    discover: Compass,
    settings: Settings,
    search: Search,
};

export const WelcomeView: React.FC<WelcomeViewProps> = ({ title, message, icon }) => {
    const IconComponent = icons[icon];
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-6 bg-secondary rounded-full border-4 border-border-color mb-6">
                <IconComponent className="w-16 h-16 text-accent" />
            </div>
            <h2 className="text-5xl font-bold text-text-primary">{title}</h2>
            <p className="mt-2 text-xl text-text-secondary max-w-md">{message}</p>
        </div>
    );
};