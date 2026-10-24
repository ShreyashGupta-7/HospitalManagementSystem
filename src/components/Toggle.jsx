// A big on/off switch with a word, not just a colour.
export default function Toggle({ checked, onChange, label, hint, icon = null, id }) {
  const hid = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex items-center gap-3 py-2">
      {icon}
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="block text-lg font-semibold leading-snug cursor-pointer">
          {label}
        </label>
        {hint ? (
          <p id={hid} className="text-base text-muted leading-snug">
            {hint}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hid}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex min-h-btn min-w-[6.5rem] shrink-0 items-center rounded-full border-2 px-1 font-bold transition-colors ${
          checked ? 'bg-primary border-primary text-on-primary' : 'bg-soft border-line text-ink'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1/2 -translate-y-1/2 h-[2.4rem] w-[2.4rem] rounded-full bg-surface border-2 border-line transition-all ${
            checked ? 'right-1' : 'left-1'
          }`}
        />
        <span className={`w-full text-base ${checked ? 'pr-12 pl-2 text-left' : 'pl-12 pr-2 text-right'}`}>
          {checked ? <OnOff on /> : <OnOff />}
        </span>
      </button>
    </div>
  );
}

import { useT } from '../lib/i18n.jsx';
function OnOff({ on }) {
  const t = useT();
  return on ? t('common.on') : t('common.off');
}
