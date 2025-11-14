import React, { useState, useRef } from 'react';
import { Upload, Trash2, Move, Sparkles, ChevronDown, Brush, Undo2, RotateCcw } from 'lucide-react';
import type { CustomBackgroundSettings, LiveEffectSettings, AppearancePreset } from '../../types';
import { LiveEffectType } from '../../types';
import { BackgroundAdjustModal } from '../modals/BackgroundAdjustModal';
import { SettingSlider } from '../settings/SettingSlider';
import LiveEffectOverlay from '../misc/LiveEffectOverlay';
import { AppearancePresetManager } from '../settings/AppearancePresetManager';

interface CustomBackgroundSettingsProps {
  settings: CustomBackgroundSettings;
  onUpdate: (newSettings: CustomBackgroundSettings) => void;
  liveEffectSettings: LiveEffectSettings;
  onLiveEffectChange: (newSettings: LiveEffectSettings) => void;
  appearancePresets: AppearancePreset[];
  activePresetId: string | null;
  onApplyPreset: (presetId: string) => void;
  onSaveNewPreset: (name: string) => void;
  onUpdatePreset: (presetId: string, updates: Partial<AppearancePreset>) => void;
  onDeletePreset: (presetId: string) => void;
  onOpenSavePresetModal: (state: { mode: 'new' | 'rename' | 'duplicate'; presetId?: string; initialName?: string }) => void;
  onOpenConfirmPresetModal: (state: { mode: 'overwrite' | 'delete'; presetId: string; presetName: string }) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const defaultBackgroundPreview = 'https://picsum.photos/seed/bg/800/450';

export const BackgroundSettingsPanel: React.FC<CustomBackgroundSettingsProps> = (props) => {
  const { settings, onUpdate, liveEffectSettings, onLiveEffectChange, appearancePresets, activePresetId, onApplyPreset, onOpenSavePresetModal, onOpenConfirmPresetModal, onUndo, canUndo } = props;
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'background' | 'theme' | 'effects'>('background');

  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onUpdate({ ...settings, imageUrl: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    processImageFile(event.target.files?.[0] as File);
    if (event.target) event.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
  };

  const handleResetToDefault = () => {
    onApplyPreset('default');
  };
  
  const handleSettingChange = (field: keyof CustomBackgroundSettings, value: any) => onUpdate({ ...settings, [field]: value });

  const handleLiveEffectSettingChange = (field: keyof LiveEffectSettings, value: any) => {
    let newColor = liveEffectSettings.color;
    if (field === 'type') {
      if (value === LiveEffectType.Snow) newColor = liveEffectSettings.color || '#F0F8FF';
      else if (value === LiveEffectType.Rain) newColor = liveEffectSettings.color || '#ADD8EE';
      else if (value === LiveEffectType.Clouds) newColor = liveEffectSettings.color || '#FFFFFF';
      else if (value === LiveEffectType.Sparks) newColor = liveEffectSettings.color || '#FFD700';
      else if (value === LiveEffectType.Lightning) newColor = liveEffectSettings.color || '#FFFFFF';
      else if (value === LiveEffectType.Dust) newColor = liveEffectSettings.color || '#BDB76B';
      else if (value === LiveEffectType.Leaves || value === LiveEffectType.None) newColor = undefined;
    }
    onLiveEffectChange({ ...liveEffectSettings, [field]: value, color: newColor });
  };

  return (
    <>
      <div className="flex-shrink-0">
          <p className="text-text-secondary -mt-2 mb-4 text-lg">Personalize the look and feel of your app.</p>
          
          <AppearancePresetManager
            presets={appearancePresets}
            activePresetId={activePresetId}
            currentBackground={settings}
            currentEffects={liveEffectSettings}
            onApply={onApplyPreset}
            onOpenSavePresetModal={onOpenSavePresetModal}
            onOpenConfirmPresetModal={onOpenConfirmPresetModal}
          />

          <div className="flex items-center justify-end gap-3 mt-4">
              <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo last change"
              >
                  <Undo2 size={16} />
                  <span>Undo</span>
              </button>
              <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-border-color text-text-secondary rounded-md hover:bg-red-400/20 hover:text-red-400 transition-colors"
                  title="Reset all settings to the default preset"
              >
                  <RotateCcw size={16} />
                  <span>Reset</span>
              </button>
          </div>

          <div className="border-t border-border-color my-6"></div>

          <div className="flex gap-2 p-1 bg-primary rounded-md border border-border-color mb-6">
              <button onClick={() => setActiveTab('background')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-base font-semibold transition-colors ${activeTab === 'background' ? 'bg-accent text-primary' : 'text-text-secondary hover:bg-border-color'}`}>Background</button>
              <button onClick={() => setActiveTab('theme')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-base font-semibold transition-colors ${activeTab === 'theme' ? 'bg-accent text-primary' : 'text-text-secondary hover:bg-border-color'}`}><Brush size={16} /> Theme</button>
              <button onClick={() => setActiveTab('effects')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-base font-semibold transition-colors ${activeTab === 'effects' ? 'bg-accent text-primary' : 'text-text-secondary hover:bg-border-color'}`}><Sparkles size={16} /> Effects</button>
          </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="background-upload" />
      <label
          htmlFor="background-upload"
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          className={`group relative w-full h-64 flex-shrink-0 mb-6 bg-primary rounded-lg overflow-hidden border-2 border-dashed cursor-pointer transition-colors ${dragActive ? 'border-accent bg-accent/10' : 'border-border-color'}`}
      >
          <div style={{ backgroundImage: `url(${settings.imageUrl || defaultBackgroundPreview})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: `blur(${settings.blur}px) brightness(${settings.brightness}) contrast(${settings.contrast}) ${settings.grayscale ? 'grayscale(100%)' : 'grayscale(0%)'}`, opacity: settings.opacity }} className="absolute inset-0 z-[1] transition-all" />
          <LiveEffectOverlay settings={liveEffectSettings} />
          <div style={{ backgroundColor: `rgb(var(--color-primary-rgb) / ${settings.backgroundOverlayOpacity})`}} className="absolute inset-0 flex items-center justify-center p-4 text-center z-[10]">
              <span className="text-text-primary text-xl font-semibold opacity-50 group-hover:opacity-0 transition-opacity">Live Preview</span>
          </div>
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-8 h-8 text-white/80 mb-2" />
              <p className="text-white font-semibold text-lg">Click or drag & drop to upload</p>
              <p className="text-white/70 text-base">Recommended size: 1920x1080</p>
          </div>
      </label>

      <div className="flex-grow min-h-0">
          {activeTab === 'background' && (
              <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-text-primary">Background Settings</h4>
                  <SettingSlider label="Image Opacity" value={settings.opacity} min={0} max={1} step={0.01} onChange={(v) => handleSettingChange('opacity', v)} />
                  <SettingSlider label="Background Overlay Opacity" value={settings.backgroundOverlayOpacity} min={0} max={1} step={0.01} onChange={(v) => handleSettingChange('backgroundOverlayOpacity', v)} />
                  <SettingSlider label="Component Opacity" value={settings.tileOpacity} min={0} max={1} step={0.01} onChange={(v) => handleSettingChange('tileOpacity', v)} />
                  <SettingSlider label="Blur" value={settings.blur} min={0} max={40} step={1} unit="px" onChange={(v) => handleSettingChange('blur', v)} />
                  <SettingSlider label="Brightness" value={settings.brightness} min={0} max={2} step={0.01} onChange={(v) => handleSettingChange('brightness', v)} />
                  <SettingSlider label="Contrast" value={settings.contrast} min={0} max={2} step={0.01} onChange={(v) => handleSettingChange('contrast', v)} />
                  <div className="flex items-center justify-between">
                      <label className="text-base text-text-secondary">Grayscale</label>
                      <button onClick={() => handleSettingChange('grayscale', !settings.grayscale)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.grayscale ? 'bg-accent' : 'bg-border-color'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.grayscale ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border-color mt-4">
                      <button onClick={() => setIsAdjustModalOpen(true)} disabled={!settings.imageUrl} className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:opacity-50"><Move size={16} /> Adjust Position</button>
                  </div>
              </div>
          )}
          {activeTab === 'theme' && (
              <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-text-primary">Theme Colors</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-base text-text-secondary">Accent Color</label>
                      <input type="color" value={settings.accentColor || '#58A6FF'} onChange={(e) => handleSettingChange('accentColor', e.target.value)} className="w-10 h-8 p-1 border border-border-color bg-secondary rounded-md cursor-pointer" title="Choose accent color" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-base text-text-secondary">Component Color</label>
                      <input type="color" value={settings.componentColor || '#161B22'} onChange={(e) => handleSettingChange('componentColor', e.target.value)} className="w-10 h-8 p-1 border border-border-color bg-secondary rounded-md cursor-pointer" title="Choose component background color" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-base text-text-secondary">Background Overlay</label>
                      <input type="color" value={settings.overlayColor || '#0D1117'} onChange={(e) => handleSettingChange('overlayColor', e.target.value)} className="w-10 h-8 p-1 border border-border-color bg-secondary rounded-md cursor-pointer" title="Choose background overlay color" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-base text-text-secondary">Primary Text Color</label>
                      <input type="color" value={settings.primaryTextColor || '#C9D1D9'} onChange={(e) => handleSettingChange('primaryTextColor', e.target.value)} className="w-10 h-8 p-1 border border-border-color bg-secondary rounded-md cursor-pointer" title="Choose primary text color" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-base text-text-secondary">Secondary Text Color</label>
                      <input type="color" value={settings.secondaryTextColor || '#8B949E'} onChange={(e) => handleSettingChange('secondaryTextColor', e.target.value)} className="w-10 h-8 p-1 border border-border-color bg-secondary rounded-md cursor-pointer" title="Choose secondary text color" />
                    </div>
                  </div>
              </div>
          )}
          {activeTab === 'effects' && (
              <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-text-primary">Live Effects Settings</h4>
                  <div className="relative">
                      <label className="block text-lg font-medium text-text-secondary mb-1">Effect Type</label>
                      <select value={liveEffectSettings.type} onChange={(e) => handleLiveEffectSettingChange('type', e.target.value as LiveEffectType)} className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base">
                          {Object.values(LiveEffectType).map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-text-secondary pointer-events-none" />
                  </div>
                  {liveEffectSettings.type !== LiveEffectType.None && (
                      <>
                          <SettingSlider label="Count" value={liveEffectSettings.count} min={10} max={200} step={1} onChange={(v) => handleLiveEffectSettingChange('count', v)} />
                          <SettingSlider label="Size" value={liveEffectSettings.size} min={2} max={30} step={1} unit="px" onChange={(v) => handleLiveEffectSettingChange('size', v)} />
                          <SettingSlider label="Speed" value={liveEffectSettings.speed} min={0.5} max={3} step={0.1} onChange={(v) => handleLiveEffectSettingChange('speed', v)} />
                          <SettingSlider label="Wind" value={liveEffectSettings.windIntensity} min={0} max={1} step={0.1} onChange={(v) => handleLiveEffectSettingChange('windIntensity', v)} />
                          {(liveEffectSettings.type === LiveEffectType.Snow || liveEffectSettings.type === LiveEffectType.Rain || liveEffectSettings.type === LiveEffectType.Clouds || liveEffectSettings.type === LiveEffectType.Sparks || liveEffectSettings.type === LiveEffectType.Dust || liveEffectSettings.type === LiveEffectType.Lightning) && (
                              <div className="flex items-center justify-between">
                                  <label className="text-base text-text-secondary">Color</label>
                                  <input type="color" value={liveEffectSettings.color || '#FFFFFF'} onChange={(e) => handleLiveEffectSettingChange('color', e.target.value)} className="w-10 h-8 p-1 border border-border-color bg-secondary rounded-md cursor-pointer" title="Choose particle color" />
                              </div>
                          )}
                      </>
                  )}
              </div>
          )}
      </div>
      {isAdjustModalOpen && settings.imageUrl && (
        <BackgroundAdjustModal
          imageUrl={settings.imageUrl}
          initialSettings={{ zoom: settings.zoom, positionX: settings.positionX, positionY: settings.positionY }}
          onClose={() => setIsAdjustModalOpen(false)}
          onSave={(newPos) => { onUpdate({ ...settings, ...newPos }); setIsAdjustModalOpen(false); }}
        />
      )}
    </>
  );
};