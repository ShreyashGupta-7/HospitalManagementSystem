import { useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import QRCode from '../components/QRCode.jsx';
import { useT, LANGS, makeT } from '../lib/i18n.jsx';
import { dispatch } from '../store/store.js';
import { useHospital, useSimNow } from '../store/hooks.js';
import { patientInfo } from '../../shared/engine.js';
import { DEPARTMENTS, DEPT_BY_ID } from '../data/departments.js';
import { PLACES } from '../data/hospital.js';
import { turnUrl } from '../lib/qr.js';
import { roomLabel, waitLabel } from '../screens/Slip.jsx';

const EMPTY = { name: '', age: '', gender: '', dept: '', lang: 'hi' };

/** Staff register a patient who has no phone, in a few taps, and print their slip. */
export default function Counter() {
  const t = useT();
  const { hospital } = useHospital();
  const now = useSimNow(5000);
  const [form, setForm] = useState(EMPTY);
  const [made, setMade] = useState(null);
  const [error, setError] = useState(null);
  const nameRef = useRef(null);
  const set = (p) => setForm((f) => ({ ...f, ...p }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.age === '' || !form.dept) {
      setError(t('counter.required'));
      return;
    }
    setError(null);
    try {
      const res = await dispatch({
        type: 'counterRegister',
        firstName: form.name.trim().split(/\s+/)[0],
        age: Number(form.age),
        gender: form.gender || 'other',
        dept: form.dept,
        lang: form.lang,
      });
      setMade({ token: res.token, firstName: form.name.trim().split(/\s+/)[0], lang: form.lang });
    } catch {
      setError(t('errors.generic'));
    }
  };

  const next = () => {
    setMade(null);
    setForm(EMPTY);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const chip = (active) =>
    `btn-sm btn border-2 ${active ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-line text-ink'}`;

  if (made) {
    const info = patientInfo(hospital, made.token, now);
    const pt = makeT(made.lang); // slip in the patient's language
    const dept = info?.dept || DEPT_BY_ID[form.dept]?.id;
    const room = info?.room || DEPT_BY_ID[dept].rooms[0].id;
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <p className="card bg-ok-soft border-ok text-ok text-xl font-bold" role="status">
          <Icon name="check" size={26} className="inline" /> {t('counter.made', { token: made.token })}
        </p>
        <article className="print-area card border-2 border-primary" lang={made.lang}>
          <p className="font-bold">{pt('hospital')} · {pt('slip.title')}</p>
          <p className="text-base text-muted mt-2">{pt('slip.token')}</p>
          <p className="token-xl font-black tracking-wide">{made.token}</p>
          <p className="text-2xl font-bold">{made.firstName}</p>
          <p className="text-xl font-bold mt-3">{pt.dept(dept)}</p>
          <p className="text-xl">{roomLabel(pt, info, dept)} · {pt.floor(PLACES[room].floor)}</p>
          <p className="text-lg mt-1">{pt('slip.ahead')}: <b>{info?.ahead ?? 0}</b> · {pt('slip.wait')}: <b>{waitLabel(pt, info)}</b></p>
          <div className="flex items-center gap-3 mt-3">
            <QRCode text={turnUrl(made.token)} size={120} label={pt('slip.qrLabel')} />
            <p className="text-base">{pt('slip.qrHint')}</p>
          </div>
          <p className="text-sm text-muted mt-2">{pt('slip.simNote')}</p>
        </article>
        <div className="grid sm:grid-cols-2 gap-2 no-print">
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <Icon name="print" size={24} /> {t('counter.printSlip')}
          </button>
          <button type="button" className="btn-secondary" onClick={next} autoFocus>
            <Icon name="plus" size={24} /> {t('counter.newPatient')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto card space-y-4" noValidate>
      <div>
        <h1 className="h1">{t('counter.title')}</h1>
        <p className="text-lg text-muted">{t('counter.intro')}</p>
      </div>
      <div className="grid sm:grid-cols-[2fr_1fr] gap-3">
        <div>
          <label htmlFor="c-name" className="label">{t('counter.name')}</label>
          <input ref={nameRef} id="c-name" className="input" value={form.name} onChange={(e) => set({ name: e.target.value.slice(0, 30) })} autoFocus autoComplete="off" />
        </div>
        <div>
          <label htmlFor="c-age" className="label">{t('counter.age')}</label>
          <input id="c-age" className="input" inputMode="numeric" value={form.age} onChange={(e) => set({ age: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
        </div>
      </div>
      <fieldset>
        <legend className="label">{t('counter.gender')}</legend>
        <div className="flex flex-wrap gap-2">
          {['female', 'male', 'other'].map((g) => (
            <button key={g} type="button" aria-pressed={form.gender === g} className={chip(form.gender === g)} onClick={() => set({ gender: g })}>
              <Icon name={g} size={20} /> {t(`reg.${g}`)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">{t('counter.dept')}</legend>
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
            <button key={d.id} type="button" aria-pressed={form.dept === d.id} className={chip(form.dept === d.id)} onClick={() => set({ dept: d.id })}>
              <Icon name={d.icon} size={20} /> {t.dept(d.id)}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">{t('counter.lang')}</legend>
        <div className="flex flex-wrap gap-2">
          {LANGS.map((l) => (
            <button key={l.code} type="button" lang={l.code} aria-pressed={form.lang === l.code} className={chip(form.lang === l.code)} onClick={() => set({ lang: l.code })}>
              {l.name}
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <p className="text-danger font-semibold" role="alert">{error}</p> : null}
      <button type="submit" className="btn-primary w-full min-h-btn-lg text-xl">
        <Icon name="ticket" size={28} /> {t('counter.register')}
      </button>
    </form>
  );
}
