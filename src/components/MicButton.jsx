import { useState } from 'react';
import Icon from './Icon.jsx';
import { useT } from '../lib/i18n.jsx';
import { listenOnce, recognitionSupported, stopSpeaking } from '../lib/speech.js';

/** Big microphone button: speak instead of typing. Hidden where the browser can't do it. */
export default function MicButton({ onText, numeric = false }) {
  const t = useT();
  const [state, setState] = useState('idle'); // idle | listening | error
  if (!recognitionSupported()) return null;

  const start = async () => {
    stopSpeaking();
    setState('listening');
    try {
      const heard = await listenOnce(t.lang);
      if (numeric) {
        const digits = heard.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d))).match(/\d+/g);
        if (digits) onText(digits.join(''));
        else throw new Error('no-number');
      } else {
        onText(heard.replace(/[.!?।]+$/, '').trim());
      }
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={state === 'listening'}
        className={`btn w-full min-h-btn-lg text-xl border-2 ${
          state === 'listening' ? 'bg-danger-soft border-danger text-danger pulse' : 'bg-info-soft border-info text-info'
        }`}
        aria-label={t('reg.micLabel')}
      >
        <Icon name="mic" size={34} />
        <span>{state === 'listening' ? t('reg.micListening') : t('reg.mic')}</span>
      </button>
      {state === 'error' ? (
        <p className="mt-2 text-danger font-semibold" role="alert">
          {t('reg.micError')}
        </p>
      ) : null}
    </div>
  );
}
