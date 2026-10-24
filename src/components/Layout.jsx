import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import OfflineBar from './OfflineBar.jsx';
import { useT } from '../lib/i18n.jsx';
import { useReader } from '../lib/screenSpeech.jsx';
import { useSpeaking, stopSpeaking, useVoices } from '../lib/speech.js';
import { useUrgent } from './UrgentHelp.jsx';

function TopButton({ icon, label, onClick, to, pressed }) {
  const cls =
    'flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 min-h-btn min-w-0 flex-1 text-ink hover:bg-soft font-semibold';
  const inner = (
    <>
      <Icon name={icon} size={26} />
      <span className="text-[min(0.8rem,17px)] leading-tight text-center">{label}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={pressed}>
      {inner}
    </button>
  );
}

/** Frame for every patient screen: top bar, offline line, and the Emergency bar at the bottom. */
export default function Layout({ children }) {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const reader = useReader();
  const speaking = useSpeaking();
  const voices = useVoices();
  const { open: openUrgent } = useUrgent();
  const isHome = location.pathname === '/';
  const canListen = voices.has(t.lang);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn-primary">
        {t('nav.skipToContent')}
      </a>
      <header className="no-print sticky top-0 z-30 bg-surface border-b border-line">
        <nav className="max-w-xl mx-auto flex items-stretch gap-1 px-2 py-1" aria-label={t('nav.menu')}>
          {!isHome ? (
            <TopButton icon="back" label={t('common.back')} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} />
          ) : (
            <div className="flex-1 flex items-center gap-2 px-2 min-w-0">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                <Icon name="plus" size={26} strokeWidth={3} />
              </span>
              <span className="font-bold text-lg leading-tight">{t('appName')}</span>
            </div>
          )}
          {!isHome ? <TopButton icon="home" label={t('common.home')} to="/" /> : null}
          {canListen ? (
            <TopButton
              icon={speaking ? 'stop' : 'speaker'}
              label={speaking ? t('common.stop') : t('common.listen')}
              pressed={speaking}
              onClick={() => (speaking ? stopSpeaking() : reader?.readScreen())}
            />
          ) : null}
          <TopButton icon="settings" label={t('common.settings')} to="/settings" />
        </nav>
      </header>
      <OfflineBar />
      <main id="main" tabIndex={-1} className="flex-1 w-full max-w-xl mx-auto px-4 pt-4 pb-safe outline-none">
        {children}
      </main>
      <div className="no-print fixed bottom-0 inset-x-0 z-40 bg-surface/95 border-t-2 border-danger bottom-safe">
        <div className="max-w-xl mx-auto grid grid-cols-2 gap-2 px-2 pt-2">
          <Link to="/emergency" className="btn-danger !px-2 !gap-2" aria-label={`${t('nav.emergency')}: 112, 108`}>
            <Icon name="emergency" size={28} />
            <span>{t('nav.emergency')}</span>
          </Link>
          <button type="button" className="btn !px-2 !gap-2 bg-surface text-danger border-2 border-danger hover:bg-danger-soft" onClick={openUrgent}>
            <Icon name="hand" size={28} />
            <span>{t('nav.urgentHelp')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
