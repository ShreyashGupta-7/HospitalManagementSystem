import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import QRCode from '../components/QRCode.jsx';
import TermNote from '../components/TermNote.jsx';
import ListenButton from '../components/ListenButton.jsx';
import { useT, makeT } from '../lib/i18n.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { useHospital, useSimNow } from '../store/hooks.js';
import { useVisits } from '../store/visits.js';
import { patientInfo, fmtClock } from '../../shared/engine.js';
import { DEPT_BY_ID } from '../data/departments.js';
import { PLACES } from '../data/hospital.js';
import { turnUrl, spokenToken } from '../lib/qr.js';
import { saveSlipImage } from '../lib/slipImage.js';

/** "Room 3", or "Room 1 or 2" for Medicine until the patient is called. */
export function roomLabel(t, info, deptId) {
  const d = DEPT_BY_ID[deptId];
  if (info?.assignedRoom) return t.room(info.assignedRoom);
  if (d.rooms.length > 1) {
    return t('slip.roomOr', { a: d.rooms[0].id.replace('opd', ''), b: d.rooms[1].id.replace('opd', '') });
  }
  return t.room(d.rooms[0].id);
}

export function doctorLabel(t, info, deptId) {
  const d = DEPT_BY_ID[deptId];
  if (info?.assignedRoom) return t.doctor(info.assignedRoom);
  return d.rooms.map((r) => t.doctor(r.id)).join(' / ');
}

export function waitLabel(t, info) {
  if (!info || info.status !== 'waiting') return '—';
  if (info.waitMin <= 0) return t('turn.waitSoon');
  return t('turn.wait', { n: info.waitMin });
}

function LargeView({ token, firstName, deptId, info, onClose }) {
  const t = useT();
  const en = makeT('en');
  const room = info?.room || DEPT_BY_ID[deptId].rooms[0].id;
  const floor = PLACES[room].floor;
  return (
    <div className="fixed inset-0 z-50 bg-surface overflow-y-auto p-5" role="dialog" aria-modal="true" aria-label={t('slip.showLarge')}>
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xl text-muted">{t('slip.largeHint')}</p>
        <p className="mt-6 text-2xl font-semibold">{t('slip.token')}</p>
        <p className="font-black tracking-wider leading-none my-3" style={{ fontSize: 'min(22vw, 9rem)' }}>{token}</p>
        {firstName ? <p className="text-3xl font-bold">{firstName}</p> : null}
        <p className="text-3xl font-bold mt-4">{t.dept(deptId)}</p>
        <p className="text-2xl mt-1">{roomLabel(t, info, deptId)} · {t.floor(floor)}</p>
        {t.lang !== 'en' ? (
          <p className="text-xl text-muted mt-4" lang="en">
            {en.dept(deptId)} · {roomLabel(en, info, deptId)} · {en.floor(floor)}
          </p>
        ) : null}
        <button type="button" className="btn-primary mt-8 min-w-[12rem]" onClick={onClose} autoFocus>
          <Icon name="x" size={26} />
          <span>{t('common.close')}</span>
        </button>
      </div>
    </div>
  );
}

export default function Slip({ pending = false }) {
  const t = useT();
  const navigate = useNavigate();
  const params = useParams();
  const visits = useVisits();
  const { hospital } = useHospital();
  const now = useSimNow(5000);
  const [large, setLarge] = useState(false);
  const [saved, setSaved] = useState(false);

  const visit = pending
    ? visits.find((v) => v.ref === params.ref)
    : params.token
      ? visits.find((v) => v.token === params.token) || null
      : visits[0] || null;
  const token = pending ? visit?.token : params.token || visit?.token;

  // An offline registration was confirmed by the server: show the real slip.
  useEffect(() => {
    if (pending && visit?.token) navigate(`/slip/${visit.token}`, { replace: true });
  }, [pending, visit?.token, navigate]);

  const info = token ? patientInfo(hospital, token, now) : null;
  const deptId = info?.dept || visit?.dept;
  const firstName = visit?.firstName || hospital.patients[token]?.firstName || '';
  const roomId = info?.room || (deptId ? DEPT_BY_ID[deptId].rooms[0].id : null);
  const floor = roomId ? PLACES[roomId].floor : null;

  const readText =
    token && deptId
      ? t('slip.readText', {
          token: spokenToken(token),
          dept: t.dept(deptId),
          room: roomLabel(t, info, deptId),
          floor: t.floor(floor),
          doctor: doctorLabel(t, info, deptId),
          ahead: info?.ahead ?? 0,
          wait: waitLabel(t, info),
        })
      : '';
  useScreenSpeech(pending ? t('slip.pendingText') : readText);

  if (pending && visit && !visit.token) {
    return (
      <div className="space-y-4">
        <h1 className="h1">{t('slip.title')}</h1>
        <div className="card border-2 border-warn bg-warn-soft" role="status">
          <p className="text-2xl font-bold flex items-center gap-2">
            <Icon name="clock" size={30} /> {t('slip.pendingTitle')}
          </p>
          <p className="text-lg mt-2">{t('slip.pendingText')}</p>
          <p className="text-base text-muted mt-2">{t('slip.pendingRef', { ref: visit.ref })}</p>
        </div>
        <div className="card">
          <p className="text-base text-muted">{t('slip.name')}</p>
          <p className="text-xl font-bold">{visit.firstName}</p>
          <p className="text-base text-muted mt-2">{t('slip.dept')}</p>
          <p className="text-xl font-bold">{t.dept(visit.dept)}</p>
        </div>
        <Link to={`/find?to=${DEPT_BY_ID[visit.dept].rooms[0].id}`} className="btn-primary w-full min-h-btn-lg text-xl">
          <Icon name="map" size={28} />
          <span>{t('common.showWayTo', { place: t.room(DEPT_BY_ID[visit.dept].rooms[0].id) })}</span>
        </Link>
      </div>
    );
  }

  if (!token || !deptId) {
    return (
      <div className="space-y-4">
        <h1 className="h1">{t('slip.title')}</h1>
        <p className="text-lg">{t('slip.notFound')}</p>
        <Link to="/have-slip" className="btn-primary w-full">
          <Icon name="ticket" size={26} />
          <span>{t('home.haveSlip')}</span>
        </Link>
        <Link to="/register" className="btn-secondary w-full">
          <Icon name="clipboard" size={26} />
          <span>{t('home.register')}</span>
        </Link>
      </div>
    );
  }

  const onSave = async () => {
    const ok = await saveSlipImage({
      token,
      title: `${t('appName')} · ${t('hospital')}`,
      qrText: turnUrl(token),
      filename: `opd-slip-${token}.png`,
      footer: `${t('slip.qrHint')} ${t('slip.simNote')}`,
      lines: [
        { label: t('slip.token') },
        { label: t('slip.name'), value: firstName || '—' },
        { label: t('slip.dept'), value: t.dept(deptId) },
        { label: t('slip.room'), value: `${roomLabel(t, info, deptId)}, ${t.floor(floor)}` },
        { label: t('slip.doctor'), value: doctorLabel(t, info, deptId) },
      ],
    });
    setSaved(ok);
  };

  return (
    <div className="space-y-4">
      <h1 className="h1">{t('slip.title')}</h1>
      {visit?.confirmedAt && Date.now() - visit.confirmedAt < 60000 ? (
        <p className="card bg-ok-soft border-ok text-ok font-bold text-lg" role="status">
          {t('slip.confirmedNow', { token })}
        </p>
      ) : null}

      <article className="print-area card border-2 border-primary !p-0 overflow-hidden" aria-label={t('slip.title')}>
        <div className="bg-primary text-on-primary px-4 py-2 flex items-center gap-2">
          <Icon name="plus" size={22} strokeWidth={3} />
          <span className="font-bold">{t('hospital')}</span>
        </div>
        <div className="p-4">
          <p className="text-lg text-muted">{t('slip.token')}</p>
          <p className="text-6xl font-black tracking-wider leading-none my-1">{token}</p>
          {firstName ? <p className="text-2xl font-bold">{firstName}</p> : null}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 mt-4">
            <div className="col-span-2">
              <dt className="text-base text-muted">{t('slip.dept')}</dt>
              <dd className="text-xl font-bold">{t.dept(deptId)}</dd>
            </div>
            <div>
              <dt className="text-base text-muted">{t('slip.room')}</dt>
              <dd className="text-xl font-bold">{roomLabel(t, info, deptId)}</dd>
            </div>
            <div>
              <dt className="text-base text-muted">{t('slip.floor')}</dt>
              <dd className="text-xl font-bold">{t.floor(floor)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-base text-muted">{t('slip.doctor')}</dt>
              <dd className="text-xl font-bold">{doctorLabel(t, info, deptId)}</dd>
            </div>
            <div>
              <dt className="text-base text-muted">{t('slip.ahead')}</dt>
              <dd className="text-3xl font-black">{info?.status === 'waiting' ? info.ahead : '—'}</dd>
            </div>
            <div>
              <dt className="text-base text-muted">{t('slip.wait')}</dt>
              <dd className="text-xl font-bold">{waitLabel(t, info)}</dd>
            </div>
          </dl>
          {!info?.assignedRoom && DEPT_BY_ID[deptId].rooms.length > 1 ? (
            <p className="text-base text-muted mt-2">{t('slip.roomOrNote')}</p>
          ) : null}

          <div className="flex items-center gap-4 mt-4">
            <QRCode text={turnUrl(token)} size={132} label={t('slip.qrLabel')} />
            <p className="text-base text-muted">{t('slip.qrHint')}</p>
          </div>
          <p className="hidden print:block text-sm mt-2">{t('slip.printedAt', { time: fmtClock(now) })} · {t('slip.simNote')}</p>
        </div>
      </article>

      <TermNote id="token" />

      <div className="no-print space-y-3">
        <Link to={`/find?to=${roomId}`} className="btn-primary w-full min-h-btn-lg text-xl">
          <Icon name="map" size={30} />
          <span>{t('slip.goToRoom', { place: roomLabel(t, info, deptId) })}</span>
        </Link>
        <Link to={`/turn/${token}`} className="btn-secondary w-full">
          <Icon name="users" size={26} />
          <span>{t('slip.track')}</span>
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <ListenButton text={readText} label={t('slip.readAloud')} className="btn-secondary btn-sm !min-h-btn" size={24} />
          <button type="button" className="btn-secondary btn-sm !min-h-btn" onClick={() => setLarge(true)}>
            <Icon name="expand" size={24} />
            <span>{t('slip.showLarge')}</span>
          </button>
          <button type="button" className="btn-secondary btn-sm !min-h-btn" onClick={onSave}>
            <Icon name={saved ? 'check' : 'download'} size={24} />
            <span>{saved ? t('slip.saved') : t('slip.saveImage')}</span>
          </button>
          <button type="button" className="btn-secondary btn-sm !min-h-btn" onClick={() => window.print()}>
            <Icon name="print" size={24} />
            <span>{t('slip.print')}</span>
          </button>
        </div>
      </div>

      {large ? <LargeView token={token} firstName={firstName} deptId={deptId} info={info} onClose={() => setLarge(false)} /> : null}
    </div>
  );
}
