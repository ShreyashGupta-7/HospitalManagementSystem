import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import Toggle from '../components/Toggle.jsx';
import { LanguageButtons } from './LanguagePicker.jsx';
import { useT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { useVoices } from '../lib/speech.js';
import { useInstall } from '../lib/pwa.js';
import { forgetVisits } from '../store/visits.js';
import { useHospital } from '../store/hooks.js';

export default function Settings() {
  const t = useT();
  const { settings, update, setAssisted } = useSettings();
  const voices = useVoices();
  const { canInstall, installed, install } = useInstall();
  const { conn } = useHospital();
  const [forgot, setForgot] = useState(false);
  useScreenSpeech(`${t('settings.title')}. ${t('settings.language')}. ${t('settings.textSize')}. ${t('settings.contrast')}. ${t('settings.readAloud')}. ${t('settings.avoidStairs')}.`);
  const sizes = t.raw('settings.sizes') || [];

  return (
    <div className="space-y-5">
      <h1 className="h1">{t('settings.title')}</h1>

      <section aria-labelledby="s-lang">
        <h2 id="s-lang" className="h2 mb-2 flex items-center gap-2">
          <Icon name="globe" size={26} className="text-primary" /> {t('settings.language')}
        </h2>
        <LanguageButtons current={settings.lang} onPick={(code) => update({ lang: code })} />
        {!voices.has(t.lang) ? <p className="mt-2 text-base text-muted">{t('settings.noVoice')}</p> : null}
      </section>

      <section aria-labelledby="s-size">
        <h2 id="s-size" className="h2 mb-2 flex items-center gap-2">
          <Icon name="text" size={26} className="text-primary" /> {t('settings.textSize')}
        </h2>
        <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="s-size">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={settings.textSize === n}
              onClick={() => update({ textSize: n })}
              disabled={settings.assisted}
              className={`btn-secondary !px-1 flex-col !gap-0 ${settings.textSize === n ? '!border-primary ring-2 ring-primary !bg-soft' : ''}`}
            >
              <span aria-hidden="true" className="font-black leading-none" style={{ fontSize: `${1 + n * 0.35}rem` }}>
                A
              </span>
              <span className="text-base">{sizes[n - 1]}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-base text-muted">{t('settings.sample')}</p>
      </section>

      <section className="card !py-1 divide-y divide-line">
        <Toggle
          id="s-contrast"
          checked={settings.highContrast}
          onChange={(v) => update({ highContrast: v })}
          label={t('settings.contrast')}
          hint={t('settings.contrastHint')}
          icon={<Icon name="contrast" size={28} className="text-primary" />}
        />
        {voices.has(t.lang) ? (
          <Toggle
            id="s-read"
            checked={settings.readAloud}
            onChange={(v) => update({ readAloud: v })}
            label={t('settings.readAloud')}
            hint={t('settings.readAloudHint')}
            icon={<Icon name="speaker" size={28} className="text-primary" />}
          />
        ) : null}
        <Toggle
          id="s-stairs"
          checked={settings.avoidStairs}
          onChange={(v) => update({ avoidStairs: v })}
          label={t('settings.avoidStairs')}
          hint={t('settings.avoidStairsHint')}
          icon={<Icon name="wheelchair" size={28} className="text-primary" />}
        />
        <Toggle
          id="s-assisted"
          checked={settings.assisted}
          onChange={setAssisted}
          label={t('settings.assisted')}
          hint={t('settings.assistedHint')}
          icon={<Icon name="users" size={28} className="text-primary" />}
        />
      </section>

      {canInstall || installed ? (
        <section className="card">
          {installed ? (
            <p className="text-lg text-ok font-semibold flex items-center gap-2">
              <Icon name="check" size={24} /> {t('settings.installed')}
            </p>
          ) : (
            <>
              <button type="button" className="btn-primary w-full" onClick={install}>
                <Icon name="install" size={28} />
                <span>{t('settings.install')}</span>
              </button>
              <p className="text-base text-muted mt-2">{t('settings.installHint')}</p>
            </>
          )}
        </section>
      ) : null}

      <section className="card space-y-2">
        <h2 className="h2">{t('settings.about')}</h2>
        <p className="text-base">{t('settings.aboutText')}</p>
        <p className="text-base text-muted flex items-center gap-2">
          <Icon name={conn.status === 'offline' ? 'wifiOff' : 'wifi'} size={22} />
          {t('settings.connection')}:{' '}
          {conn.mode === 'local' ? t('conn.local') : conn.status === 'online' ? t('conn.live') : conn.status === 'offline' ? t('conn.offline') : t('conn.connecting')}
        </p>
        <button
          type="button"
          className="btn-secondary btn-sm w-full"
          onClick={() => {
            forgetVisits();
            setForgot(true);
          }}
        >
          <Icon name="x" size={22} />
          <span>{t('settings.reset')}</span>
        </button>
        {forgot ? <p className="text-ok font-semibold" role="status">{t('settings.resetDone')}</p> : null}
      </section>
    </div>
  );
}
