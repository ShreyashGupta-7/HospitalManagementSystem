// Waiting-room TV board: the token in each room, the next three, delays, and spoken
// announcements. Text switches between languages every few seconds.
import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { makeT, LANGS } from '../lib/i18n.jsx';
import { useHospital, useSimNow, useNow } from '../store/hooks.js';
import { deptStats, fmtClock } from '../../shared/engine.js';
import { DEPARTMENTS } from '../data/departments.js';
import { callChime, unlockAudio } from '../lib/sound.js';
import { speakParts, hasVoice, useVoices } from '../lib/speech.js';
import { spokenToken } from '../lib/qr.js';
import { load, save } from '../lib/storage.js';

const ROTATE_MS = 9000;
const HIGHLIGHT_MS = 20000;

export default function Board() {
  const { hospital, conn } = useHospital();
  const now = useSimNow(1000);
  const realNow = useNow(1000);
  useVoices();
  const [langs, setLangs] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('langs');
    const fromUrl = p ? p.split(',').filter((c) => LANGS.some((l) => l.code === c)) : null;
    return fromUrl?.length ? fromUrl : load('opd.board.langs', ['en', 'hi']);
  });
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const seen = useRef(null);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => i + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    save('opd.board.langs', langs);
  }, [langs]);

  const lang = langs[idx % langs.length] || 'en';
  const t = makeT(lang);

  // Announce every newly called token, once, in each chosen language that has a voice.
  useEffect(() => {
    const calls = hospital.log.filter((e) => e.type === 'called');
    if (seen.current == null) {
      seen.current = new Set(calls.map((e) => e.id));
      return;
    }
    const fresh = calls.filter((e) => !seen.current.has(e.id));
    fresh.forEach((e) => seen.current.add(e.id));
    if (!started) return;
    for (const e of fresh) {
      queue.current = queue.current.then(async () => {
        callChime();
        await new Promise((r) => setTimeout(r, 1100));
        // Tamil (or any language) is spoken only if this device has a voice for it.
        // Hindi and English are always tried, so nobody misses their call.
        const spoken = [...new Set([...langs, 'hi', 'en'])].filter((c) => hasVoice(c));
        await speakParts(spoken.map((c) => {
          const tl = makeT(c);
          return { lang: c, text: tl('board.announce', { token: spokenToken(e.token), room: tl.room(e.room) }) };
        }));
      });
    }
  }, [hospital.log, started, langs]);

  const recent = new Set(hospital.log.filter((e) => e.type === 'called' && realNow - e.at < HIGHLIGHT_MS).map((e) => e.token));
  const stats = DEPARTMENTS.map((d) => deptStats(hospital, d.id, now));
  const delays = stats.flatMap((s) =>
    s.rooms
      .filter((r) => r.status !== 'available')
      .map((r) =>
        r.status === 'break'
          ? t('board.onBreak', { room: t.room(r.id), time: fmtClock(r.until) })
          : t('board.late', { room: t.room(r.id), n: r.lateMin }),
      ),
  );

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex flex-col" lang={lang}>
      <header className="flex flex-wrap items-center gap-4 px-6 py-4 border-b border-white/15">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d6559]">
          <Icon name="plus" size={36} strokeWidth={3} />
        </span>
        <div className="mr-auto">
          <h1 className="text-3xl font-black leading-tight">{t('board.title')}</h1>
          <p className="text-xl text-white/80">{t('hospital')} · {t('appName')}</p>
        </div>
        <div className="text-right">
          <p className="text-lg text-white/70">{t('board.clock')}</p>
          <p className="text-4xl font-black tabular-nums">{fmtClock(now)}</p>
        </div>
        {conn.mode === 'server' && conn.status !== 'online' ? (
          <span className="pill bg-amber-400 text-black"><Icon name="wifiOff" size={20} /> {t('conn.offline')}</span>
        ) : null}
      </header>

      <main id="main" className="flex-1 grid gap-4 p-4 sm:p-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 content-start">
        {stats.map((s) => {
          const d = DEPARTMENTS.find((x) => x.id === s.dept);
          return (
            <section key={s.dept} className="rounded-3xl bg-white/[0.07] border border-white/15 p-4 flex flex-col gap-3" aria-label={t.dept(s.dept)}>
              <h2 className="text-2xl font-bold flex items-center gap-3 leading-tight">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: d.colour }}>
                  <Icon name={d.icon} size={26} />
                </span>
                <span className="min-w-0">{t.dept(s.dept)}</span>
              </h2>
              {s.rooms.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-2xl px-4 py-3 ${recent.has(r.serving) ? 'bg-[#facc15] text-black' : 'bg-white/10'}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xl font-semibold">{t.room(r.id)}</span>
                    <span className="text-base opacity-80">{t('board.now')}</span>
                  </div>
                  <p className="text-5xl font-black tracking-wider tabular-nums leading-tight">{r.serving || t('board.none')}</p>
                  {r.status !== 'available' ? (
                    <p className="text-lg font-semibold text-[#fcd34d] flex items-center gap-1">
                      <Icon name={r.status === 'break' ? 'pause' : 'clock'} size={20} />
                      {r.status === 'break' ? t('board.breakShort', { time: fmtClock(r.until) }) : t('board.lateShort', { n: r.lateMin })}
                    </p>
                  ) : null}
                </div>
              ))}
              <div>
                <p className="text-lg text-white/75">{t('board.next')}</p>
                <p className="text-2xl font-bold tracking-wide tabular-nums">{s.next.length ? s.next.join('  ·  ') : t('board.none')}</p>
              </div>
            </section>
          );
        })}
        <section className="rounded-3xl bg-white/[0.07] border border-white/15 p-4" aria-label={t('board.delays')}>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Icon name="clock" size={26} /> {t('board.delays')}</h2>
          {delays.length ? (
            <ul className="mt-2 space-y-1 text-xl text-[#fcd34d]">{delays.map((x) => <li key={x}>{x}</li>)}</ul>
          ) : (
            <p className="mt-2 text-xl text-white/85">{t('board.noDelays')}</p>
          )}
          <p className="mt-4 text-lg text-white/75">{t('board.footer')}</p>
        </section>
      </main>

      <footer className="bg-[#b41818] px-6 py-3 text-xl font-bold flex items-center gap-3">
        <Icon name="emergency" size={30} /> <span>{t('board.emergencyLine')}</span>
      </footer>

      {!started ? (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-3xl bg-[#111a2e] border border-white/20 p-6 space-y-4 text-center">
            <Icon name="tv" size={56} className="mx-auto" />
            <fieldset className="text-left">
              <legend className="text-xl font-bold mb-2">Languages / भाषाएँ / மொழிகள்</legend>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => {
                  const on = langs.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      lang={l.code}
                      aria-pressed={on}
                      onClick={() => setLangs((cur) => (on ? (cur.length > 1 ? cur.filter((c) => c !== l.code) : cur) : [...cur, l.code]))}
                      className={`btn-sm btn border-2 ${on ? 'bg-[#facc15] text-black border-[#facc15]' : 'bg-transparent text-white border-white/40'}`}
                    >
                      {on ? <Icon name="check" size={18} /> : null} {l.name}
                      {!hasVoice(l.code) ? <span className="text-sm opacity-80">(no voice)</span> : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <button
              type="button"
              className="btn w-full min-h-btn-lg text-2xl bg-[#facc15] text-black"
              autoFocus
              onClick={() => {
                unlockAudio();
                setStarted(true);
                document.documentElement.requestFullscreen?.().catch(() => {});
              }}
            >
              <Icon name="speaker" size={32} /> {t('board.start')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
