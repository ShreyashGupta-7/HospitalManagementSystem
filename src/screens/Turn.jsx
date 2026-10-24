import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import RouteView from '../components/RouteView.jsx';
import TermNote from '../components/TermNote.jsx';
import { agoText } from '../components/OfflineBar.jsx';
import { useT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { useHospital, useSimNow, useNow } from '../store/hooks.js';
import { useVisits, updateVisit } from '../store/visits.js';
import { patientInfo, fmtClock } from '../../shared/engine.js';
import { PLACES, START_POINTS } from '../data/hospital.js';
import { DEPT_BY_ID } from '../data/departments.js';
import { chime, callChime, vibrate } from '../lib/sound.js';
import { speak } from '../lib/speech.js';
import { showNotification } from '../lib/pwa.js';
import { spokenToken } from '../lib/qr.js';
import { load, save } from '../lib/storage.js';
import { waitLabel } from './Slip.jsx';

const ALERT_KEY = 'opd.alerts';
const CLOSE_AT = 3; // alert when this many people (or fewer) are ahead

function DoctorLine({ d, t }) {
  let text = t('turn.statusAvailable');
  let tone = 'bg-ok-soft text-ok';
  let icon = 'check';
  if (d.status === 'break') {
    text = t('turn.statusBreak', { time: fmtClock(d.until) });
    tone = 'bg-warn-soft text-ink';
    icon = 'pause';
  } else if (d.status === 'late') {
    text = t('turn.statusLate', { n: d.lateMin });
    tone = 'bg-warn-soft text-ink';
    icon = 'clock';
  }
  return (
    <li className={`flex items-start gap-2 rounded-xl px-3 py-2 ${tone}`}>
      <Icon name={icon} size={24} className="mt-0.5" />
      <span className="text-lg">
        <span className="font-bold">{t.room(d.room)} · {t.doctor(d.room)}:</span> {text}
      </span>
    </li>
  );
}

function SmsToast({ text, number, onClose }) {
  const t = useT();
  return (
    <div className="fixed top-2 inset-x-2 z-50 slide-down">
      <div role="alert" className="max-w-md mx-auto rounded-2xl bg-ink text-bg p-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <Icon name="message" size={26} />
          <p className="font-bold flex-1">{t('turn.smsTitle')}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:opacity-80" aria-label={t('common.close')}>
            <Icon name="x" size={22} />
          </button>
        </div>
        {number ? <p className="text-base opacity-80">{t('turn.smsTo', { number: `${number.slice(0, 2)}******${number.slice(-2)}` })}</p> : null}
        <p className="text-lg mt-1">{text}</p>
      </div>
    </div>
  );
}

export default function Turn() {
  const t = useT();
  const { token } = useParams();
  const { hospital, conn } = useHospital();
  const { settings } = useSettings();
  const now = useSimNow(2000);
  useNow(5000);
  const visits = useVisits();
  const visit = visits.find((v) => v.token === token) || null;
  const info = patientInfo(hospital, token, now);
  const [sms, setSms] = useState(null);
  const [from, setFrom] = useState('waiting_a');
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'));
  const alerted = useRef(load(ALERT_KEY, {}));

  const roomId = info?.room;
  const floor = roomId ? PLACES[roomId].floor : '1';
  const placeName = roomId ? t.room(roomId) : '';
  const isClose = info?.status === 'waiting' && info.ahead <= CLOSE_AT;

  // Staff moved this patient to another department: follow the new token.
  useEffect(() => {
    if (info?.moved && visit) updateVisit((v) => v.token === token, { token: info.token, dept: info.dept });
  }, [info?.moved, info?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Alerts: once when 3 people are ahead, once when called.
  useEffect(() => {
    if (!info) return;
    const key = info.token;
    const a = alerted.current[key] || {};
    if (isClose && !a.close && !a.called) {
      a.close = true;
      const msg = t('turn.sms', { place: placeName, floor: t.floorIn(floor) });
      vibrate([400, 200, 400]);
      chime();
      setSms(msg);
      showNotification(t('alerts.closeTitle'), msg, `close-${key}`);
      speak(t('turn.closeBanner', { place: placeName, floor: t.floorIn(floor) }), t.lang);
    }
    if (info.status === 'called' && !a.called) {
      a.called = true;
      a.close = true;
      const msg = t('turn.calledText', { place: placeName, floor: t.floorIn(floor) });
      vibrate([600, 200, 600, 200, 600]);
      callChime();
      showNotification(t('alerts.calledTitle'), `${spokenToken(key)}: ${msg}`, `called-${key}`);
      speak(`${t('turn.calledTitle')} ${msg}`, t.lang);
    }
    alerted.current[key] = a;
    save(ALERT_KEY, alerted.current);
  }, [info?.status, isClose, info?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const aheadText = !info
    ? ''
    : info.ahead === 0
      ? t('turn.aheadNone')
      : info.ahead === 1
        ? t('turn.aheadOne')
        : t('turn.ahead', { n: info.ahead });

  const nextText = !info
    ? ''
    : isClose
      ? t('turn.nextClose', { place: placeName, floor: t.floorIn(floor) })
      : t('turn.nextWaiting', { area: t.place('waiting_a'), floor: t.floorIn('1') });

  let speech = '';
  if (info?.status === 'waiting') speech = t('turn.readText', { token: spokenToken(info.token), ahead: aheadText, wait: waitLabel(t, info), next: nextText });
  else if (info?.status === 'called') speech = `${t('turn.calledTitle')} ${t('turn.calledText', { place: placeName, floor: t.floorIn(floor) })}`;
  else if (info?.status === 'done') speech = `${t('turn.doneTitle')}. ${t('turn.doneText')}`;
  else if (info?.status === 'noshow') speech = `${t('turn.noshowTitle')}. ${t('turn.noshowText')}`;
  useScreenSpeech(speech);

  const askPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
    } catch {
      setPerm('denied');
    }
  };

  if (!info) {
    return (
      <div className="space-y-4">
        <h1 className="h1">{t('turn.title')}</h1>
        <p className="text-xl font-semibold">{t('turn.unknown', { token })}</p>
        <p className="text-lg">{t('turn.unknownHint')}</p>
        {!conn.ready ? <p className="text-muted">{t('common.loading')}</p> : null}
        <Link to="/have-slip" className="btn-primary w-full">
          <Icon name="ticket" size={26} />
          <span>{t('home.haveSlip')}</span>
        </Link>
        <Link to="/find?to=helpdesk" className="btn-secondary w-full">
          <Icon name="help" size={26} />
          <span>{t('common.showWayTo', { place: t.place('helpdesk') })}</span>
        </Link>
      </div>
    );
  }


  // ---------- called: it's your turn ----------
  if (info.status === 'called') {
    return (
      <div className="space-y-4">
        <section className="rounded-3xl bg-primary text-on-primary p-5 text-center" role="alert">
          <Icon name="bell" size={48} className="mx-auto" />
          <h1 className="text-4xl font-black mt-2">{t('turn.calledTitle')}</h1>
          <p className="text-2xl font-bold mt-2 tracking-wide">{info.token}</p>
          <p className="text-2xl mt-3 font-semibold">{t('turn.calledText', { place: placeName, floor: t.floorIn(floor) })}</p>
          <p className="text-lg mt-1 opacity-95">{t.doctor(roomId)}</p>
        </section>
        <div className="card">
          <label htmlFor="from" className="label">{t('find.from')}</label>
          <select id="from" className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
            {START_POINTS.map((id) => (
              <option key={id} value={id}>{t.place(id)}</option>
            ))}
          </select>
        </div>
        <h2 className="h2">{t('turn.calledDirections')}</h2>
        <RouteView from={from} to={roomId} avoidStairs={settings.avoidStairs} headingLevel={3} />
      </div>
    );
  }

  // ---------- done / missed ----------
  if (info.status === 'done' || info.status === 'noshow') {
    const done = info.status === 'done';
    return (
      <div className="space-y-4">
        <section className={`card border-2 ${done ? 'border-ok bg-ok-soft' : 'border-warn bg-warn-soft'}`}>
          <h1 className="h1 flex items-center gap-2">
            <Icon name={done ? 'check' : 'alert'} size={32} />
            <span>{t(done ? 'turn.doneTitle' : 'turn.noshowTitle')}</span>
          </h1>
          <p className="text-lg mt-2">{t(done ? 'turn.doneText' : 'turn.noshowText')}</p>
        </section>
        {done ? (
          <>
            <Link to="/find?to=pharmacy" className="btn-primary w-full min-h-btn-lg text-xl">
              <Icon name="pill" size={30} />
              <span>{t('turn.goPharmacy')}</span>
            </Link>
            <Link to="/find?to=lab" className="btn-secondary w-full">
              <Icon name="flask" size={28} />
              <span>{t('turn.goLab')}</span>
            </Link>
          </>
        ) : (
          <Link to="/find?to=helpdesk" className="btn-primary w-full min-h-btn-lg text-xl">
            <Icon name="help" size={30} />
            <span>{t('common.showWayTo', { place: t.place('helpdesk') })}</span>
          </Link>
        )}
      </div>
    );
  }

  // ---------- waiting ----------
  return (
    <div className="space-y-4">
      {sms ? <SmsToast text={sms} number={visit?.mobile} onClose={() => setSms(null)} /> : null}

      <h1 className="h1">{t('turn.title')}</h1>

      {info.moved ? (
        <p className="card bg-info-soft border-info text-lg font-semibold" role="status">
          {t('turn.movedNote', { dept: t.dept(info.dept), token: info.token })}
        </p>
      ) : null}

      {isClose ? (
        <div role="alert" className="rounded-2xl border-2 border-warn bg-warn-soft p-4 flex gap-3 items-start slide-down">
          <Icon name="bell" size={34} className="text-warn" />
          <p className="text-xl font-bold">{t('turn.closeBanner', { place: placeName, floor: t.floorIn(floor) })}</p>
        </div>
      ) : null}

      <section className="card border-2 border-primary text-center" aria-live="polite">
        <p className="text-lg text-muted">{t('turn.yourToken')}</p>
        <p className="token-xl font-black tracking-wide">{info.token}</p>
        <p className="text-lg font-semibold mt-1">{t.dept(info.dept)}</p>
        <div className="mt-4 rounded-2xl bg-soft p-4">
          <p className="text-3xl font-black">{aheadText}</p>
          <p className="text-2xl font-bold text-primary mt-1">{waitLabel(t, info)}</p>
        </div>
      </section>

      <TermNote id="queue" />

      <section className="card">
        <h2 className="h2 mb-2">{t('turn.nowServing')}</h2>
        <ul className="grid gap-2">
          {info.nowServing.map((s) => (
            <li key={s.room} className="flex items-center justify-between gap-2 rounded-xl bg-soft px-3 py-2">
              <span className="text-lg">{t.room(s.room)}</span>
              <span className="text-2xl font-black tracking-wide">{s.token || t('turn.nobody')}</span>
            </li>
          ))}
        </ul>
        <h2 className="h2 mt-4 mb-2">{t('turn.doctorStatus')}</h2>
        <ul className="grid gap-2">
          {info.doctors.map((d) => (
            <DoctorLine key={d.room} d={d} t={t} />
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="h2 mb-1">{t('turn.nextSteps')}</h2>
        <p className="text-lg">{nextText}</p>
        <Link to={`/find?to=${isClose ? roomId : 'waiting_a'}`} className="btn-primary w-full mt-3 min-h-btn-lg text-xl">
          <Icon name="map" size={28} />
          <span>{t('common.showWayTo', { place: isClose ? placeName : t.place('waiting_a') })}</span>
        </Link>
      </section>

      <section className="card">
        {perm === 'granted' ? (
          <p className="text-lg text-ok font-semibold flex items-center gap-2">
            <Icon name="check" size={24} /> {t('turn.alertsEnabled')}
          </p>
        ) : perm === 'denied' || perm === 'unsupported' ? (
          <p className="text-base text-muted">{t('turn.alertsBlocked')}</p>
        ) : (
          <>
            <button type="button" className="btn-secondary w-full" onClick={askPermission}>
              <Icon name="bell" size={26} />
              <span>{t('turn.alertsOn')}</span>
            </button>
            <p className="text-base text-muted mt-1">{t('turn.alertsOnHint')}</p>
          </>
        )}
        <p className="text-base text-muted mt-3">
          {t('turn.updatesNote')} {conn.lastSync ? t('turn.lastUpdate', { time: agoText(t, Date.now() - conn.lastSync) }) : ''}
        </p>
      </section>

      <p className="text-center">
        <Link to={`/slip/${info.token}`} className="btn-ghost">
          <Icon name="ticket" size={24} />
          <span>{t('slip.title')}</span>
        </Link>
      </p>
    </div>
  );
}
