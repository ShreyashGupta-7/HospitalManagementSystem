import { useT } from '../lib/i18n.jsx';

export default function ProgressBar({ step, total }) {
  const t = useT();
  const text = t('reg.stepOf', { n: step, total });
  return (
    <div className="mb-4">
      <p className="text-lg font-semibold mb-1">{text}</p>
      <div
        className="h-4 w-full rounded-full bg-soft border border-line overflow-hidden"
        role="progressbar"
        aria-label={t('reg.progress')}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-valuetext={text}
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}
