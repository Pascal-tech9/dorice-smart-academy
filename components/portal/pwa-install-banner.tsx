'use client';

import * as React from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PWA Install Banner — shown to Android users who can install the app.
 * Uses the beforeinstallprompt API (Chrome/Android).
 * Dismissed state persists in sessionStorage so it doesn't re-appear on refresh.
 */
export function PwaInstallBanner() {
  const [showBanner, setShowBanner] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="banner"
      aria-label="Install Dorice SA app"
      className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
    >
      <div className="bg-primary text-primary-fg rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-fluid-sm leading-tight">Install Dorice SA</div>
          <div className="text-fluid-xs text-primary-fg/70 mt-0.5 leading-snug">
            Add to your home screen for quick access to fees and report cards.
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="accent"
              onClick={handleInstall}
              className="text-fluid-xs h-8 px-4"
            >
              Install
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-fluid-xs h-8 px-3 text-primary-fg/70 hover:text-primary-fg"
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="shrink-0 text-primary-fg/50 hover:text-primary-fg transition-colors p-1 -mt-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
