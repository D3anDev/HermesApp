import React, { useState, useRef, useEffect } from 'react';
import { X, Edit, Save } from 'lucide-react';
import { ImageCropperModal } from '../modals/ImageCropperModal';
import { CustomBackgroundSettings } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: { username: string; profilePic: string };
  onSave: (newProfile: { username?: string; profilePic?: string }) => void;
  customBackground: CustomBackgroundSettings;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userProfile, onSave, customBackground }) => {
  const [username, setUsername] = useState(userProfile.username);
  const [profilePic, setProfilePic] = useState(userProfile.profilePic);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      setUsername(userProfile.username);
      setProfilePic(userProfile.profilePic);
      return () => clearTimeout(timer);
    }
  }, [isOpen, userProfile]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const hasChanges = username !== userProfile.username || profilePic !== userProfile.profilePic;

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = (croppedImage: string) => {
    setProfilePic(croppedImage);
    setImageToCrop(null);
  };

  const handleSave = () => {
    if (hasChanges) {
      onSave({ username, profilePic });
      handleClose();
    }
  };
  
  if (!isOpen) return null;
  
  const modalStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.tileOpacity})`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-modal="true"
        role="dialog"
      >
        <div 
          className={`rounded-lg shadow-xl p-8 w-full max-w-lg border border-border-color transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          onClick={(e) => e.stopPropagation()}
          style={modalStyle}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold text-text-primary">Edit Profile</h2>
            <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                  <img src={profilePic} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-border-color" />
                  <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-accent text-primary p-1.5 rounded-full hover:bg-blue-400 transition-colors"
                      aria-label="Change profile picture"
                  >
                      <Edit size={14} />
                  </button>
                  <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="hidden"
                  />
              </div>
              <div className="w-full">
                  <label htmlFor="username" className="block text-lg font-medium text-text-secondary mb-1">Username</label>
                  <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={25}
                      className="w-full bg-primary border border-border-color text-text-primary rounded-md p-2 focus:ring-accent focus:border-accent text-base"
                  />
                  <p className="text-right text-base text-text-secondary mt-1">
                    {username.length} / 25
                  </p>
              </div>
          </div>
          
          <div className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-border-color">
              <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors text-base"
              >
                  Cancel
              </button>
              <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="flex items-center gap-2 px-6 py-2 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed text-base"
              >
                  <Save size={16} />
                  <span>Save Changes</span>
              </button>
          </div>
        </div>
      </div>
      {imageToCrop && (
        <ImageCropperModal
          imageSrc={imageToCrop}
          onClose={() => setImageToCrop(null)}
          onSave={handleCropSave}
        />
      )}
    </>
  );
};