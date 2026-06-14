import React, { useEffect, useState } from 'react';

// Declare standard BeforeInstallPromptEvent type for TypeScript
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user already dismissed it recently in sessionStorage
    if (sessionStorage.getItem('pwa_prompt_dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(90%, 400px)',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      padding: '20px',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 20px 40px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <img src="/img/logomark.png" alt="App Icon" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px', fontFamily: 'var(--font-head)' }}>Install Juara HRIS</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Dapatkan pengalaman akses lebih cepat tanpa buka browser!
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer', padding: '0 4px' }}
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
      <button 
        onClick={handleInstall}
        className="btn btn-primary"
        style={{ width: '100%', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700 }}
      >
        Install Aplikasi
      </button>
    </div>
  );
}
