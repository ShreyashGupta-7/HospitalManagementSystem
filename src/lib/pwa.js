// Service worker (offline cache) and the "Install app" prompt.
import { useEffect, useState } from 'react';

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function registerPWA() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    // Keep the browser's prompt so Settings can show our own "Install app" button.
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    import('virtual:pwa-register')
      .then(({ registerSW }) => registerSW({ immediate: true }))
      .catch(() => {});
  }
}

export function isInstalled() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
}

/** { canInstall, install, installed } — canInstall is true only when the browser offers it. */
export function useInstall() {
  const [, setN] = useState(0);
  useEffect(() => {
    const fn = () => setN((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return {
    canInstall: Boolean(deferredPrompt),
    installed: isInstalled(),
    install: async () => {
      if (!deferredPrompt) return false;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
      notify();
      return choice?.outcome === 'accepted';
    },
  };
}

/** Shows a system notification (through the service worker on Android, where it is required). */
export async function showNotification(title, body, tag) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) {
      await reg.showNotification(title, { body, tag, renotify: true, icon: '/icon-192.png', badge: '/icon-192.png', vibrate: [300, 100, 300] });
      return true;
    }
    // eslint-disable-next-line no-new
    new Notification(title, { body, tag });
    return true;
  } catch {
    return false;
  }
}
