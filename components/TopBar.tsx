import React from 'react';
import Button from './Button';
import '../types';

interface TopBarProps {
  title?: string;
  onReset?: () => void;
  showInstallButton?: boolean;
  onInstall?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  title = "VibeGo", 
  onReset, 
  showInstallButton = false, 
  onInstall 
}) => {
  return (
    <div className="sticky top-0 z-30 bg-vibe-dark/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center safe-top">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onReset} role="button">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vibe-primary to-vibe-secondary flex items-center justify-center">
          <ion-icon name="sparkles" className="text-white text-lg"></ion-icon>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {showInstallButton && (
          <Button 
            variant="outline" 
            className="!px-3 !py-1 text-xs h-8 border-vibe-accent text-vibe-accent hover:bg-vibe-accent/10"
            onClick={onInstall}
          >
            <ion-icon name="download-outline" className="mr-1"></ion-icon> Install
          </Button>
        )}
        <button className="text-slate-400 hover:text-white text-2xl ml-2" onClick={() => alert("Settings would go here")}>
          <ion-icon name="settings-outline"></ion-icon>
        </button>
      </div>
    </div>
  );
};

export default TopBar;