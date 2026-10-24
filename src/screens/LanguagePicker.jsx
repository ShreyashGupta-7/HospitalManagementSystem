import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { LANGS, makeT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { speak, useVoices } from '../lib/speech.js';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';

/** Each language is shown in its own script, with its own heading, so anyone can find theirs. */
export function LanguageButtons({ onPick, current }) {
  const voices = useVoices();
  return (
    <div className="grid gap-3">
      {LANGS.map((l) => {
        const tl = makeT(l.code);
        return (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            aria-pressed={current === l.code}
            onClick={() => {
              if (voices.has(l.code)) speak(tl('lang.title'), l.code);
              onPick(l.code);
            }}
            className={`btn-secondary !justify-start !text-left min-h-btn-lg !text-2xl ${current === l.code ? '!border-primary ring-2 ring-primary' : ''}`}
          >
            <Icon name="globe" size={30} className="text-primary" />
            <span className="flex-1">{l.name}</span>
            {current === l.code ? <Icon name="check" size={28} className="text-primary" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export default function LanguagePicker({ firstVisit = false }) {
  const { settings, update } = useSettings();
  const navigate = useNavigate();
  useScreenSpeech(LANGS.map((l) => makeT(l.code)('lang.title')).join('. '));
  return (
    <div>
      {/* The title is shown in all languages, because we don't know the reader's yet. */}
      <h1 className="h1 mb-1">
        {LANGS.map((l) => (
          <span key={l.code} lang={l.code} className="block">
            {makeT(l.code)('lang.title')}
          </span>
        ))}
      </h1>
      <p className="muted mb-4">{makeT(settings.lang || 'en')('lang.subtitle')}</p>
      <LanguageButtons
        current={settings.lang}
        onPick={(code) => {
          update({ lang: code });
          if (!firstVisit) navigate(-1);
        }}
      />
    </div>
  );
}
