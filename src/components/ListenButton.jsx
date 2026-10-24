import Icon from './Icon.jsx';
import { useT } from '../lib/i18n.jsx';
import { speak, speakParts, stopSpeaking, useSpeaking, useVoices } from '../lib/speech.js';

/**
 * A "Listen" button. Hidden when the phone has no voice for the current language.
 * Pass `text` (string) or `parts` ([{ text, lang }]).
 */
export default function ListenButton({ text, parts, label, className = 'btn-secondary', size = 26, compact = false }) {
  const t = useT();
  const voices = useVoices();
  const speaking = useSpeaking();
  if (!voices.has(t.lang)) return null;
  const onClick = () => {
    if (speaking) {
      stopSpeaking();
      return;
    }
    if (parts) speakParts(parts);
    else speak(typeof text === 'function' ? text() : text, t.lang);
  };
  const word = speaking ? t('common.stop') : label || t('common.listen');
  return (
    <button type="button" className={className} onClick={onClick} aria-pressed={speaking}>
      <Icon name={speaking ? 'stop' : 'speaker'} size={size} />
      {compact ? <span className="sr-only">{word}</span> : <span>{word}</span>}
    </button>
  );
}
