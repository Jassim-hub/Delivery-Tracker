import React, { useState, useEffect } from 'react';
import { pushManager } from '@/lib/push/push-manager';
import { Download, Share, X, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (pushManager.isStandalonePwa()) {
      return;
    }

    const isIos = pushManager.isIos();
    setIsIosDevice(isIos);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    let iosTimer: ReturnType<typeof setTimeout> | null = null;
    if (isIos && !sessionStorage.getItem('dt_ios_prompt_dismissed')) {
      iosTimer = setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIosDevice) {
      sessionStorage.setItem('dt_ios_prompt_dismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-32 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-20 max-w-sm z-40 bg-white/60 backdrop-blur-sm border border-slate-900/10 shadow-sm rounded-2xl p-4 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1"
        aria-label="Dismiss installation prompt"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-accent flex items-center justify-center flex-shrink-0 shadow-sm font-black text-lg">
          DT
        </div>
        <div className="flex-1 pr-4">
          <h4 className="text-xs font-bold text-gray-900 leading-tight">Install Delivery Tracker App</h4>
          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
            Install this PWA on your home screen for live tracking, push alerts, and offline access.
          </p>

          {isIosDevice ? (
            <div className="mt-2.5 p-2 rounded-lg bg-blue-50 text-[10px] text-blue-900 flex items-center gap-1.5 font-medium">
              <span>Tap</span>
              <Share className="w-3.5 h-3.5 text-primary" />
              <span>then</span>
              <span className="font-bold flex items-center gap-0.5">
                <PlusSquare className="w-3.5 h-3.5" /> "Add to Home Screen"
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="accent"
                size="sm"
                onClick={handleInstallClick}
                className="w-full text-xs font-bold py-1.5 h-8"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Install App
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
