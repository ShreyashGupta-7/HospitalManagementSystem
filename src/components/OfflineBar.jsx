import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { useT } from '../lib/i18n.jsx';
import { useHospital, useNow } from '../store/hooks.js';

export function agoText(t, ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return t('conn.agoNow');
  if (s < 60) return t('conn.agoSec', { n: s });
  const m = Math.round(s / 60);
  return m === 1 ? t('conn.agoMinOne') : t('conn.agoMin', { n: m });
}

/** One line, only when the server connection is lost: the queue may be out of date. */
export default function OfflineBar() {
  const t = useT();
  const { conn } = useHospital();
  const now = useNow(5000);
  const [justBack, setJustBack] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (conn.mode !== 'server') return undefined;
    if (conn.status === 'offline') wasOffline.current = true;
    if (conn.status === 'online' && wasOffline.current) {
      wasOffline.current = false;
      setJustBack(true);
      const id = setTimeout(() => setJustBack(false), 4000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [conn.status, conn.mode]);

  if (conn.mode !== 'server') return null;
  if (conn.status === 'online' && justBack) {
    return (
      <p role="status" className="no-print bg-ok-soft text-ok font-semibold px-4 py-2 text-base flex items-center gap-2">
        <Icon name="wifi" size={22} /> {t('conn.back')}
      </p>
    );
  }
  if (conn.status !== 'offline') return null;
  const ago = conn.lastSync && now ? agoText(t, Date.now() - conn.lastSync) : '—';
  return (
    <div role="status" className="no-print bg-warn-soft text-ink px-4 py-2 text-base">
      <p className="flex items-start gap-2 max-w-xl mx-auto">
        <Icon name="wifiOff" size={22} className="mt-0.5 text-warn" />
        <span>{t('conn.staleLine', { ago })}</span>
      </p>
      {conn.outbox ? <p className="max-w-xl mx-auto pl-8 text-muted">{t('conn.pendingSend', { n: conn.outbox })}</p> : null}
    </div>
  );
}
