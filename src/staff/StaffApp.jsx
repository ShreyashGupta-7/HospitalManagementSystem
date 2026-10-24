import { useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useT, LANGS } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useHospital, useSimNow } from '../store/hooks.js';
import { staffLogin, staffLogout } from '../store/store.js';
import { fmtClock } from '../../shared/engine.js';
import Dashboard from './Dashboard.jsx';
import Counter from './Counter.jsx';

function PinGate() {
  const t = useT();
  const { conn } = useHospital();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ok = await staffLogin(pin);
      if (!ok) setError(t('staff.pinWrong'));
    } catch {
      setError(t('errors.offlineAction'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main" className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4" noValidate>
        <h1 className="h1 flex items-center gap-2">
          <Icon name="lock" size={30} className="text-primary" /> <span>{t('staff.pinTitle')}</span>
        </h1>
        <p className="text-lg">{t('staff.pinText')}</p>
        <div>
          <label htmlFor="pin" className="label">{t('staff.pinLabel')}</label>
          <input
            id="pin"
            className="input text-3xl tracking-[0.5em] text-center"
            inputMode="numeric"
            type="password"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            aria-describedby="pin-hint pin-error"
            autoFocus
          />
          <p id="pin-hint" className="text-base text-muted mt-1">{t('staff.pinHint')}</p>
        </div>
        {error ? <p id="pin-error" className="text-danger font-semibold" role="alert">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy || !pin || (conn.mode === 'server' && conn.status !== 'online')}>
          <Icon name="lock" size={24} />
          <span>{t('staff.unlock')}</span>
        </button>
        <p className="text-base text-muted">{t('staff.loginNote')}</p>
        <Link to="/" className="btn-ghost w-full">
          <Icon name="home" size={24} />
          <span>{t('staff.openPatient')}</span>
        </Link>
      </form>
    </main>
  );
}

function StaffHeader() {
  const t = useT();
  const { conn } = useHospital();
  const { settings, update } = useSettings();
  const now = useSimNow(1000);
  const tab = ({ isActive }) =>
    `btn-sm btn ${isActive ? 'bg-primary text-on-primary' : 'bg-surface text-ink border-2 border-line hover:bg-soft'}`;
  return (
    <header className="bg-surface border-b border-line sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 py-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
          <Icon name="plus" size={26} strokeWidth={3} />
        </span>
        <div className="mr-auto min-w-0">
          <p className="font-bold text-lg leading-tight">{t('appName')} · {t('staff.title')}</p>
          <p className="text-base text-muted leading-tight flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1"><Icon name="clock" size={18} /> {t('staff.clock')}: <b className="text-ink">{fmtClock(now)}</b></span>
            <span className={`pill !py-0 !px-2 border ${conn.mode === 'server' ? (conn.status === 'online' ? 'border-ok text-ok' : 'border-warn text-warn') : 'border-info text-info'}`}>
              <Icon name={conn.status === 'offline' ? 'wifiOff' : 'wifi'} size={16} />
              {conn.mode === 'server' ? (conn.status === 'online' ? t('conn.live') : t('conn.offline')) : t('conn.local')}
            </span>
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label={t('nav.menu')}>
          <NavLink end to="/staff" className={tab}>
            <Icon name="users" size={20} /> {t('staff.tabs.dashboard')}
          </NavLink>
          <NavLink to="/staff/counter" className={tab}>
            <Icon name="clipboard" size={20} /> {t('staff.tabs.counter')}
          </NavLink>
          <a href="/board" target="_blank" rel="noreferrer" className={tab({ isActive: false })}>
            <Icon name="tv" size={20} /> {t('staff.tabs.board')}
          </a>
          <select
            aria-label={t('settings.language')}
            className="rounded-xl border-2 border-line bg-surface px-2 text-base min-h-[2.75rem]"
            value={settings.lang || 'en'}
            onChange={(e) => update({ lang: e.target.value })}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <button type="button" className="btn-sm btn bg-surface text-ink border-2 border-line" onClick={staffLogout}>
            <Icon name="lock" size={20} /> {t('staff.lock')}
          </button>
        </nav>
      </div>
      <p className="bg-info-soft text-ink text-base px-3 py-1 text-center">{t('staff.loginNote')}</p>
    </header>
  );
}

export default function StaffApp({ counter = false }) {
  const { conn } = useHospital();
  if (!conn.isStaff) return <PinGate />;
  return (
    <div className="min-h-screen">
      <StaffHeader />
      <main id="main" className="max-w-7xl mx-auto px-3 py-4">
        {counter ? (
          <Counter />
        ) : (
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="counter" element={<Counter />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
