import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { agoText } from '../components/OfflineBar.jsx';
import { useT } from '../lib/i18n.jsx';
import { useHospital, useSimNow, useNow } from '../store/hooks.js';
import { dispatch, setMode } from '../store/store.js';
import { deptStats, crowding, fmtClock } from '../../shared/engine.js';
import { DEPARTMENTS } from '../data/departments.js';
import { alarm, unlockAudio, audioReady } from '../lib/sound.js';

function useAct() {
  const t = useT();
  const [error, setError] = useState(null);
  const act = async (action) => {
    setError(null);
    try {
      return await dispatch(action);
    } catch (e) {
      setError(e.message === 'forbidden' ? t('errors.forbidden') : e.message === 'offline' ? t('errors.offlineAction') : t('errors.generic'));
      return null;
    }
  };
  return { act, error, clear: () => setError(null) };
}

// ---------------- urgent flags ----------------

function Flags({ act }) {
  const t = useT();
  const { hospital } = useHospital();
  const now = useNow(1000);
  const [soundOn, setSoundOn] = useState(audioReady());
  const open = hospital.flags.filter((f) => !f.seen);
  const recent = hospital.flags.filter((f) => f.seen).slice(0, 3);

  // Ring every 3 seconds until every alert is marked as seen.
  useEffect(() => {
    if (!open.length) return undefined;
    alarm();
    const id = setInterval(alarm, 3000);
    const old = document.title;
    document.title = `(${open.length}) URGENT · OPD Saathi`;
    return () => {
      clearInterval(id);
      document.title = old;
    };
  }, [open.length, soundOn]);

  return (
    <section aria-labelledby="flags-title" className={`rounded-2xl border-2 p-3 ${open.length ? 'border-danger bg-danger-soft' : 'border-line bg-surface'}`}>
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h2 id="flags-title" className="h2 flex items-center gap-2 text-danger">
          <Icon name="hand" size={28} /> {t('staff.flagsTitle')} {open.length ? <span className="pill bg-danger text-on-danger">{open.length}</span> : null}
        </h2>
        <button
          type="button"
          className={`btn-sm btn border-2 ${soundOn ? 'border-ok text-ok bg-surface' : 'border-danger text-danger bg-surface pulse'}`}
          onClick={() => setSoundOn(unlockAudio() || true)}
        >
          <Icon name={soundOn ? 'check' : 'speaker'} size={20} /> {soundOn ? t('staff.soundIsOn') : t('staff.soundOn')}
        </button>
      </div>
      {open.length ? (
        <ul className="mt-3 grid gap-2 md:grid-cols-2" aria-live="assertive">
          {open.map((f) => (
            <li key={f.id} className="rounded-2xl bg-surface border-2 border-danger p-3 pulse">
              <p className="text-xl font-black text-danger flex items-center gap-2">
                <Icon name="bell" size={26} /> {t('staff.flagAgo', { ago: agoText(t, now - f.at) })}
              </p>
              <p className="text-lg mt-1">
                {t('staff.flagFrom', { who: t(f.who === 'helper' ? 'staff.flagHelper' : 'staff.flagPatient') })}
                {f.token ? <> · <b>{t('staff.flagToken', { token: f.token })}</b></> : null}
                {f.token && hospital.patients[f.token]?.firstName ? <> ({hospital.patients[f.token].firstName})</> : null}
              </p>
              <p className="text-lg font-semibold">{f.where ? t('staff.flagWhere', { place: t.place(f.where) }) : t('staff.flagWhere', { place: '?' })}</p>
              <p className="text-base mt-1">{t('staff.flagAssess')}</p>
              <button type="button" className="btn-danger w-full mt-2" onClick={() => act({ type: 'flag.seen', id: f.id })}>
                <Icon name="check" size={24} /> {t('staff.flagSeen')}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-lg mt-1 text-muted">{t('staff.flagsNone')}</p>
      )}
      {recent.length ? (
        <ul className="mt-2 text-base text-muted">
          {recent.map((f) => (
            <li key={f.id}>
              <Icon name="check" size={16} className="inline text-ok" /> {f.token || '—'} · {f.where ? t.place(f.where) : '?'} · {t('staff.flagSeenBy', { ago: agoText(t, now - (f.seenAt || f.at)) })}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

// ---------------- crowding ----------------

function Crowding() {
  const t = useT();
  const { hospital } = useHospital();
  const areas = crowding(hospital);
  const style = {
    calm: { cls: 'border-ok bg-ok-soft', icon: 'check', text: 'text-ok' },
    busy: { cls: 'border-warn bg-warn-soft', icon: 'alert', text: 'text-warn' },
    crowded: { cls: 'border-danger bg-danger-soft', icon: 'alert', text: 'text-danger' },
  };
  return (
    <section aria-labelledby="crowd-title">
      <h2 id="crowd-title" className="h2 mb-2">{t('staff.crowdTitle')}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {areas.map((a) => {
          const s = style[a.level];
          return (
            <div key={a.id} className={`rounded-2xl border-2 p-3 ${s.cls}`}>
              <p className="text-lg font-bold">{a.id === 'hallA' ? t.place('waiting_a') : `${t.room('opd5')}–${t.room('opd8').replace(/\D+/g, '')}`}</p>
              <p className={`text-xl font-black flex items-center gap-2 ${s.text}`}>
                <Icon name={s.icon} size={24} /> {t(`staff.crowd.${a.level}`)}
              </p>
              <div className="mt-2 h-3 rounded-full bg-surface border border-line overflow-hidden" aria-hidden="true">
                <div className="h-full bg-current" style={{ width: `${Math.min(100, a.ratio * 100)}%`, color: 'rgb(var(--c-ink))' }} />
              </div>
              <p className="text-base mt-1">{t('staff.seats', { n: a.waiting, s: a.seats })} · {a.depts.map((d) => t.dept(d)).join(', ')}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------- doctor status ----------------

function DoctorStatus({ room, state, now, act }) {
  const t = useT();
  const [status, setStatus] = useState(state.status);
  const [until, setUntil] = useState(state.until != null ? fmtClock(state.until) : fmtClock(now + 20));
  const [late, setLate] = useState(state.lateMin || 10);
  useEffect(() => {
    setStatus(state.status);
    if (state.until != null) setUntil(fmtClock(state.until));
    if (state.lateMin) setLate(state.lateMin);
  }, [state.status, state.until, state.lateMin]);
  const id = `ds-${room}`;
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        act({ type: 'setDoctor', room, status, until, lateMin: Number(late) });
      }}
    >
      <div>
        <label htmlFor={id} className="block text-base font-semibold">{t('staff.status')}</label>
        <select id={id} className="rounded-xl border-2 border-line bg-surface px-2 min-h-[2.75rem] text-base" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="available">{t('staff.available')}</option>
          <option value="break">{t('staff.break')}</option>
          <option value="late">{t('staff.late')}</option>
        </select>
      </div>
      {status === 'break' ? (
        <div>
          <label htmlFor={`${id}-u`} className="block text-base font-semibold">{t('staff.until')}</label>
          <input id={`${id}-u`} type="time" className="rounded-xl border-2 border-line bg-surface px-2 min-h-[2.75rem] text-base" value={until} onChange={(e) => setUntil(e.target.value)} />
        </div>
      ) : null}
      {status === 'late' ? (
        <div>
          <label htmlFor={`${id}-l`} className="block text-base font-semibold">{t('staff.lateBy')}</label>
          <input id={`${id}-l`} type="number" min="0" max="180" step="5" className="w-24 rounded-xl border-2 border-line bg-surface px-2 min-h-[2.75rem] text-base" value={late} onChange={(e) => setLate(e.target.value)} />
        </div>
      ) : null}
      <button type="submit" className="btn-sm btn bg-surface border-2 border-primary text-primary">{t('staff.apply')}</button>
    </form>
  );
}

// ---------------- one department ----------------

function PatientRow({ token, hospital, deptId, act, called = false }) {
  const t = useT();
  const p = hospital.patients[token];
  const [moveTo, setMoveTo] = useState('');
  if (!p) return null;
  return (
    <li className={`rounded-xl border p-2 ${called ? 'border-primary bg-soft' : 'border-line bg-surface'}`}>
      <div className="flex flex-wrap items-center gap-x-2">
        <span className="text-lg font-black tracking-wide">{token}</span>
        <span className="text-base">{p.firstName}{p.age != null ? `, ${t('staff.age', { n: p.age })}` : ''}</span>
        <span className="pill !py-0 !px-2 bg-soft border border-line text-sm">{t(`staff.source.${p.source}`)}</span>
        {p.assisted ? <span className="pill !py-0 !px-2 bg-info-soft text-info text-sm"><Icon name="users" size={14} /> {t('reg.assisted')}</span> : null}
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        <button type="button" className="btn-sm btn bg-surface border border-line !min-h-[2.5rem] !text-sm" onClick={() => act({ type: 'noShow', token })}>
          <Icon name="x" size={16} /> {t('staff.noShow')}
        </button>
        <button type="button" className="btn-sm btn bg-surface border border-line !min-h-[2.5rem] !text-sm" onClick={() => act({ type: 'toEnd', token })}>
          <Icon name="arrowDown" size={16} /> {t('staff.toEnd')}
        </button>
        <form
          className="flex gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (moveTo) act({ type: 'move', token, dept: moveTo });
          }}
        >
          <label className="sr-only" htmlFor={`mv-${token}`}>{t('staff.moveTo')}</label>
          <select id={`mv-${token}`} className="rounded-lg border border-line bg-surface px-1 text-sm min-h-[2.5rem]" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            <option value="">{t('staff.moveTo')}</option>
            {DEPARTMENTS.filter((d) => d.id !== deptId).map((d) => (
              <option key={d.id} value={d.id}>{t.dept(d.id)}</option>
            ))}
          </select>
          <button type="submit" disabled={!moveTo} className="btn-sm btn bg-surface border border-line !min-h-[2.5rem] !text-sm">
            <Icon name="move" size={16} /> {t('staff.move')}
          </button>
        </form>
      </div>
    </li>
  );
}

function DeptPanel({ dept, act }) {
  const t = useT();
  const { hospital } = useHospital();
  const now = useSimNow(2000);
  const [showAll, setShowAll] = useState(false);
  const s = deptStats(hospital, dept.id, now);
  const queue = hospital.queues[dept.id] || [];
  const shown = showAll ? queue : queue.slice(0, 5);
  return (
    <section className="card !p-3 flex flex-col gap-3" aria-labelledby={`dept-${dept.id}`}>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: dept.colour }}>
          <Icon name={dept.icon} size={26} />
        </span>
        <div className="flex-1 min-w-0">
          <h3 id={`dept-${dept.id}`} className="text-xl font-bold leading-tight">{t.dept(dept.id)} <span className="text-muted text-base">({dept.id})</span></h3>
          <dl className="flex flex-wrap gap-x-4 text-base">
            <div><dt className="inline text-muted">{t('staff.waiting')}: </dt><dd className="inline font-black text-lg">{s.waiting}</dd></div>
            <div><dt className="inline text-muted">{t('staff.avgWait')}: </dt><dd className="inline font-bold">{s.avgActualWait != null ? t('common.minutes', { n: s.avgActualWait }) : '—'}</dd></div>
            <div><dt className="inline text-muted">{t('staff.newWait')}: </dt><dd className="inline font-bold">{t('common.minutes', { n: s.newArrivalWait })}</dd></div>
            <div><dt className="inline text-muted">{t('staff.avgConsult')}: </dt><dd className="inline font-bold">{t('common.minutes', { n: Math.round(s.avgConsult * 10) / 10 })}</dd></div>
            <div><dt className="inline text-muted">{t('staff.seen')}: </dt><dd className="inline font-bold">{s.seenToday}</dd></div>
          </dl>
        </div>
      </div>

      {s.rooms.map((r) => {
        const servingP = r.serving ? hospital.patients[r.serving] : null;
        return (
          <div key={r.id} className="rounded-xl border-2 border-line p-2 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-bold">{t.room(r.id)} · <span className="font-normal">{t.doctor(r.id)}</span></p>
              <span className={`pill !py-0 border ${r.status === 'available' ? 'border-ok text-ok' : 'border-warn text-warn'}`}>
                <Icon name={r.status === 'available' ? 'check' : r.status === 'break' ? 'pause' : 'clock'} size={16} />
                {r.status === 'available' ? t('staff.available') : r.status === 'break' ? `${t('staff.break')} ${t('staff.until')} ${fmtClock(r.until)}` : `${t('staff.late')} +${r.lateMin}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto">
                <p className="text-base text-muted leading-none">{t('staff.serving')}</p>
                <p className="text-2xl font-black tracking-wide">{r.serving || '—'} {servingP ? <span className="text-base font-semibold">{servingP.firstName}</span> : null}</p>
              </div>
              <button type="button" className="btn-primary btn-sm" onClick={() => act({ type: 'callNext', room: r.id })} disabled={!queue.length && !r.serving}>
                <Icon name="bell" size={20} /> {t('staff.callNext')}
              </button>
              {r.serving ? (
                <>
                  <button type="button" className="btn-sm btn bg-surface border-2 border-line" onClick={() => act({ type: 'recall', room: r.id })}>
                    <Icon name="speaker" size={20} /> {t('staff.recall')}
                  </button>
                  <button type="button" className="btn-sm btn bg-surface border-2 border-line" onClick={() => act({ type: 'noShow', token: r.serving })}>
                    <Icon name="x" size={20} /> {t('staff.noShow')}
                  </button>
                  <button type="button" className="btn-sm btn bg-surface border-2 border-line" onClick={() => act({ type: 'toEnd', token: r.serving })}>
                    <Icon name="arrowDown" size={20} /> {t('staff.toEnd')}
                  </button>
                </>
              ) : null}
            </div>
            <DoctorStatus room={r.id} state={hospital.rooms[r.id]} now={now} act={act} />
          </div>
        );
      })}

      <div>
        <p className="text-base font-semibold mb-1">{t('staff.patientsLabel')} ({queue.length})</p>
        {queue.length ? (
          <ol className="grid gap-1">
            {shown.map((tok) => (
              <PatientRow key={tok} token={tok} hospital={hospital} deptId={dept.id} act={act} />
            ))}
          </ol>
        ) : (
          <p className="text-base text-muted">{t('staff.queueEmpty')}</p>
        )}
        {queue.length > 5 ? (
          <button type="button" className="btn-ghost btn-sm mt-1" onClick={() => setShowAll((v) => !v)}>
            {showAll ? '−' : `+${queue.length - 5}`}
          </button>
        ) : null}
      </div>
    </section>
  );
}

// ---------------- demo controls ----------------

function DemoControls({ act }) {
  const t = useT();
  const { hospital, conn } = useHospital();
  const now = useSimNow(1000);
  const [confirmReset, setConfirmReset] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <section className="card border-2 border-dashed border-info" aria-labelledby="demo-title">
      <h2 id="demo-title" className="h2 mb-2 flex items-center gap-2">
        <Icon name="settings" size={26} className="text-info" /> {t('staff.demo')}
      </h2>
      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" className="btn-primary btn-sm" onClick={() => act({ type: 'demo.addSamples', count: 20 })}>
          <Icon name="users" size={20} /> {t('staff.addSamples')}
        </button>
        <div className="flex items-center gap-1" role="group" aria-label={t('staff.speed')}>
          <span className="text-base font-semibold mr-1">{t('staff.speed')}:</span>
          {[1, 10, 30].map((sp) => (
            <button
              key={sp}
              type="button"
              aria-pressed={hospital.clock.speed === sp}
              className={`btn-sm btn border-2 ${hospital.clock.speed === sp ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-line'}`}
              onClick={() => act({ type: 'demo.speed', speed: sp })}
            >
              {sp}x
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={hospital.auto}
          className={`btn-sm btn border-2 ${hospital.auto ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-line'}`}
          onClick={() => act({ type: 'demo.auto', on: !hospital.auto })}
          title={t('staff.autoHint')}
        >
          <Icon name={hospital.auto ? 'check' : 'refresh'} size={20} /> {t('staff.auto')}
        </button>
        <button
          type="button"
          className={`btn-sm btn border-2 ${confirmReset ? 'bg-danger text-on-danger border-danger' : 'bg-surface border-danger text-danger'}`}
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              timer.current = setTimeout(() => setConfirmReset(false), 4000);
              return;
            }
            setConfirmReset(false);
            act({ type: 'demo.reset' });
          }}
        >
          <Icon name="refresh" size={20} /> {confirmReset ? t('staff.resetConfirm') : t('staff.reset')}
        </button>
      </div>
      <p className="text-base text-muted mt-2">{t('staff.autoHint')}</p>
      <p className="text-base mt-2">
        {t('staff.clock')}: <b>{fmtClock(now)}</b> ({hospital.clock.speed}x) · {t('staff.mode')}: <b>{conn.mode === 'server' ? t('staff.modeServer') : t('staff.modeLocal')}</b>{' '}
        <button type="button" className="underline text-primary" onClick={() => setMode(conn.mode === 'server' ? 'local' : 'server')}>
          {conn.mode === 'server' ? t('staff.switchLocal') : t('staff.switchServer')}
        </button>
      </p>
    </section>
  );
}

export default function Dashboard() {
  const t = useT();
  const { hospital } = useHospital();
  const { act, error, clear } = useAct();
  const total = useMemo(() => Object.values(hospital.queues).reduce((n, q) => n + q.length, 0), [hospital.queues]);
  return (
    <div className="space-y-4">
      <Flags act={act} />
      {error ? (
        <p role="alert" className="card bg-danger-soft border-danger font-semibold flex items-center gap-2">
          <Icon name="alert" size={22} /> {error}
          <button type="button" className="ml-auto underline" onClick={clear}>{t('common.close')}</button>
        </p>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="h1">{t('staff.title')}</h1>
        <p className="text-lg">{t('staff.total')}: <b>{total}</b></p>
      </div>
      <Crowding />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DEPARTMENTS.map((d) => (
          <DeptPanel key={d.id} dept={d} act={act} />
        ))}
      </div>
      <DemoControls act={act} />
    </div>
  );
}
