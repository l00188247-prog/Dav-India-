import React, { useState } from 'react';
import { X, Download, Share2, Trash2, Calendar, MapPin, Compass, Info } from 'lucide-react';
import { CapturedPhoto } from '../types';

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: CapturedPhoto[];
  onDeletePhoto: (id: string) => void;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  onDeletePhoto,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(
    photos[0] || null
  );
  const [showMetadata, setShowMetadata] = useState(false);

  if (!isOpen) return null;

  const current = selectedPhoto || photos[0] || null;

  const handleDownload = (photo: CapturedPhoto) => {
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `CAMMETA_${new Date(photo.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async (photo: CapturedPhoto) => {
    try {
      // Convert dataUrl to blob
      const res = await fetch(photo.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'cammeta-photo.jpg', { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'CamMeta Geotagged Photo',
          text: `Captured with CamMeta: Lat ${photo.location?.latitude.toFixed(4)}, Long ${photo.location?.longitude.toFixed(4)}`,
        });
      } else {
        handleDownload(photo);
      }
    } catch {
      handleDownload(photo);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">Captured Photos</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300 font-mono">
              {photos.length} photos
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content View */}
        {photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="h-16 w-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-3 text-slate-500">
              <MapPin className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-slate-300">No stamped photos yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Tap the shutter button in the camera to take your first geotagged metadata photo.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Main Photo Preview */}
            <div className="flex-1 bg-black/90 flex flex-col items-center justify-center p-2 relative overflow-hidden">
              {current && (
                <>
                  <div className="relative max-w-full max-h-[55vh] md:max-h-[75vh] flex items-center justify-center">
                    <img
                      src={current.dataUrl}
                      alt="Captured with metadata"
                      className="max-h-[55vh] md:max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                    />
                  </div>

                  {/* Floating Action Bar */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 z-10 px-4">
                    <button
                      onClick={() => handleDownload(current)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-lg transition active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => handleShare(current)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shadow-lg border border-slate-700 transition active:scale-95"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={() => setShowMetadata(!showMetadata)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                      title="View metadata details"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onDeletePhoto(current.id);
                        setSelectedPhoto(null);
                      }}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar: Thumbnails list & Metadata card */}
            <div className="w-full md:w-72 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col max-h-52 md:max-h-full">
              {/* Metadata inspector accordion */}
              {showMetadata && current && (
                <div className="p-3 bg-slate-900 border-b border-slate-800 text-[11px] space-y-2">
                  <div className="font-semibold text-sky-400 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Embedded Metadata</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(current.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="font-mono">
                      {current.location
                        ? `${current.location.latitude.toFixed(5)}°, ${current.location.longitude.toFixed(5)}°`
                        : 'No GPS data'}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[10px] pl-4">
                    Accuracy: ±{current.location?.accuracy ?? 5}m • Alt: {Math.round(current.location?.altitude ?? 0)}m
                  </div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-3 h-3 text-amber-400" />
                    <span>Heading: {current.location?.heading ?? 'N/A'}°</span>
                  </div>
                </div>
              )}

              {/* Thumbnails grid */}
              <div className="p-3 overflow-y-auto flex-1 grid grid-cols-4 md:grid-cols-2 gap-2">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPhoto(p)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                      selectedPhoto?.id === p.id
                        ? 'border-sky-500 ring-2 ring-sky-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={p.dataUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
