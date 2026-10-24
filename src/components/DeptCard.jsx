import Icon from './Icon.jsx';
import { useT } from '../lib/i18n.jsx';

/** A picture card for a department, in plain words ("fever, cough, BP, sugar"). */
export default function DeptCard({ dept, selected, onClick, compact = false }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-3 text-left min-h-btn-lg hover:bg-soft ${
        selected ? 'border-primary bg-soft ring-2 ring-primary' : 'border-line bg-surface'
      }`}
    >
      <span
        className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ backgroundColor: dept.colour }}
      >
        <Icon name={dept.icon} size={34} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xl font-bold leading-tight">{t.dept(dept.id)}</span>
        {!compact ? <span className="block text-base text-muted leading-snug">{t.deptHint(dept.id)}</span> : null}
      </span>
      {selected ? <Icon name="check" size={28} className="text-primary" /> : null}
    </button>
  );
}
