import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { AppearancePreset, CustomBackgroundSettings, LiveEffectSettings } from '../../types';
import { ChevronDown, Save, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';

interface AppearancePresetManagerProps {
  presets: AppearancePreset[];
  activePresetId: string | null;
  currentBackground: CustomBackgroundSettings;
  currentEffects: LiveEffectSettings;
  onApply: (presetId: string) => void;
  onOpenSavePresetModal: (state: { mode: 'new' | 'rename' | 'duplicate'; presetId?: string; initialName?: string }) => void;
  onOpenConfirmPresetModal: (state: { mode: 'overwrite' | 'delete'; presetId: string; presetName: string }) => void;
}

export const AppearancePresetManager: React.FC<AppearancePresetManagerProps> = (props) => {
  const { presets, activePresetId, currentBackground, currentEffects, onApply, onOpenSavePresetModal, onOpenConfirmPresetModal } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activePreset = useMemo(() => presets.find(p => p.id === activePresetId), [presets, activePresetId]);

  const hasUnsavedChanges = useMemo(() => {
    if (!activePreset) return false;
    const currentSettings = { background: currentBackground, effects: currentEffects };
    const presetSettings = { background: activePreset.background, effects: activePreset.effects };
    return JSON.stringify(currentSettings) !== JSON.stringify(presetSettings);
  }, [activePreset, currentBackground, currentEffects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDuplicate = () => {
    if (!activePreset) return;
    onOpenSavePresetModal({
      mode: 'duplicate',
      presetId: activePreset.id,
      initialName: `Copy of ${activePreset.name}`,
    });
  };

  const isDefaultPreset = activePreset?.id === 'default';

  return (
    <>
      <div>
        <label className="block text-lg font-medium text-text-secondary mb-1">Appearance Preset</label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <select
              value={activePresetId || 'custom'}
              onChange={(e) => onApply(e.target.value)}
              className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2.5 px-4 text-text-primary text-base"
            >
              <option value="custom" disabled={!activePresetId}>
                {activePresetId ? `${activePreset?.name} (modified)` : 'Custom Settings'}
              </option>
              {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
          </div>
          
          {hasUnsavedChanges && activePresetId && activePreset && !isDefaultPreset && (
            <button onClick={() => onOpenConfirmPresetModal({ mode: 'overwrite', presetId: activePreset.id, presetName: activePreset.name })} className="px-4 py-2 bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors flex items-center gap-2" title="Save changes to current preset">
              <Save size={16} /> <span className="hidden sm:inline">Save</span>
            </button>
          )}

          <button onClick={() => onOpenSavePresetModal({ mode: 'new', initialName: `Custom Preset #${presets.length}` })} className="px-4 py-2 bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors" title="Save as new preset">
            Save As...
          </button>
          
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(prev => !prev)} disabled={!activePreset || isDefaultPreset} className="p-2.5 bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:opacity-50" title="More options">
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && activePreset && !isDefaultPreset && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-secondary border border-border-color rounded-md shadow-lg z-10">
                <button onClick={() => { onOpenSavePresetModal({ mode: 'rename', presetId: activePreset.id, initialName: activePreset.name }); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-text-primary hover:bg-border-color">
                  <Edit size={16} /> Rename
                </button>
                <button onClick={() => { handleDuplicate(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-text-primary hover:bg-border-color">
                  <Copy size={16} /> Duplicate
                </button>
                <div className="border-t border-border-color my-1"></div>
                <button onClick={() => { onOpenConfirmPresetModal({ mode: 'delete', presetId: activePreset.id, presetName: activePreset.name }); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-900/20">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {activePreset && activePreset.description && (
          <p
            className="text-sm text-text-secondary mt-2"
            dangerouslySetInnerHTML={{ __html: activePreset.description }}
          />
        )}
      </div>
    </>
  );
};