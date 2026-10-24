import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Toggle from '../components/Toggle.jsx';
import MicButton from '../components/MicButton.jsx';
import DeptCard from '../components/DeptCard.jsx';
import TermNote from '../components/TermNote.jsx';
import { useT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { sessionLoad, sessionSave } from '../lib/storage.js';
import { DEPARTMENTS } from '../data/departments.js';
import { dispatch } from '../store/store.js';
import { addVisit } from '../store/visits.js';

const DRAFT_KEY = 'opd.reg.draft';
const TOTAL = 5;
const EMPTY = { name: '', age: '', gender: '', mobile: '', dept: '' };

export const SIGNS = [
  { id: 'chest', icon: 'heart' },
  { id: 'breathing', icon: 'alert' },
  { id: 'bleeding', icon: 'water' },
  { id: 'fainting', icon: 'bed' },
  { id: 'stroke', icon: 'user' },
  { id: 'injury', icon: 'bone' },
  { id: 'pregnancy', icon: 'mother' },
  { id: 'child', icon: 'child' },
];

export function EmergencySigns({ compact = false }) {
  const t = useT();
  return (
    <ul className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
      {SIGNS.map((s) => (
        <li key={s.id} className="flex items-center gap-3 rounded-xl bg-danger-soft px-3 py-2 text-lg font-semibold">
          <Icon name={s.icon} size={26} className="text-danger" />
          <span>{t(`reg.signs.${s.id}`)}</span>
        </li>
      ))}
    </ul>
  );
}

function AssistedSwitch() {
  const t = useT();
  const { settings, setAssisted } = useSettings();
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 mb-4">
      <Toggle
        id="assisted"
        checked={settings.assisted}
        onChange={setAssisted}
        label={t('reg.assisted')}
        hint={settings.assisted ? t('reg.helperNote') : t('reg.assistedHint')}
        icon={<Icon name="users" size={30} className="text-primary" />}
      />
    </div>
  );
}

function NextButton({ onClick, disabled, label }) {
  const t = useT();
  return (
    <button type="submit" onClick={onClick} disabled={disabled} className="btn-primary w-full min-h-btn-lg text-xl mt-6">
      <span>{label || t('common.next')}</span>
      <Icon name="forward" size={28} />
    </button>
  );
}

export default function Register() {
  const t = useT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const step = Math.min(6, Math.max(0, Number(params.get('step') || 0)));
  const [form, setForm] = useState(() => ({ ...EMPTY, ...sessionLoad(DRAFT_KEY, {}) }));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    sessionSave(DRAFT_KEY, form);
  }, [form]);
  useEffect(() => {
    setError(null);
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [step]);

  // Each step pushes a history entry, so the phone's Back button goes to the previous
  // question and every answer is kept.
  const go = (n) => setParams({ step: String(n) });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const questions = {
    0: `${t('reg.beforeTitle')}. ${t('reg.beforeIntro')} ${Object.values(t.raw('reg.signs')).join('. ')}. ${t('reg.anyOfThese')}`,
    1: `${t('reg.nameQ')} ${t('reg.nameHint')}`,
    2: `${t('reg.ageQ')} ${t('reg.ageHint')}`,
    3: `${t('reg.genderQ')} ${t('reg.female')}, ${t('reg.male')}, ${t('reg.other')}.`,
    4: `${t('reg.mobileQ')}. ${t('reg.mobileHint')}`,
    5: `${t('reg.deptQ')} ${DEPARTMENTS.map((d) => `${t.dept(d.id)}: ${t.deptHint(d.id)}`).join('. ')}. ${t('reg.notSure')}.`,
    6: t('reg.confirmTitle'),
  };
  useScreenSpeech(questions[step]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await dispatch({
        type: 'register',
        dept: form.dept,
        firstName: form.name.trim().split(/\s+/)[0],
        age: Number(form.age),
        gender: form.gender,
        mobile: form.mobile || null,
        lang: t.lang,
      });
      const firstName = form.name.trim().split(/\s+/)[0];
      if (res?.pending) {
        addVisit({ ref: res.clientRef, token: null, pending: true, firstName, dept: form.dept, lang: t.lang, mobile: form.mobile || null });
        sessionSave(DRAFT_KEY, EMPTY);
        navigate(`/pending/${res.clientRef}`, { replace: true });
      } else {
        addVisit({ ref: res.token, token: res.token, pending: false, firstName, dept: form.dept, lang: t.lang, mobile: form.mobile || null });
        sessionSave(DRAFT_KEY, EMPTY);
        navigate(`/slip/${res.token}`, { replace: true });
      }
    } catch {
      setError(t('reg.error'));
      setSubmitting(false);
    }
  };

  // ---------- step 0: signs that need care right away ----------
  if (step === 0) {
    return (
      <div>
        <h1 className="h1 mb-2">{t('reg.beforeTitle')}</h1>
        <p className="text-lg mb-3">{t('reg.beforeIntro')}</p>
        <EmergencySigns />
        <div className="mt-4 rounded-2xl border-2 border-danger bg-surface p-4">
          <p className="text-xl font-bold text-danger">{t('reg.anyOfThese')}</p>
          <Link to="/emergency" className="btn-danger w-full mt-3 min-h-btn-lg text-xl">
            <Icon name="emergency" size={30} />
            <span>{t('reg.goEmergency')}</span>
          </Link>
        </div>
        <p className="mt-3 text-base text-muted">{t('reg.notSureUrgent')}</p>
        <button type="button" className="btn-primary w-full min-h-btn-lg text-xl mt-5" onClick={() => go(1)}>
          <Icon name="check" size={28} />
          <span>{t('reg.noneStart')}</span>
        </button>
      </div>
    );
  }

  // ---------- step 6: check and submit ----------
  if (step === 6) {
    const rows = [
      { k: 'confirmName', v: form.name, s: 1 },
      { k: 'confirmAge', v: form.age ? `${form.age} ${t('reg.years')}` : '', s: 2 },
      { k: 'confirmGender', v: form.gender ? t(`reg.${form.gender}`) : '', s: 3 },
      { k: 'confirmMobile', v: form.mobile || t('reg.none'), s: 4 },
      { k: 'confirmDept', v: form.dept ? t.dept(form.dept) : '', s: 5 },
    ];
    const incomplete = !form.name.trim() || form.age === '' || !form.gender || !form.dept;
    return (
      <div>
        <h1 className="h1 mb-3">{t('reg.confirmTitle')}</h1>
        <dl className="card divide-y divide-line !p-0">
          {rows.map((r) => (
            <div key={r.k} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <dt className="text-base text-muted">{t(`reg.${r.k}`)}</dt>
                <dd className="text-xl font-semibold">{r.v || '—'}</dd>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={() => go(r.s)}>
                {t('reg.edit')}
              </button>
            </div>
          ))}
        </dl>
        {error ? (
          <p className="mt-3 text-danger font-semibold" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="btn-primary w-full min-h-btn-lg text-xl mt-6"
          onClick={submit}
          disabled={submitting || incomplete}
        >
          <Icon name="ticket" size={30} />
          <span>{submitting ? t('reg.submitting') : t('reg.submit')}</span>
        </button>
      </div>
    );
  }

  // ---------- steps 1-5: one question each ----------
  const onSubmitStep = (e) => {
    e.preventDefault();
    if (step === 1 && !form.name.trim()) return setError(t('reg.nameError'));
    if (step === 2) {
      const n = Number(form.age);
      if (form.age === '' || !Number.isInteger(n) || n < 0 || n > 120) return setError(t('reg.ageError'));
    }
    if (step === 3 && !form.gender) return setError(t('reg.genderError'));
    if (step === 4 && form.mobile && !/^\d{10}$/.test(form.mobile)) return setError(t('reg.mobileError'));
    return go(step + 1);
  };

  const errId = error ? 'reg-error' : undefined;

  return (
    <form onSubmit={onSubmitStep} noValidate>
      <ProgressBar step={step} total={TOTAL} />
      <AssistedSwitch />

      {step === 1 ? (
        <>
          <label htmlFor="name" className="h1 block mb-1">{t('reg.nameQ')}</label>
          <p id="name-hint" className="text-base text-muted mb-3">{t('reg.nameHint')}</p>
          <input
            ref={inputRef}
            id="name"
            className="input text-2xl"
            value={form.name}
            onChange={(e) => set({ name: e.target.value.slice(0, 30) })}
            placeholder={t('reg.namePlaceholder')}
            autoComplete="given-name"
            aria-describedby={['name-hint', errId].filter(Boolean).join(' ')}
            aria-invalid={Boolean(error)}
          />
          <div className="mt-3">
            <MicButton onText={(s) => set({ name: s.split(/\s+/)[0].slice(0, 30) })} />
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <label htmlFor="age" className="h1 block mb-1">{t('reg.ageQ')}</label>
          <p id="age-hint" className="text-base text-muted mb-3">{t('reg.ageHint')}</p>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              className="btn-secondary !px-4"
              onClick={() => set({ age: String(Math.max(0, (Number(form.age) || 0) - 1)) })}
              aria-label="-1"
            >
              <Icon name="minus" size={28} />
            </button>
            <input
              ref={inputRef}
              id="age"
              className="input text-3xl text-center font-bold"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.age}
              onChange={(e) => set({ age: e.target.value.replace(/\D/g, '').slice(0, 3) })}
              placeholder={t('reg.agePlaceholder')}
              aria-describedby={['age-hint', errId].filter(Boolean).join(' ')}
              aria-invalid={Boolean(error)}
            />
            <button
              type="button"
              className="btn-secondary !px-4"
              onClick={() => set({ age: String(Math.min(120, (Number(form.age) || 0) + 1)) })}
              aria-label="+1"
            >
              <Icon name="plus" size={28} />
            </button>
          </div>
          <div className="mt-3">
            <MicButton numeric onText={(s) => set({ age: s.slice(0, 3) })} />
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <fieldset aria-describedby={errId}>
          <legend className="h1 mb-3">{t('reg.genderQ')}</legend>
          <div className="grid gap-3">
            {['female', 'male', 'other'].map((g, i) => (
              <button
                key={g}
                type="button"
                ref={i === 0 ? inputRef : undefined}
                aria-pressed={form.gender === g}
                onClick={() => {
                  set({ gender: g });
                  setTimeout(() => go(4), 150);
                }}
                className={`btn-secondary !justify-start min-h-btn-lg !text-2xl ${form.gender === g ? '!border-primary !bg-soft ring-2 ring-primary' : ''}`}
              >
                <Icon name={g} size={34} className="text-primary" />
                <span className="flex-1 text-left">{t(`reg.${g}`)}</span>
                {form.gender === g ? <Icon name="check" size={28} className="text-primary" /> : null}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {step === 4 ? (
        <>
          <label htmlFor="mobile" className="h1 block mb-1">{t('reg.mobileQ')}</label>
          <p id="mobile-hint" className="text-base text-muted mb-3">{t('reg.mobileHint')}</p>
          <input
            ref={inputRef}
            id="mobile"
            className="input text-2xl tracking-wider"
            inputMode="tel"
            autoComplete="tel-national"
            value={form.mobile}
            onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder={t('reg.mobilePlaceholder')}
            aria-describedby={['mobile-hint', errId].filter(Boolean).join(' ')}
            aria-invalid={Boolean(error)}
          />
          <div className="mt-3">
            <MicButton numeric onText={(s) => set({ mobile: s.slice(0, 10) })} />
          </div>
          <button
            type="button"
            className="btn-secondary w-full mt-3"
            onClick={() => {
              set({ mobile: '' });
              go(5);
            }}
          >
            <Icon name="forward" size={24} />
            <span>{t('reg.noPhone')} — {t('common.skip')}</span>
          </button>
        </>
      ) : null}

      {step === 5 ? (
        <fieldset>
          <legend className="h1 mb-1">{t('reg.deptQ')}</legend>
          <p className="text-base text-muted mb-3">{t('reg.deptHint')}</p>
          <div className="grid gap-2">
            {DEPARTMENTS.map((d) => (
              <DeptCard
                key={d.id}
                dept={d}
                selected={form.dept === d.id}
                onClick={() => {
                  set({ dept: d.id });
                  setTimeout(() => go(6), 150);
                }}
              />
            ))}
          </div>
          <Link to="/find?to=helpdesk" className="btn-secondary w-full mt-3 !justify-start">
            <Icon name="help" size={30} className="text-primary" />
            <span className="text-left">
              <span className="block">{t('reg.notSure')}</span>
              <span className="block text-base font-normal text-muted">{t('reg.notSureHint')}</span>
            </span>
          </Link>
          <div className="mt-3">
            <TermNote id="opd" />
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <p id="reg-error" className="mt-3 text-danger text-lg font-semibold flex gap-2 items-start" role="alert">
          <Icon name="alert" size={24} /> {error}
        </p>
      ) : null}

      {step !== 3 && step !== 5 ? <NextButton /> : null}
      {step === 3 && form.gender ? <NextButton /> : null}
      {step === 5 && form.dept ? <NextButton /> : null}

      {step > 1 ? (
        <button type="button" className="btn-ghost w-full mt-2" onClick={() => go(step - 1)}>
          <Icon name="back" size={24} />
          <span>{t('common.back')}</span>
        </button>
      ) : null}
    </form>
  );
}
