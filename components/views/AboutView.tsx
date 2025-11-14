import React from 'react';
import { Info, Plus, History, Share2, Star, List, Tv, Settings, Github } from 'lucide-react';
import type { CustomBackgroundSettings } from '../../types';
import { Tile } from '../cards/Tile';

interface AboutViewProps {
    customBackground: CustomBackgroundSettings;
}

const FeatureTile: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
    <div className="flex items-start gap-4">
        <div className="bg-border-color p-3 rounded-md mt-1">
            <Icon className="w-6 h-6 text-accent" />
        </div>
        <div>
            <h4 className="text-xl font-bold text-text-primary">{title}</h4>
            <p className="text-lg text-text-secondary">{children}</p>
        </div>
    </div>
);


export const AboutView: React.FC<AboutViewProps> = ({ customBackground }) => {
    return (
        <div className="w-full max-w-screen-2xl mx-auto">
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Info className="w-8 h-8 text-accent flex-shrink-0" />
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary">About Project Hermes</h2>
                            <p className="text-xl text-text-secondary">Your personal, private, and powerful anime companion.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-full transition-colors" title="Add New">
                            <Plus size={22} />
                        </button>
                        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-full transition-colors" title="History">
                            <History size={22} />
                        </button>
                        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-full transition-colors" title="Share">
                            <Share2 size={22} />
                        </button>
                    </div>
                </div>

                <Tile title="What is Project Hermes?" icon={Info} customBackground={customBackground}>
                    <p className="text-lg text-text-secondary leading-relaxed">
                        Project Hermes is a modern, privacy-focused, desktop-first application built for the discerning anime fan. It's designed to be your all-in-one solution for tracking progress, managing custom watch lists, and discovering new series. By leveraging the power of local storage, your data stays on your device, ensuring complete privacy. With a sleek interface and powerful features, Hermes aims to provide a superior, personalized anime tracking experience.
                    </p>
                </Tile>

                <Tile title="Key Features" icon={Star} customBackground={customBackground}>
                    <div className="space-y-6">
                        <FeatureTile icon={List} title="Comprehensive List Management">
                            Import your existing list from MyAnimeList and manage your watching status, episode progress, and personal scores with ease.
                        </FeatureTile>
                        <FeatureTile icon={Tv} title="Detailed Anime View">
                            Dive deep into any anime with detailed information including synopsis, characters, related series, and image galleries, all fetched automatically.
                        </FeatureTile>
                        <FeatureTile icon={Settings} title="Advanced Customization">
                            Tailor the application's appearance to your liking with custom backgrounds, live visual effects, and multiple theme presets.
                        </FeatureTile>
                    </div>
                </Tile>
                
                <Tile title="Source Code" icon={Github} customBackground={customBackground}>
                    <p className="text-lg text-text-secondary mb-4">
                        Project Hermes is an open-source project. We welcome contributions and feedback from the community. You can find the source code on GitHub.
                    </p>
                    <a
                        href="https://github.com/example/project-hermes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 text-lg font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors"
                    >
                        <Github size={20} />
                        <span>View on GitHub</span>
                    </a>
                </Tile>
            </div>
        </div>
    );
};
