import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, AlertTriangle, Upload, FileCheck2, Edit, RotateCcw } from 'lucide-react';
import { parseOpmlForFeeds } from '../../utils/xmlParser';
import { CustomBackgroundSettings } from '../../types';

interface ManageFeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: string[];
  onAddFeed: (url: string) => void;
  onRemoveFeed: (url:string) => void;
  onEditFeed: (oldUrl: string, newUrl: string) => void;
  onResetFeeds: () => void;
  customBackground: CustomBackgroundSettings;
}

export const ManageFeedsModal: React.FC<ManageFeedsModalProps> = ({ isOpen, onClose, feeds, onAddFeed, onRemoveFeed, onEditFeed, onResetFeeds, customBackground }) => {
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset all local state on close
      const timer = setTimeout(() => {
        setNewFeedUrl('');
        setError(null);
        setEditingUrl(null);
        setImportStatus('idle');
        setImportMessage('');
      }, 300); // Delay reset to allow fade-out animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !show) {
    return null;
  }

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handleEditClick = (feed: string) => {
    setEditingUrl(feed);
    setNewFeedUrl(feed);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingUrl(null);
    setNewFeedUrl('');
    setError(null);
  };
  
  const handleFormSubmit = () => {
      setError(null);
      const url = newFeedUrl.trim();
      if (!url) {
        setError("URL cannot be empty.");
        return;
      }
      try {
        new URL(url); // Basic URL validation
      } catch (_) {
        setError("Please enter a valid URL.");
        return;
      }

      if (editingUrl) {
          if (feeds.includes(url) && url !== editingUrl) {
              setError("This feed has already been added.");
              return;
          }
          onEditFeed(editingUrl, url);
          handleCancelEdit();
      } else {
          if (feeds.includes(url)) {
              setError("This feed has already been added.");
              return;
          }
          onAddFeed(url);
          setNewFeedUrl('');
      }
  };
  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('loading');
    setImportMessage('Processing file...');

    try {
        const content = await file.text();
        const urls = parseOpmlForFeeds(content);
        if (urls.length === 0) {
            throw new Error("No valid feed URLs found in the file.");
        }

        let newFeedsAdded = 0;
        urls.forEach(url => {
            if (!feeds.includes(url)) {
                onAddFeed(url);
                newFeedsAdded++;
            }
        });
        
        setImportStatus('success');
        setImportMessage(`Successfully imported ${newFeedsAdded} new feed(s).`);

    } catch (err) {
        setImportStatus('error');
        setImportMessage(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        if (event.target) {
            event.target.value = "";
        }
    }
  };

  const ImportStatusMessage: React.FC = () => {
    if (!importMessage) return null;

    let icon = null;
    let colorClass = '';

    switch (importStatus) {
        case 'loading':
            icon = <Loader2 size={14} className="animate-spin" />;
            colorClass = 'text-text-secondary';
            break;
        case 'success':
            icon = <FileCheck2 size={14} />;
            colorClass = 'text-green-400';
            break;
        case 'error':
            icon = <AlertTriangle size={14} />;
            colorClass = 'text-red-400';
            break;
        default:
            return null;
    }
    
    return (
        <p className={`text-base mt-2 flex items-center gap-1.5 ${colorClass}`}>
            {icon}
            {importMessage}
        </p>
    );
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.tileOpacity})`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`rounded-lg shadow-xl p-6 w-full max-w-lg border border-border-color flex flex-col max-h-[80vh] transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="modal-title" className="text-3xl font-bold text-text-primary">Manage RSS Feeds</h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-text-secondary mb-6 flex-shrink-0 text-lg">Add or remove RSS feeds to customize your news sources.</p>

        <div className="flex-grow overflow-y-auto scrollbar-thin pr-2 -mr-2 mb-6">
            {feeds.length > 0 ? (
                <ul className="space-y-3">
                    {feeds.map(feed => (
                        <li key={feed} className="flex items-center justify-between bg-primary p-3 rounded-md">
                            <span className="text-text-primary truncate pr-4 text-base">{feed}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleEditClick(feed)}
                                    className="text-text-secondary hover:text-accent p-1 rounded-full hover:bg-accent/10"
                                    aria-label={`Edit ${feed}`}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => onRemoveFeed(feed)}
                                    className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-400/10"
                                    aria-label={`Remove ${feed}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-text-secondary py-8 text-lg">No feeds added yet.</p>
            )}
        </div>
        
        <div className="flex-shrink-0 border-t border-border-color pt-4">
            <label htmlFor="feed-url" className="text-lg font-medium text-text-primary mb-2 block">{editingUrl ? 'Edit Feed URL' : 'Add New Feed'}</label>
            <div className="flex gap-2">
                <input
                    type="url"
                    id="feed-url"
                    placeholder="https://example.com/rss.xml"
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFormSubmit()}
                    className="w-full bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base"
                />
                 <button
                    onClick={handleFormSubmit}
                    className="px-4 py-2 bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors flex items-center gap-2"
                >
                    {editingUrl ? 'Update' : <><Plus size={16} /><span>Add</span></>}
                </button>
                {editingUrl && (
                    <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-border-color text-text-secondary rounded-md hover:bg-border-color/70 transition-colors"
                        aria-label="Cancel edit"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            {error && (
                <p className="text-red-400 text-base mt-2 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {error}
                </p>
            )}
        </div>
        
        <div className="flex-shrink-0 border-t border-border-color pt-4 mt-4 space-y-4">
            <div>
                <label className="text-lg font-medium text-text-primary mb-2 block">Import / Restore</label>
                <p className="text-base text-text-secondary mb-3">Import feeds from a file or restore the default recommended list.</p>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        accept=".xml,.opml,text/xml,application/xml"
                        className="hidden"
                        id="opml-import"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importStatus === 'loading'}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:opacity-50"
                    >
                        {importStatus === 'loading' ? <Loader2 className="animate-spin" size={18} /> : <Upload size={16} />}
                        <span>Import from File</span>
                    </button>
                     <button
                        onClick={onResetFeeds}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors"
                    >
                        <RotateCcw size={16} />
                        <span>Restore Defaults</span>
                    </button>
                </div>
            </div>
            <ImportStatusMessage />
        </div>
      </div>
    </div>
  );
};