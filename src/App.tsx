import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CameraViewfinder } from './components/CameraViewfinder';
import { WatermarkSettingsModal } from './components/WatermarkSettingsModal';
import { PhotoGalleryModal } from './components/PhotoGalleryModal';
import { InstallAndroidModal } from './components/InstallAndroidModal';
import { AndroidApkSourceModal } from './components/AndroidApkSourceModal';
import { useCamera } from './hooks/useCamera';
import { useGeolocation } from './hooks/useGeolocation';
import { usePWAInstall } from './hooks/usePWAInstall';
import { CapturedPhoto, StampSettings } from './types';

const INITIAL_STAMP_SETTINGS: StampSettings = {
  showDateTime: true,
  showCoordinates: true,
  showAddress: true,
  showAltitude: true,
  showAccuracy: true,
  showCustomNote: true,
  customNote: 'Site Audit Inspection',
  projectName: 'CamMeta Project',
  style: 'standard',
  position: 'bottom-left',
  dateFormat: 'locale',
  coordinatesFormat: 'decimal',
  fontSize: 'medium',
  stampBackgroundOpacity: 0.85,
};

export default function App() {
  const {
    videoRef,
    isStreaming,
    cameraError,
    switchCamera,
    hasTorch,
    torchOn,
    toggleTorch,
    aspectRatio,
    setAspectRatio,
    showGrid,
    setShowGrid,
    capturePhoto,
    restartCamera,
  } = useCamera();

  const { location, refreshLocation } = useGeolocation();
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  const [stampSettings, setStampSettings] = useState<StampSettings>(() => {
    const saved = localStorage.getItem('cammeta_stamp_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STAMP_SETTINGS;
      }
    }
    return INITIAL_STAMP_SETTINGS;
  });

  const [photos, setPhotos] = useState<CapturedPhoto[]>(() => {
    const saved = localStorage.getItem('cammeta_captured_photos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [showSourceCode, setShowSourceCode] = useState(false);

  // Save settings
  const handleUpdateSettings = (newSettings: StampSettings) => {
    setStampSettings(newSettings);
    localStorage.setItem('cammeta_stamp_settings', JSON.stringify(newSettings));
  };

  // Save photos
  useEffect(() => {
    try {
      // Keep up to 20 photos in localStorage to prevent quota overflow
      const trimmed = photos.slice(0, 20);
      localStorage.setItem('cammeta_captured_photos', JSON.stringify(trimmed));
    } catch (e) {
      console.warn('LocalStorage save photo error:', e);
    }
  }, [photos]);

  const handleCapture = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      const dataUrl = await capturePhoto(location, stampSettings);
      if (dataUrl) {
        const newPhoto: CapturedPhoto = {
          id: `photo_${Date.now()}`,
          dataUrl,
          timestamp: Date.now(),
          location,
          settingsSnapshot: stampSettings,
          width: 1600,
          height: 1200,
        };
        setPhotos((prev) => [newPhoto, ...prev]);
      }
    } catch (err) {
      console.error('Photo capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [capturePhoto, isCapturing, location, stampSettings]);

  // Stamp photo uploaded from device file picker
  const handleUploadPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);

        // Simple stamp simulation for imported image
        const scale = Math.max(canvas.width, canvas.height) / 1200;
        const cardHeight = 145 * scale;
        const paddingX = 24 * scale;
        const badgeWidth = Math.min(canvas.width * 0.94, 600 * scale);
        const posX = paddingX;
        const posY = canvas.height - cardHeight - paddingX;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(posX, posY, badgeWidth, cardHeight);

        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(posX, posY, badgeWidth, 4 * scale);

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${15 * scale}px sans-serif`;
        ctx.fillText('CAMMETA GPS CAMERA', posX + 20 * scale, posY + 30 * scale);

        ctx.fillStyle = '#94a3b8';
        ctx.font = `${12 * scale}px sans-serif`;
        ctx.fillText(new Date().toLocaleString(), posX + 20 * scale, posY + 54 * scale);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${13 * scale}px sans-serif`;
        const lat = location?.latitude ?? 28.6139;
        const lng = location?.longitude ?? 77.2090;
        ctx.fillText(`Lat: ${lat.toFixed(5)}° | Long: ${lng.toFixed(5)}°`, posX + 20 * scale, posY + 78 * scale);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = `${12 * scale}px sans-serif`;
        ctx.fillText(location?.address || 'Current Location', posX + 20 * scale, posY + 102 * scale);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const newPhoto: CapturedPhoto = {
          id: `photo_${Date.now()}`,
          dataUrl,
          timestamp: Date.now(),
          location,
          settingsSnapshot: stampSettings,
          width: canvas.width,
          height: canvas.height,
        };
        setPhotos((prev) => [newPhoto, ...prev]);
        setShowGallery(true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        location={location}
        onOpenSettings={() => setShowSettings(true)}
        onOpenGallery={() => setShowGallery(true)}
        onOpenInstall={() => setShowInstall(true)}
        onOpenSourceCode={() => setShowSourceCode(true)}
        photosCount={photos.length}
        isInstallable={isInstallable}
      />

      {/* Main Viewfinder Screen */}
      <main className="flex-1 flex flex-col">
        <CameraViewfinder
          videoRef={videoRef}
          isStreaming={isStreaming}
          cameraError={cameraError}
          onSwitchCamera={switchCamera}
          hasTorch={hasTorch}
          torchOn={torchOn}
          onToggleTorch={toggleTorch}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onCapture={handleCapture}
          onRestartCamera={restartCamera}
          onUploadPhoto={handleUploadPhoto}
          location={location}
          stampSettings={stampSettings}
          lastPhoto={photos[0] || null}
          onOpenGallery={() => setShowGallery(true)}
          isCapturing={isCapturing}
        />
      </main>

      {/* Watermark Settings Modal */}
      <WatermarkSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={stampSettings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        photos={photos}
        onDeletePhoto={handleDeletePhoto}
      />

      {/* Install on Android (PWA) Modal */}
      <InstallAndroidModal
        isOpen={showInstall}
        onClose={() => setShowInstall(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onTriggerInstall={triggerInstall}
      />

      {/* Android Studio Native APK Source Code Modal */}
      <AndroidApkSourceModal
        isOpen={showSourceCode}
        onClose={() => setShowSourceCode(false)}
      />
    </div>
  );
}
