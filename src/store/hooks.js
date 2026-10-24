import { useEffect, useState, useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, realNow } from './store.js';
import { simNow } from '../../shared/engine.js';

export function useHospital() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Re-renders every `ms` and returns the current real time (server-corrected). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(realNow());
  useEffect(() => {
    const id = setInterval(() => setNow(realNow()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Hospital clock in minutes since midnight. */
export function useSimNow(ms = 1000) {
  const { hospital } = useHospital();
  const now = useNow(ms);
  return simNow(hospital, now);
}
