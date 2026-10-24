import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import TermNote from '../components/TermNote.jsx';
import { useT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { useVisits } from '../store/visits.js';
import { useHospital } from '../store/hooks.js';
import { OPD_HOURS } from '../data/departments.js';
import LanguagePicker from './LanguagePicker.jsx';

function BigButton({ to, icon, label, hint, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary text-on-primary',
    secondary: 'bg-surface text-ink border-2 border-primary',
    danger: 'bg-danger text-on-danger',
  };
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 rounded-3xl p-4 min-h-[6rem] shadow-sm hover:brightness-105 ${tones[tone]}`}
    >
      <span className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${tone === 'secondary' ? 'bg-soft text-primary' : 'bg-white/15'}`}>
        <Icon name={icon} size={40} />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold leading-tight">{label}</span>
        <span className="block text-base opacity-95 leading-snug">{hint}</span>
      </span>
    </Link>
  );
}

export default function Home() {
  const t = useT();
  const { settings } = useSettings();
  const visits = useVisits();
  const { hospital } = useHospital();
  const current = visits[0];
  useScreenSpeech(
    settings.lang
      ? `${t('home.welcome')} ${t('home.intro')} ${t('home.register')}. ${t('home.haveSlip')}. ${t('home.findPlace')}. ${t('home.emergency')}.`
      : '',
  );

  // First visit: ask for a language before anything else.
  if (!settings.lang) return <LanguagePicker firstVisit />;

  const live = current?.token ? hospital.patients[current.token] : null;
  const showCurrent = current && (current.pending || !live || ['waiting', 'called'].includes(live.status));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="h1">{t('home.welcome')}</h1>
        <p className="text-lg mt-1">{t('tagline')}</p>
      </div>

      {showCurrent ? (
        <Link
          to={current.pending ? `/pending/${current.ref}` : `/turn/${current.token}`}
          className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-soft p-3"
        >
          <Icon name="ticket" size={34} className="text-primary" />
          <span className="flex-1 min-w-0">
            <span className="block text-base text-muted">{t('home.yourToken')}</span>
            <span className="block text-2xl font-extrabold tracking-wide">{current.pending ? t('slip.pendingTitle') : current.token}</span>
          </span>
          <span className="btn-primary btn-sm">
            {t('home.seeTurn')} <Icon name="forward" size={20} />
          </span>
        </Link>
      ) : null}

      <nav className="grid gap-3" aria-label={t('nav.menu')}>
        <BigButton to="/register" icon="clipboard" label={t('home.register')} hint={t('home.registerHint')} />
        <BigButton to="/have-slip" icon="ticket" label={t('home.haveSlip')} hint={t('home.haveSlipHint')} tone="secondary" />
        <BigButton to="/find" icon="map" label={t('home.findPlace')} hint={t('home.findPlaceHint')} tone="secondary" />
        <BigButton to="/emergency" icon="emergency" label={t('home.emergency')} hint={t('home.emergencyHint')} tone="danger" />
      </nav>

      <TermNote id="opd" />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <p className="text-base text-muted flex items-center gap-2">
          <Icon name="clock" size={22} /> {t('home.hours', OPD_HOURS)}
        </p>
        <Link to="/language" className="btn-ghost btn-sm">
          <Icon name="globe" size={22} />
          <span>{t('lang.current')}: {t('langName')}</span>
        </Link>
      </div>
      <p className="text-center pt-2">
        <Link to="/staff" className="text-base text-muted underline underline-offset-4">
          {t('home.staffLink')}
        </Link>
      </p>
    </div>
  );
}
