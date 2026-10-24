import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import RouteView from '../components/RouteView.jsx';
import { useT, makeT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { PLACES, HELP_DESKS } from '../data/hospital.js';
import { nearestOf } from '../lib/route.js';
import { FromSelect } from './FindPlace.jsx';

/** A big card to show any staff member: where the patient wants to go, in their language and English. */
function StaffCard({ to, onClose }) {
  const t = useT();
  const en = makeT('en');
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface p-5" role="dialog" aria-modal="true" aria-label={t('find.showCard')}>
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <Icon name="compass" size={56} className="mx-auto text-primary" />
        <p className="text-3xl font-black">{t('find.cardTitle')}</p>
        {t.lang !== 'en' ? <p className="text-2xl font-bold text-muted" lang="en">{en('find.cardTitle')}</p> : null}
        <div className="rounded-3xl border-4 border-primary p-5">
          <p className="text-xl text-muted">{t('find.cardTo')}</p>
          <p className="text-4xl font-black mt-1">{t.place(to)}</p>
          <p className="text-2xl mt-1">{t.floor(PLACES[to].floor)}</p>
          {t.lang !== 'en' ? (
            <div lang="en" className="mt-4 border-t-2 border-line pt-4">
              <p className="text-xl text-muted">{en('find.cardTo')}</p>
              <p className="text-4xl font-black mt-1">{en.place(to)}</p>
              <p className="text-2xl mt-1">{en.floor(PLACES[to].floor)}</p>
            </div>
          ) : null}
        </div>
        <button type="button" className="btn-primary min-w-[12rem]" onClick={onClose} autoFocus>
          <Icon name="x" size={26} />
          <span>{t('common.close')}</span>
        </button>
      </div>
    </div>
  );
}

export default function Lost() {
  const t = useT();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const to = PLACES[params.get('to')] ? params.get('to') : 'helpdesk';
  const from = PLACES[params.get('from')] ? params.get('from') : 'entrance';
  const [card, setCard] = useState(false);
  const nearest = nearestOf(from, HELP_DESKS, { avoidStairs: settings.avoidStairs });
  const help = nearest?.id || 'helpdesk';
  useScreenSpeech(`${t('find.lostTitle')}. ${t('find.lostText')} ${t('find.nearestHelp', { place: t.place(help) })}`);

  return (
    <div className="space-y-4">
      <h1 className="h1">{t('find.lostTitle')}</h1>
      <p className="text-lg">{t('find.lostText')}</p>

      <button type="button" className="btn-primary w-full min-h-btn-lg text-xl" onClick={() => setCard(true)}>
        <Icon name="expand" size={30} />
        <span>{t('find.showCard')}</span>
      </button>

      <div className="card">
        <FromSelect value={from} onChange={(v) => setParams({ to, from: v })} />
      </div>

      <h2 className="h2 flex items-center gap-2">
        <Icon name="help" size={28} className="text-primary" />
        {t('find.nearestHelp', { place: t.place(help) })}
      </h2>
      <RouteView from={from} to={help} avoidStairs={settings.avoidStairs} headingLevel={3} />

      {card ? <StaffCard to={to} onClose={() => setCard(false)} /> : null}
    </div>
  );
}
