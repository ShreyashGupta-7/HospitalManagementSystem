import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Toggle from '../components/Toggle.jsx';
import RouteView from '../components/RouteView.jsx';
import { useT, makeT } from '../lib/i18n.jsx';
import { useSettings } from '../lib/settings.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { PLACES, PLACE_GROUPS, START_POINTS } from '../data/hospital.js';
import { buildSteps, findRoute } from '../lib/route.js';
import { stepText } from '../lib/directionsText.js';

const ALL_TARGETS = PLACE_GROUPS.flatMap((g) => g.places);

export function AvoidStairsSwitch() {
  const t = useT();
  const { settings, update } = useSettings();
  return (
    <div className="card !py-1">
      <Toggle
        id="avoid-stairs"
        checked={settings.avoidStairs}
        onChange={(v) => update({ avoidStairs: v })}
        label={t('find.avoidStairs')}
        hint={t('find.avoidStairsHint')}
        icon={<Icon name="wheelchair" size={30} className="text-primary" />}
      />
    </div>
  );
}

export function FromSelect({ value, onChange, extra = [] }) {
  const t = useT();
  const options = [...new Set([...extra, ...START_POINTS])];
  return (
    <div>
      <label htmlFor="from" className="label">{t('find.from')}</label>
      <select id="from" className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((id) => (
          <option key={id} value={id}>
            {t.place(id)} ({t(`floors.short.${PLACES[id].floor}`)})
          </option>
        ))}
      </select>
    </div>
  );
}

function PlacePicker({ onPick }) {
  const t = useT();
  const en = makeT('en');
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return null;
    return ALL_TARGETS.filter((id) => {
      const p = PLACES[id];
      const hay = [t.place(id), en.place(id), t.landmark(id), ...(p.tags || [])].join(' ').toLowerCase();
      return hay.includes(query);
    });
  }, [query, t, en]);

  const Item = ({ id }) => (
    <li>
      <button type="button" onClick={() => onPick(id)} className="w-full flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left min-h-btn hover:bg-soft">
        <Icon name={PLACES[id].icon} size={30} className={PLACES[id].type === 'dept' ? 'text-danger' : 'text-primary'} />
        <span className="flex-1 min-w-0">
          <span className="block text-lg font-semibold leading-tight">{t.place(id)}</span>
          <span className="block text-base text-muted">{t.floor(PLACES[id].floor)}</span>
        </span>
        <Icon name="forward" size={24} className="text-muted" />
      </button>
    </li>
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="q" className="label">{t('find.to')}</label>
        <div className="relative">
          <Icon name="search" size={26} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="q" type="search" className="input !pl-12" placeholder={t('find.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {matches ? (
        matches.length ? (
          <ul className="grid gap-2">{matches.map((id) => <Item key={id} id={id} />)}</ul>
        ) : (
          <p className="text-lg">{t('find.noResults')}</p>
        )
      ) : (
        PLACE_GROUPS.map((g) => (
          <section key={g.id}>
            <h2 className="h2 mb-2">{t(`find.groups.${g.id}`)}</h2>
            <ul className="grid gap-2">{g.places.map((id) => <Item key={id} id={id} />)}</ul>
          </section>
        ))
      )}
    </div>
  );
}

export default function FindPlace() {
  const t = useT();
  const { settings } = useSettings();
  const [params, setParams] = useSearchParams();
  const to = PLACES[params.get('to')] ? params.get('to') : null;
  const from = PLACES[params.get('from')] ? params.get('from') : to === 'entrance' ? 'helpdesk' : 'entrance';

  const speech = useMemo(() => {
    if (!to) return `${t('find.title')}. ${t('find.to')}`;
    const r = findRoute(from, to, { avoidStairs: settings.avoidStairs });
    return r ? buildSteps(r).map((s) => stepText(s, t)).join(' ') : t('find.noRoute');
  }, [to, from, settings.avoidStairs, t]);
  useScreenSpeech(speech);

  const setP = (patch) => {
    const next = { to, from, ...patch };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  };

  if (!to) {
    return (
      <div>
        <h1 className="h1 mb-3">{t('find.title')}</h1>
        <PlacePicker onPick={(id) => setP({ to: id })} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-base text-muted">{t('find.title')}</p>
        <h1 className="h1 flex items-center gap-2">
          <Icon name={PLACES[to].icon} size={32} className="text-primary" />
          <span>{t.place(to)}</span>
        </h1>
        <p className="text-lg">{t.floor(PLACES[to].floor)} · {t.landmark(to)}</p>
        <button type="button" className="btn-ghost btn-sm mt-1 !px-0" onClick={() => setParams({})}>
          <Icon name="search" size={22} />
          <span>{t('find.changeTo')}</span>
        </button>
      </div>

      <div className="card space-y-2">
        <FromSelect value={from} onChange={(v) => setP({ from: v })} />
      </div>
      <AvoidStairsSwitch />

      <RouteView from={from} to={to} avoidStairs={settings.avoidStairs} />

      <Link to={`/lost?to=${to}&from=${from}`} className="btn w-full min-h-btn-lg text-xl bg-warn-soft text-ink border-2 border-warn">
        <Icon name="compass" size={30} />
        <span>{t('find.lost')}</span>
      </Link>
    </div>
  );
}
