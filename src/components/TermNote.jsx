import { useEffect } from 'react';
import Icon from './Icon.jsx';
import { useT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';

/** Explains a word like OPD, token or Casualty in one line, the first time it appears. */
export default function TermNote({ id, always = false }) {
  const t = useT();
  const { settings, markTerm } = useSettings();
  const seen = settings.seenTerms.includes(id);
  // Mark as seen when the screen closes, so it still shows on this visit.
  useEffect(() => () => markTerm(id), [id, markTerm]);
  if (seen && !always) return null;
  return (
    <p className="flex gap-2 items-start rounded-xl bg-info-soft text-ink px-3 py-2 text-base leading-snug">
      <Icon name="help" size={22} className="text-info mt-0.5" />
      <span>{t(`terms.${id}`)}</span>
    </p>
  );
}
