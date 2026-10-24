import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import RouteView from '../components/RouteView.jsx';
import TermNote from '../components/TermNote.jsx';
import { useT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { useUrgent } from '../components/UrgentHelp.jsx';
import { EmergencySigns } from './Register.jsx';
import { FromSelect } from './FindPlace.jsx';

/**
 * Emergency: works before registration and never asks for a token. It tells the person
 * to go to Casualty now or tell any staff member, and shows 112 and 108.
 */
export default function Emergency() {
  const t = useT();
  const { settings } = useSettings();
  const { open } = useUrgent();
  const [from, setFrom] = useState('entrance');
  useScreenSpeech(t('emergency.readText'));

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-danger text-on-danger p-5" role="alert">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Icon name="emergency" size={44} />
          {t('emergency.goNow')}
        </h1>
        <p className="text-xl mt-3 font-semibold">{t('emergency.where')}</p>
        <p className="text-xl mt-2">{t('emergency.tellStaff')}</p>
      </section>

      <TermNote id="casualty" />

      <section aria-label={t('emergency.call')} className="grid grid-cols-2 gap-3">
        <a href="tel:112" className="btn-danger min-h-btn-lg flex-col !gap-1 !py-3">
          <span className="flex items-center gap-2 text-3xl font-black">
            <Icon name="phone" size={30} /> 112
          </span>
          <span className="text-base">{t('emergency.call112Hint')}</span>
        </a>
        <a href="tel:108" className="btn-danger min-h-btn-lg flex-col !gap-1 !py-3">
          <span className="flex items-center gap-2 text-3xl font-black">
            <Icon name="phone" size={30} /> 108
          </span>
          <span className="text-base">{t('emergency.call108Hint')}</span>
        </a>
      </section>

      <button type="button" className="btn w-full min-h-btn-lg text-xl bg-surface text-danger border-2 border-danger" onClick={open}>
        <Icon name="hand" size={30} />
        <span>{t('nav.urgentHelp')}</span>
      </button>

      <p className="card text-lg font-semibold flex gap-2 items-start">
        <Icon name="check" size={26} className="text-ok mt-0.5" />
        <span>{t('emergency.noToken')}</span>
      </p>

      <section>
        <h2 className="h2 mb-2">{t('emergency.route')}</h2>
        <div className="card mb-3">
          <FromSelect value={from} onChange={setFrom} />
        </div>
        <RouteView from={from} to="emergency" avoidStairs={settings.avoidStairs} headingLevel={3} />
      </section>

      <section>
        <h2 className="h2 mb-2">{t('emergency.signsTitle')}</h2>
        <EmergencySigns compact />
      </section>

      <p className="text-base text-muted">{t('emergency.staffAssess')}</p>
    </div>
  );
}
