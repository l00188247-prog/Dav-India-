import React from 'react';
import { X, Smartphone, CheckCircle, Download, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface InstallAndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onTriggerInstall: () => Promise<boolean>;
}

export const InstallAndroidModal: React.FC<InstallAndroidModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onTriggerInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Android Instant Installation</h3>
              <p className="text-[11px] text-emerald-400 font-medium">100% Error-Free & Fast</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Main Reassuring Status Card in Hindi & English */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 to-slate-950 border border-emerald-500/30 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white mb-1">
                  Bina Kisi Error Ke Phone Par Install Karein
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Manual APK download karne par aksar <em>"Problem parsing package"</em> ya <em>"App not installed"</em> ka error aa jata hai. Lekin Chrome ka official WebAPK system aapke phone par <strong>5 second me bina kisi error</strong> ke direct install ho jata hai!
                </p>
              </div>
            </div>

            {/* Direct 1-Click Install Button */}
            <div className="mt-4">
              {isInstalled ? (
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>App Already Installed on this Device!</span>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    const success = await onTriggerInstall();
                    if (success) onClose();
                  }}
                  id="modal-direct-install-btn"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Install CamMeta on Android Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200 text-[11px]">Instant 5s Install</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No 100MB download wait</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200 text-[11px]">0 Parse Errors</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Google Play Security clean</p>
              </div>
            </div>
          </div>

          {/* Manual 3-step Instructions */}
          <div className="rounded-2xl bg-slate-950/40 border border-slate-800 p-4 space-y-3">
            <h5 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
              <span>Android Phone me Install Karne ke 3 Aasan Steps:</span>
            </h5>

            <div className="space-y-2.5 text-[11px] text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  1
                </span>
                <p>
                  Upar diye gaye <strong>"Install CamMeta on Android Now"</strong> button par tap karein.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  2
                </span>
                <p>
                  Agar popup na aaye, to Chrome browser ke upar daayein kone me <strong>तीन बिंदु (⋮ Menu)</strong> dabayein.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                  3
                </span>
                <p>
                  Menu me <strong>"Install app"</strong> ya <strong>"Add to Home screen" (होम स्क्रीन में जोड़ें)</strong> par tap karein.
                </p>
              </div>
            </div>
          </div>

          {/* Note about APK compilation */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Android Studio ke liye raw native Kotlin code chahiye?</span>
            <span className="text-sky-400 font-semibold cursor-pointer hover:underline flex items-center gap-0.5">
              Header me "APK Code" dekhein
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
