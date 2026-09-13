import React, { useState, useRef } from 'react';
import {
  SwitchCamera,
  Zap,
  ZapOff,
  Grid,
  Maximize2,
  RefreshCw,
  Upload,
  AlertCircle,
  MapPin,
  Clock,
  Compass
} from 'lucide-react';
import { GPSLocation, StampSettings, CapturedPhoto } from '../types';

interface CameraViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  cameraError: string | null;
  onSwitchCamera: () => void;
  hasTorch: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
  aspectRatio: '4:3' | '16:9' | '1:1';
  onChangeAspectRatio: (ratio: '4:3' | '16:9' | '1:1') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onCapture: () => void;
  onRestartCamera: () => void;
  onUploadPhoto: (file: File) => void;
  location: GPSLocation | null;
  stampSettings: StampSettings;
  lastPhoto: CapturedPhoto | null;
  onOpenGallery: () => void;
  isCapturing: boolean;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  videoRef,
  isStreaming,
  cameraError,
  onSwitchCamera,
  hasTorch,
  torchOn,
  onToggleTorch,
  aspectRatio,
  onChangeAspectRatio,
  showGrid,
  onToggleGrid,
  onCapture,
  onRestartCamera,
  onUploadPhoto,
  location,
  stampSettings,
  lastPhoto,
  onOpenGallery,
  isCapturing,
}) => {
  const [flashEffect, setFlashEffect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCaptureClick = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);
    onCapture();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadPhoto(e.target.files[0]);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const lat = location?.latitude ?? 28.6139;
  const lng = location?.longitude ?? 77.2090;
  const latStr = `${lat.toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${lng.toFixed(5)}° ${lng >= 0 ? 'E' : 'W'}`;

  return (
    <div className="relative w-full h-[calc(100vh-56px)] mt-14 flex flex-col items-center justify-between bg-black select-none overflow-hidden">
      {/* Top Quick Bar (Aspect ratio, Grid, Flash, Upload) */}
      <div className="absolute top-2 inset-x-0 z-20 flex items-center justify-between px-4">
        {/* Aspect Ratio pill */}
        <button
          onClick={() => {
            const next = aspectRatio === '4:3' ? '16:9' : aspectRatio === '16:9' ? '1:1' : '4:3';
            onChangeAspectRatio(next);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-200 hover:text-white transition"
        >
          <Maximize2 className="w-3 h-3 text-sky-400" />
          <span>{aspectRatio}</span>
        </button>

        {/* Center Indicators (Compass / Accuracy) */}
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-2.5 py-1 rounded-full text-[11px] text-slate-300">
          <Compass className="w-3 h-3 text-emerald-400" />
          <span>{location?.heading !== null && location?.heading !== undefined ? `${location.heading}°` : 'GPS Active'}</span>
          <span className="text-slate-500">•</span>
          <span>±{location?.accuracy ?? 5}m</span>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          {hasTorch && (
            <button
              onClick={onToggleTorch}
              className={`p-1.5 rounded-full backdrop-blur-md border transition ${
                torchOn
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900/80 text-slate-200 border-slate-700/60 hover:text-white'
              }`}
              title="Toggle Flashlight"
            >
              {torchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded-full backdrop-blur-md border transition ${
              showGrid
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
            title="Toggle Grid Lines"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Upload photo from gallery fallback */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white transition"
            title="Stamp photo from gallery"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Main Viewfinder Frame */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
        {/* Aspect-constrained Container */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
            aspectRatio === '1:1'
              ? 'aspect-square w-[min(100vw,calc(100vh-180px))]'
              : aspectRatio === '16:9'
              ? 'aspect-[9/16] sm:aspect-[16/9] w-full h-full max-w-[480px] sm:max-w-[700px]'
              : 'aspect-[3/4] w-[min(100vw,calc(100vh-170px))]'
          }`}
        >
          {/* Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* Flash animation */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-30 pointer-events-none transition-opacity duration-200 animate-fade-out" />
          )}

          {/* Grid lines */}
          {showGrid && isStreaming && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>
          )}

          {/* Live Watermark Overlay (shows exact preview of stamped output) */}
          {isStreaming && (
            <div
              className={`absolute z-10 pointer-events-none transition-all ${
                stampSettings.style === 'minimal'
                  ? 'inset-x-0 bottom-0 py-2 px-3 bg-slate-950/80 backdrop-blur-sm border-t border-sky-500/30 flex items-center justify-between text-[11px]'
                  : stampSettings.style === 'survey'
                  ? 'bottom-3 left-3 right-3 max-w-sm rounded-xl overflow-hidden bg-slate-950/85 backdrop-blur-md border border-amber-500/40 p-3 shadow-xl'
                  : stampSettings.style === 'technical'
                  ? 'bottom-3 right-3 max-w-xs rounded-lg bg-slate-950/90 backdrop-blur-md border border-sky-500 p-2.5 text-sky-400 font-mono text-[10px]'
                  : stampSettings.position === 'bottom-banner'
                  ? 'inset-x-0 bottom-0 p-3 bg-slate-950/85 backdrop-blur-md border-t-2 border-sky-500 text-xs'
                  : 'bottom-3 left-3 right-3 max-w-sm rounded-2xl bg-slate-950/85 backdrop-blur-md border-t-2 border-sky-500 p-3 text-xs shadow-2xl'
              }`}
            >
              {stampSettings.style === 'minimal' ? (
                <>
                  <span className="font-bold text-sky-400">CAMMETA GPS</span>
                  <span className="text-slate-200">
                    {latStr}, {lngStr} • {dateStr}
                  </span>
                </>
              ) : stampSettings.style === 'survey' ? (
                <div>
                  <div className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold text-[10px] inline-block mb-1.5 uppercase">
                    FIELD SURVEY: {stampSettings.projectName || 'CAMMETA AUDIT'}
                  </div>
                  <div className="font-semibold text-slate-100 text-xs">
                    Lat: {latStr} | Long: {lngStr}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{location?.address || 'Current Location Coordinates'}</span>
                  </div>
                </div>
              ) : stampSettings.style === 'technical' ? (
                <div>
                  <div className="font-bold text-sky-300 border-b border-sky-800 pb-1 mb-1">
                    CAMMETA // HUD
                  </div>
                  <div>GEO: {latStr} {lngStr}</div>
                  <div>ALT: {location?.altitude ? `${Math.round(location.altitude)}m` : 'Sea Level'} (±{location?.accuracy ?? 5}m)</div>
                  <div>TIME: {now.toISOString().slice(0, 19)}</div>
                  <div>TAG: {stampSettings.customNote || 'AUTHENTICATED'}</div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sky-400 tracking-wide flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                      CAMMETA GPS
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{dateStr}</span>
                  </div>
                  <div className="font-semibold text-white text-xs tracking-tight">
                    {latStr} | {lngStr}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate mt-0.5">
                    {location?.address || 'GPS Coordinates Active'}
                  </div>
                  <div className="text-[10px] text-sky-300/80 mt-1 flex items-center gap-1.5">
                    <span>Acc: ±{location?.accuracy ?? 5}m</span>
                    {stampSettings.customNote && (
                      <>
                        <span>•</span>
                        <span>{stampSettings.customNote}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera Error / Permission Fallback View */}
          {(!isStreaming || cameraError) && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                Camera Access Needed
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
                {cameraError || 'Please grant camera permissions to capture live geotagged photos.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={onRestartCamera}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Camera Again
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Select Photo from Device
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Shutter & Controls Bar */}
      <div className="w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-900 px-6 py-4 flex items-center justify-between z-20">
        {/* Gallery Preview Thumbnail */}
        <div className="w-12 h-12 flex items-center justify-start">
          {lastPhoto ? (
            <button
              onClick={onOpenGallery}
              className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-sky-500 shadow-md active:scale-95 transition"
              title="Open photo gallery"
            >
              <img
                src={lastPhoto.dataUrl}
                alt="Last captured"
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <div className="w-11 h-11 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-600">
              <span className="text-[10px]">No Photo</span>
            </div>
          )}
        </div>

        {/* Shutter Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleCaptureClick}
            disabled={!isStreaming || isCapturing}
            id="shutter-capture-btn"
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 border-4 border-white/80 active:scale-95 transition shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            title="Take Geotagged Photo"
          >
            <div className="w-15 h-15 rounded-full bg-sky-500 group-hover:bg-sky-400 group-active:scale-90 transition-transform flex items-center justify-center shadow-inner">
              <div className="w-4 h-4 rounded-full bg-white/80" />
            </div>
          </button>
        </div>

        {/* Camera Switch Button */}
        <div className="w-12 h-12 flex items-center justify-end">
          <button
            onClick={onSwitchCamera}
            id="switch-camera-btn"
            className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:rotate-180 transition-all duration-300"
            title="Switch front/back camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
