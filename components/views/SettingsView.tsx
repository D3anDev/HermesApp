import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileCheck2, AlertTriangle, Loader2, Download, Trash2, Link2, Save, Copy, RotateCw, Image, Clock, Database, Settings, Plus, History, Share2 } from 'lucide-react';
import { parseMalXml } from '../../utils/xmlParser';
import { Anime, TimeSettings, CustomBackgroundSettings, ExportDataType, LiveEffectSettings, MalAuthData, AppearancePreset } from '../../types';
import { TimezoneSettings } from '../settings/TimezoneSettings';
import { BackgroundSettingsPanel } from '../settings/CustomBackgroundSettings'; // Import the component
import { redirectToMalAuth } from '../../services/malService';
import { StorageUsageView } from '../search/GlobalSearch';
import { Tile } from '../cards/Tile';

interface SettingsViewProps {
  onImport: (importedList: Anime[]) => void;
  onExport: (exportType: ExportDataType) => { success: boolean; message: string }; // Modified to accept exportType
  animeList: Anime[]; // Added animeList prop
  timeSettings: TimeSettings;
  onTimeSettingsChange: (newSettings: TimeSettings) => void;
  customBackground: CustomBackgroundSettings;
  onCustomBackgroundChange: (newSettings: CustomBackgroundSettings) => void;
  liveEffectSettings: LiveEffectSettings; // New: Live effect settings prop
  onLiveEffectChange: (newSettings: LiveEffectSettings) => void; // New: Live effect change handler prop
  onDeleteAllData: () => void; // New prop for deleting all data
  malAuthData: MalAuthData | null;
  onDisconnectMal: () => void;
  malClientId: string | null;
  onSetMalClientId: (id: string) => void;
  onRecheckMalStatus: () => Promise<void>;
  onClearDetailsCache: () => void;
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
  triggerImportPulse: boolean;
  onImportPulseConsumed: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const { onImport, onExport, animeList, timeSettings, onTimeSettingsChange, customBackground, onCustomBackgroundChange, liveEffectSettings, onLiveEffectChange, onDeleteAllData, malAuthData, onDisconnectMal, malClientId, onSetMalClientId, onRecheckMalStatus, onClearDetailsCache, triggerImportPulse, onImportPulseConsumed } = props;
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importErrorMessage, setImportErrorMessage] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportMessage, setExportMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [clientIdInput, setClientIdInput] = useState(malClientId || '');
  const [isClientIdSaved, setIsClientIdSaved] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isImportPulsing, setIsImportPulsing] = useState(false);
  const importTileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerImportPulse) {
      importTileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIsImportPulsing(true);
      const timer = setTimeout(() => {
        setIsImportPulsing(false);
      }, 5000);
      onImportPulseConsumed();
      return () => clearTimeout(timer);
    }
  }, [triggerImportPulse, onImportPulseConsumed]);

  useEffect(() => {
    setClientIdInput(malClientId || '');
  }, [malClientId]);

  const handleSaveClientId = () => {
    onSetMalClientId(clientIdInput.trim());
    setIsClientIdSaved(true);
    setTimeout(() => setIsClientIdSaved(false), 2000); // Show confirmation for 2 seconds
  };
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText('http://localhost:3000').then(() => {
        setIsUrlCopied(true);
        setTimeout(() => setIsUrlCopied(false), 2000);
    });
  };
  
  const handleCheckStatus = async () => {
    setIsChecking(true);
    await onRecheckMalStatus();
    setIsChecking(false);
  };


  const processFile = (file: File) => {
    if (!file) return;

    const isXml = file.type === 'text/xml' || file.name.toLowerCase().endsWith('.xml');
    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
    const isTxt = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

    if (!isXml && !isJson && !isTxt) {
        setImportStatus('error');
        setImportErrorMessage('Invalid file type. Please upload an XML, JSON, or TXT file.');
        return;
    }

    setImportStatus('loading');
    setImportErrorMessage('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error("File is empty or could not be read.");
        
        const importedList = parseMalXml(content);
        if (importedList.length === 0) throw new Error("No valid anime entries found. The file might be empty or in the wrong format.");
        
        onImport(importedList);
        setImportStatus('success');
        setImportErrorMessage('Successfully imported your list!');
      } catch (err) {
        setImportStatus('error');
        setImportErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred during parsing.');
        console.error(err);
      }
    };
    reader.onerror = () => {
      setImportStatus('error');
      setImportErrorMessage('Failed to read the file.');
    };
    reader.readAsText(file);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    processFile(event.target.files?.[0] as File);
    // Reset the input value to allow re-uploading the same file
    if(event.target) {
      event.target.value = "";
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleExportClick = (exportType: ExportDataType) => {
    const result = onExport(exportType);
    setExportStatus(result.success ? 'success' : 'error');
    setExportMessage(result.message);
  };

  const ImportStatusIcon = () => {
    switch(importStatus) {
        case 'loading': return <Loader2 className="w-6 h-6 animate-spin text-accent" />;
        case 'success': return <FileCheck2 className="w-6 h-6 text-green-400" />;
        case 'error': return <AlertTriangle className="w-6 h-6 text-red-400" />;
        default: return <Upload className="w-6 h-6 text-accent" />;
    }
  };
  
  const ExportStatusIcon = () => {
    switch(exportStatus) {
        case 'success': return <FileCheck2 className="w-6 h-6 text-green-400" />;
        case 'error': return <AlertTriangle className="w-6 h-6 text-red-400" />;
        default: return <Download className="w-6 h-6 text-accent" />;
    }
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-start mb-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Settings className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary">Settings</h2>
            <p className="text-xl text-text-secondary">Customize your application experience.</p>
          </div>
        </div>
      </div>
      
      <div className="flex-grow min-h-0 overflow-y-auto scrollbar-thin -mr-4 pr-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Tile title="Appearance" icon={Image} customBackground={customBackground}>
                <BackgroundSettingsPanel
                    settings={customBackground}
                    onUpdate={onCustomBackgroundChange}
                    liveEffectSettings={liveEffectSettings}
                    onLiveEffectChange={onLiveEffectChange}
                    appearancePresets={props.appearancePresets}
                    activePresetId={props.activePresetId}
                    onApplyPreset={props.onApplyPreset}
                    onSaveNewPreset={props.onSaveNewPreset}
                    onUpdatePreset={props.onUpdatePreset}
                    onDeletePreset={props.onDeletePreset}
                    onOpenSavePresetModal={props.onOpenSavePresetModal}
                    onOpenConfirmPresetModal={props.onOpenConfirmPresetModal}
                    onUndo={props.onUndo}
                    canUndo={props.canUndo}
                />
            </Tile>
          
            <Tile title="Time & Date" icon={Clock} customBackground={customBackground}>
                <TimezoneSettings settings={timeSettings} onUpdate={onTimeSettingsChange} />
            </Tile>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Tile title="Data Management" icon={Upload} customBackground={customBackground} ref={importTileRef} className={isImportPulsing ? 'animate-pulse-glow' : ''}>
                <p className="text-text-secondary -mt-2 mb-6 text-lg">
                    Import your MyAnimeList data or export your current app data for backup.
                </p>
                <div className="border-t border-border-color pt-6">
                    <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xml,.json,.txt,text/xml,application/json,text/plain"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label
                        htmlFor="file-upload"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        dragActive ? 'border-accent bg-accent/10' : 'border-border-color hover:border-accent/50 hover:bg-primary'
                        }`}
                    >
                        <div className="flex flex-col items-center justify-center">
                        <ImportStatusIcon />
                        <p className={`mt-2 text-base 
                            ${importStatus === 'error' ? 'text-red-400' : 
                            (importStatus === 'success' ? 'text-green-400' : 'text-text-secondary')}`}>
                            {importStatus === 'idle' && 'Click to upload or drag & drop file'}
                            {importStatus === 'loading' && 'Processing your file...'}
                            {importErrorMessage || (importStatus === 'success' && 'Successfully imported your list!')}
                        </p>
                        </div>
                    </label>
                    </form>
                </div>

                <div className="border-t border-border-color mt-6 pt-6">
                    <button
                        onClick={() => handleExportClick(ExportDataType.AnimeListXML)}
                        disabled={animeList.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <Download />
                        <span>Export MyAnimeList Data (XML)</span>
                    </button>
                    <button
                        onClick={() => handleExportClick(ExportDataType.AllAppDataJSON)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold bg-primary text-text-primary rounded-md border border-border-color hover:bg-border-color/70 transition-colors mt-3"
                    >
                        <Download />
                        <span>Export All App Data (JSON)</span>
                    </button>
                    {exportMessage && exportStatus !== 'idle' && (
                        <p className={`text-base text-center mt-2 flex items-center justify-center gap-1.5 
                        ${exportStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                        <ExportStatusIcon />
                        {exportMessage}
                        </p>
                    )}
                </div>
            </Tile>
            
            <Tile title="Storage Usage" icon={Database} customBackground={customBackground}>
                <StorageUsageView onClearDetailsCache={onClearDetailsCache} refreshTrigger={animeList.length} customBackground={customBackground} />
            </Tile>
        </div>
        
        <Tile title="MyAnimeList Integration" icon={Link2} customBackground={customBackground}>
            <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-text-primary mb-2">API Configuration</h4>
                  <p className="text-text-secondary mt-2 mb-3 text-base">
                    To use the MAL integration, you need to provide your own Client ID. This is a one-time setup.
                  </p>
                  <ol className="list-decimal list-inside text-text-secondary text-base space-y-2 mb-4">
                      <li>Visit the <a href="https://myanimelist.net/apiconfig" target="_blank" rel="noopener noreferrer" className="text-accent underline hover:no-underline">MAL API Configuration page</a> and create a new app.</li>
                      <li>
                        Set the "App Redirect URL" to:
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-primary px-2 py-1 rounded-md text-text-primary border border-border-color">http://localhost:3000</code>
                          <button onClick={handleCopyUrl} className="p-2 text-text-secondary hover:text-accent rounded-md hover:bg-accent/10 transition-colors" title="Copy URL">
                            {isUrlCopied ? <FileCheck2 size={16} className="text-green-400" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </li>
                      <li>Copy the "Client ID" from your new MAL app and paste it below.</li>
                  </ol>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste your MyAnimeList Client ID here"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="w-full bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base"
                    />
                    <button
                      onClick={handleSaveClientId}
                      className="px-4 py-2 bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors flex items-center gap-2"
                    >
                      {isClientIdSaved ? <FileCheck2 size={16} className="text-green-400" /> : <Save size={16} />}
                      <span>{isClientIdSaved ? 'Saved!' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-border-color pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xl font-semibold text-text-primary">Connection Status</h4>
                      <button
                          onClick={handleCheckStatus}
                          disabled={isChecking}
                          className="flex items-center gap-2 px-3 py-1 text-sm font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-wait"
                      >
                          {isChecking ? <Loader2 size={16} className="animate-spin" /> : <RotateCw size={16} />}
                          <span>{isChecking ? 'Checking...' : 'Check Status'}</span>
                      </button>
                    </div>

                    {malAuthData ? (
                      <div className="flex items-center gap-4">
                        <img src={malAuthData.user.picture} alt="MAL user" className="w-12 h-12 rounded-full border-2 border-accent" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse-slow"></span>
                            <p className="text-lg text-green-400 font-semibold">Successfully Connected!</p>
                          </div>
                          <p className="text-base text-text-secondary">Logged in as <strong className="text-text-primary">{malAuthData.user.name}</strong>.</p>
                        </div>
                        <button
                          onClick={onDisconnectMal}
                          className="ml-auto px-4 py-2 text-base font-semibold bg-red-900/50 text-red-400 rounded-md hover:bg-red-900/70 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse-slow"></span>
                          <p className="text-lg text-red-400 font-semibold">Disconnected</p>
                        </div>
                        <button
                          onClick={redirectToMalAuth}
                          disabled={!malClientId}
                          title={!malClientId ? 'Please save a Client ID first' : 'Connect to MyAnimeList'}
                          className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          <Link2 />
                          <span>Connect to MyAnimeList</span>
                        </button>
                      </div>
                    )}
                </div>
            </div>
        </Tile>
        
        <Tile title="Danger Zone" icon={Trash2} className="border-red-700/50" customBackground={customBackground}>
            <div className="bg-red-900/10 p-4 rounded-md">
                <p className="text-red-300 mb-6 text-lg">
                    This action will permanently remove ALL your anime list, settings, and profile data from this application. This cannot be undone.
                </p>
                <button
                    onClick={onDeleteAllData}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
                >
                    <Trash2 />
                    <span>Delete All Data</span>
                </button>
            </div>
        </Tile>
      </div>
    </div>
  );
};