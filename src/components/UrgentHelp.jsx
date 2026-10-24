// "I need urgent help": sends an alert to the top of the staff dashboard (with a sound)
// until a staff member marks it as seen. It never asks what is wrong and never decides
// how urgent it is — it only gets a qualified person to the patient fast.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { dispatch } from '../store/store.js';
import { useHospital } from '../store/hooks.js';
import { currentVisit } from '../store/visits.js';
import { load, save } from '../lib/storage.js';
import { speak } from '../lib/speech.js';
import { DEPT_BY_ID } from '../data/departments.js';

const Ctx = createContext({ open: () => {} });
const KEY = 'opd.myFlag';

const WHERE = ['registration', 'waiting_a', 'room', 'pharmacy', 'lab', 'entrance', 'toilets_g', 'ward4'];

export function UrgentHelpProvider({ children }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen ? <UrgentSheet onClose={() => setOpen(false)} /> : null}
    </Ctx.Provider>
  );
}

export function useUrgent() {
  return useContext(Ctx);
}

function UrgentSheet({ onClose }) {
  const t = useT();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { hospital } = useHospital();
  const [flag, setFlag] = useState(() => {
    const f = load(KEY, null);
    // Only reuse an alert from the last 30 minutes.
    return f && Date.now() - f.at < 30 * 60 * 1000 ? f : null;
  });
  const [who, setWho] = useState(settings.assisted ? 'helper' : 'patient');
  const [sending, setSending] = useState(false);
  const [where, setWhere] = useState(flag?.where || null);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);
  const visit = currentVisit();

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const live = flag?.id ? hospital.flags.find((f) => f.id === flag.id) : null;
  const seen = Boolean(live?.seen);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await dispatch({
        type: 'flag.raise', who, token: visit?.token || null, lang: t.lang,
      });
      const f = { id: res?.id || null, pending: Boolean(res?.pending), clientRef: res?.clientRef, at: Date.now() };
      save(KEY, f);
      setFlag(f);
      speak(res?.pending ? t('urgent.sentOffline') : `${t('urgent.sent')} ${t('urgent.stay')}`, t.lang);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setSending(false);
    }
  };

  const setPlace = async (id) => {
    const placeId = id === 'room' ? (visit ? roomFor(visit, hospital) : 'waiting_a') : id;
    setWhere(id);
    if (flag?.id) {
      try {
        await dispatch({ type: 'flag.update', id: flag.id, where: placeId, who });
        save(KEY, { ...flag, where: id });
      } catch {
        /* offline: staff still get the alert itself */
      }
    }
  };

  const goEmergency = () => {
    onClose();
    navigate('/emergency');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="urgent-title"
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface border-2 border-danger p-5 bottom-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 id="urgent-title" className="h1 text-danger flex items-center gap-2">
            <Icon name="hand" size={32} />
            {t('urgent.title')}
          </h2>
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
            <Icon name="x" size={22} />
            <span>{t('common.close')}</span>
          </button>
        </div>

        {!flag ? (
          <>
            <p className="mt-2 text-lg">{t('urgent.explain')}</p>
            <fieldset className="mt-4">
              <legend className="label">{t('urgent.who')}</legend>
              <div className="grid grid-cols-2 gap-2">
                {['patient', 'helper'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={who === w}
                    onClick={() => setWho(w)}
                    className={`btn-secondary ${who === w ? '!border-primary !bg-soft ring-2 ring-primary' : ''}`}
                  >
                    <Icon name={w === 'patient' ? 'user' : 'users'} size={24} />
                    <span>{t(w === 'patient' ? 'urgent.whoPatient' : 'urgent.whoHelper')}</span>
                    {who === w ? <Icon name="check" size={22} /> : null}
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="button" className="btn-danger w-full mt-4 min-h-btn-lg text-xl pulse" onClick={send} disabled={sending}>
              <Icon name="bell" size={30} />
              <span>{sending ? t('urgent.sending') : t('urgent.send')}</span>
            </button>
            {error ? <p className="mt-2 text-danger font-semibold" role="alert">{error}</p> : null}
            <p className="mt-4 text-base text-muted">{t('urgent.stay')}</p>
          </>
        ) : (
          <div aria-live="polite">
            <p className={`mt-3 rounded-2xl p-4 text-xl font-bold flex gap-3 items-start ${seen ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-ink'}`} role="status">
              <Icon name={seen ? 'check' : 'bell'} size={30} />
              <span>{flag.pending ? t('urgent.sentOffline') : seen ? t('urgent.seen') : t('urgent.sent')}</span>
            </p>
            <p className="mt-3 text-lg">{t('urgent.stay')}</p>
            {!flag.pending ? (
              <fieldset className="mt-4">
                <legend className="label">{t('urgent.whereQ')}</legend>
                <div className="grid grid-cols-2 gap-2">
                  {WHERE.map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={where === id}
                      onClick={() => setPlace(id)}
                      className={`btn-secondary btn-sm !min-h-btn text-left ${where === id ? '!border-primary ring-2 ring-primary' : ''}`}
                    >
                      {where === id ? <Icon name="check" size={20} /> : <Icon name="pin" size={20} />}
                      <span>{id === 'room' ? (visit ? t.place(roomFor(visit, hospital)) : t.place('waiting_a')) : t.place(id)}</span>
                    </button>
                  ))}
                </div>
                {where ? <p className="mt-2 text-ok font-semibold">{t('urgent.whereSaved')}</p> : null}
              </fieldset>
            ) : null}
            <div className="grid gap-2 mt-4">
              <button type="button" className="btn-danger" onClick={goEmergency}>
                <Icon name="emergency" size={26} />
                <span>{t('urgent.alsoGo')}</span>
              </button>
              <a className="btn-secondary" href="tel:112">
                <Icon name="phone" size={24} />
                <span>{t('emergency.call112')}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function roomFor(visit, hospital) {
  const p = hospital.patients[visit.token];
  if (p?.room) return p.room;
  return DEPT_BY_ID[visit.dept]?.rooms[0].id || 'waiting_a';
}
