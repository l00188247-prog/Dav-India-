import React from 'react';
import { Camera, MapPin, Download, Settings, Image as ImageIcon, Code2 } from 'lucide-react';
import { GPSLocation } from '../types';

interface HeaderProps {
  location: GPSLocation | null;
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  onOpenInstall: () => void;
  onOpenSourceCode: () => void;
  photosCount: number;
  isInstallable: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  onOpenSettings,
  onOpenGallery,
  onOpenInstall,
  onOpenSourceCode,
  photosCount,
  isInstallable,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2.5 flex items-center justify-between">
      {/* Brand & GPS status */}
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Camera className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white">CamMeta</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              GPS CAM
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span className="truncate max-w-[140px] sm:max-w-[220px]">
              {location
                ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}° (±${location.accuracy}m)`
                : 'Searching GPS...'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Prominent Build APK button */}
        <button
          onClick={onOpenSourceCode}
          id="header-build-apk-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition active:scale-95"
          title="Build or Download APK"
        >
          <Code2 className="w-3.5 h-3.5 text-slate-950" />
          <span>Build APK</span>
        </button>

        {/* Quick Install APK / PWA button */}
        <button
          onClick={onOpenInstall}
          id="header-install-btn"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition active:scale-95"
          title="Install app on phone"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install on Phone</span>
          <span className="sm:hidden">Install</span>
          {isInstallable && (
            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
          )}
        </button>

        {/* Gallery shortcut */}
        <button
          onClick={onOpenGallery}
          id="header-gallery-btn"
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="View captured photos"
        >
          <ImageIcon className="w-4 h-4" />
          {photosCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-sky-500 text-[10px] font-bold text-white flex items-center justify-center">
              {photosCount}
            </span>
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          id="header-settings-btn"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Stamp Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
