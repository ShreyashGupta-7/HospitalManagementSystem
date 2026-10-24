import { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import FloorPlan from './FloorPlan.jsx';
import ListenButton from './ListenButton.jsx';
import { useT } from '../lib/i18n.jsx';
import { findRoute, buildSteps, routeByFloor, usesStairs, walkMinutes } from '../lib/route.js';
import { stepText } from '../lib/directionsText.js';
import { speak, useVoices } from '../lib/speech.js';

const STEP_ICON = {
  start: 'pin',
  already: 'check',
  walk: 'walk',
  turn: 'turnLeft',
  lift: 'lift',
  stairs: 'stairs',
  exit: 'walk',
  reach: 'lift',
  steps: 'stairs',
  ramp: 'ramp',
  arrive: 'door',
};

function iconFor(step) {
  if (step.type === 'turn') return step.dir === 'right' ? 'turnRight' : step.dir === 'left' ? 'turnLeft' : 'refresh';
  if (step.type === 'reach') return step.place.startsWith('lift') ? 'lift' : 'stairs';
  if (step.type === 'lift' || step.type === 'stairs') return step.dir === 'up' ? 'arrowUp' : 'arrowDown';
  return STEP_ICON[step.type] || 'walk';
}

export function useRoute(from, to, avoidStairs) {
  return useMemo(() => {
    const route = findRoute(from, to, { avoidStairs });
    return { route, steps: buildSteps(route), floors: routeByFloor(route) };
  }, [from, to, avoidStairs]);
}

/** Map(s) and step-by-step directions from one place to another. */
export default function RouteView({ from, to, avoidStairs, showMaps = true, headingLevel = 2 }) {
  const t = useT();
  const voices = useVoices();
  const [big, setBig] = useState(false);
  const [active, setActive] = useState(null);
  const { route, steps, floors } = useRoute(from, to, avoidStairs);
  const H = `h${headingLevel}`;

  if (!route) {
    return (
      <p className="card bg-warn-soft text-lg" role="alert">
        {t('find.noRoute')}
      </p>
    );
  }

  const texts = steps.map((s) => stepText(s, t));
  const canSpeak = voices.has(t.lang);
  const stairs = usesStairs(route);

  return (
    <section aria-label={t('find.route')} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-base">
        <span className="pill bg-soft border border-line">
          <Icon name="walk" size={20} /> {t('find.distance', { m: Math.round(route.metres), min: walkMinutes(route.metres) })}
        </span>
        <span className={`pill border ${stairs ? 'bg-warn-soft border-warn text-ink' : 'bg-ok-soft border-ok text-ok'}`}>
          <Icon name={stairs ? 'stairs' : 'lift'} size={20} /> {stairs ? t('find.usesStairs') : t('find.noStairs')}
        </span>
      </div>

      {showMaps
        ? floors.map((seg) => (
            <div key={seg.floor + seg.points[0].idx}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <H className="h2">{t('find.mapOf', { floor: t.floorIn(seg.floor) })}</H>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setBig((b) => !b)} aria-pressed={big}>
                  <Icon name="expand" size={20} />
                  <span>{big ? t('find.smaller') : t('find.bigger')}</span>
                </button>
              </div>
              <FloorPlan
                floor={seg.floor}
                points={seg.points}
                from={from}
                to={to}
                active={active}
                big={big}
                label={t('find.mapLabel', { floor: t.floorIn(seg.floor), from: t.place(from), to: t.place(to) })}
              />
            </div>
          ))
        : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <H className="h2">{t('find.steps')}</H>
          <ListenButton text={texts.join(' ')} label={t('find.listenAll')} className="btn-secondary btn-sm" size={22} />
        </div>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={i}>
              <div
                className={`flex items-start gap-3 rounded-2xl border p-3 ${
                  s.type === 'arrive' ? 'bg-ok-soft border-ok' : active === s.at ? 'bg-warn-soft border-warn' : 'bg-surface border-line'
                }`}
              >
                <span className="flex flex-col items-center shrink-0">
                  <span className="text-base font-bold text-muted" aria-hidden="true">
                    {i + 1}
                  </span>
                  <Icon name={iconFor(s)} size={30} className="text-primary" />
                </span>
                <p className="flex-1 text-lg leading-snug pt-1">
                  <span className="sr-only">{t('find.stepOf', { n: i + 1 })}: </span>
                  {texts[i]}
                </p>
                {canSpeak ? (
                  <button
                    type="button"
                    className="btn-ghost btn-sm !px-2 shrink-0"
                    onClick={() => {
                      setActive(s.at);
                      speak(texts[i], t.lang);
                    }}
                    aria-label={t('find.listenStep', { n: i + 1 })}
                  >
                    <Icon name="speaker" size={24} />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
