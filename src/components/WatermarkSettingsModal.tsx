import React from 'react';
import { X, Check, Sliders, Type, MapPin } from 'lucide-react';
import { StampSettings, StampStyle, StampPosition } from '../types';

interface WatermarkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StampSettings;
  onUpdateSettings: (newSettings: StampSettings) => void;
}

export const WatermarkSettingsModal: React.FC<WatermarkSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const styles: { id: StampStyle; title: string; desc: string }[] = [
    { id: 'standard', title: 'Standard GPS Badge', desc: 'Classic dark card with coordinates & date' },
    { id: 'survey', title: 'Field Survey Stamp', desc: 'Project audit tag with amber border' },
    { id: 'minimal', title: 'Minimal Footer Bar', desc: 'Single clean line at bottom' },
    { id: 'technical', title: 'Technical HUD', desc: 'High-precision coordinate grid' },
  ];

  const positions: { id: StampPosition; title: string }[] = [
    { id: 'bottom-left', title: 'Bottom Left' },
    { id: 'bottom-right', title: 'Bottom Right' },
    { id: 'bottom-banner', title: 'Full Bottom Banner' },
    { id: 'top-left', title: 'Top Left' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">Watermark & Stamp Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Stamp Style Selection */}
          <div>
            <label className="block font-medium text-slate-300 mb-2">
              Stamp Design Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onUpdateSettings({ ...settings, style: s.id })}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    settings.style === s.id
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs mb-1">
                    <span>{s.title}</span>
                    {settings.style === s.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Stamp Position */}
          <div>
            <label className="block font-medium text-slate-300 mb-2">
              Stamp Position on Photo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onUpdateSettings({ ...settings, position: p.id })}
                  className={`py-2 px-3 rounded-lg text-left border text-xs transition ${
                    settings.position === p.id
                      ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-semibold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Format */}
          <div>
            <label className="block font-medium text-slate-300 mb-2">
              Coordinates Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ ...settings, coordinatesFormat: 'decimal' })}
                className={`py-2 px-3 rounded-lg text-center border transition ${
                  settings.coordinatesFormat === 'decimal'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
                }`}
              >
                Decimal (28.6139° N)
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, coordinatesFormat: 'dms' })}
                className={`py-2 px-3 rounded-lg text-center border transition ${
                  settings.coordinatesFormat === 'dms'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
                }`}
              >
                DMS (28°36'50" N)
              </button>
            </div>
          </div>

          {/* Project Name (For Field Survey) */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              Project / Survey Name
            </label>
            <input
              type="text"
              value={settings.projectName}
              onChange={(e) => onUpdateSettings({ ...settings, projectName: e.target.value })}
              placeholder="e.g., Road Construction Survey 2026"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          {/* Custom Note */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Custom Watermark Note / Tag
            </label>
            <input
              type="text"
              value={settings.customNote}
              onChange={(e) => onUpdateSettings({ ...settings, customNote: e.target.value })}
              placeholder="e.g., Site A Inspection - Gate 4"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          {/* Opacity slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-slate-300">Stamp Background Darkness</span>
              <span className="text-slate-400 font-mono">
                {Math.round(settings.stampBackgroundOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="0.95"
              step="0.05"
              value={settings.stampBackgroundOpacity}
              onChange={(e) =>
                onUpdateSettings({ ...settings, stampBackgroundOpacity: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
