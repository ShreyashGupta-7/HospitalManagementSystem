// Turns direction steps (from route.js) into a sentence in the chosen language.
// `t` is a translator from makeT(), so the same route can be read in any language.

export function stepText(step, t) {
  const m = Math.max(1, Math.round(step.metres || 0));
  switch (step.type) {
    case 'already':
      return t('dir.already', { place: t.place(step.place) });
    case 'start':
      return t('dir.start', { place: t.place(step.place) });
    case 'walk':
      return m < 4 ? t('dir.walkShort') : t('dir.walk', { m });
    case 'turn': {
      const key = step.dir === 'left' ? 'turnLeft' : step.dir === 'right' ? 'turnRight' : 'turnAround';
      return m < 4 ? t(`dir.${key}`) : t(`dir.${key}Walk`, { m });
    }
    case 'lift':
      return t(step.dir === 'up' ? 'dir.liftUp' : 'dir.liftDown', { floor: (t.floorIn || t.floor)(step.floor) });
    case 'stairs':
      return t(step.dir === 'up' ? 'dir.stairsUp' : 'dir.stairsDown', { floor: (t.floorIn || t.floor)(step.floor) });
    case 'exit': {
      const base = t(step.via === 'lift' ? 'dir.exitLift' : 'dir.exitStairs');
      return base;
    }
    case 'reach': {
      const kind = step.place.startsWith('lift') ? 'Lift' : 'Stairs';
      if (step.side === 'ahead') return t(`dir.reach${kind}Ahead`);
      return t(`dir.reach${kind}`, { side: t(`dir.${step.side}`) });
    }
    case 'steps':
      return t(step.down ? 'dir.stepsDown' : 'dir.steps', { place: t.place(step.place) });
    case 'ramp':
      return t('dir.ramp');
    case 'arrive': {
      const params = { place: t.place(step.place), landmark: t.landmark(step.place) };
      if (step.side === 'ahead') return t('dir.arriveAhead', params);
      const side = t(`dir.${step.side}`);
      if (step.ordinal) {
        const ords = t.raw('dir.ordinals') || [];
        const ordinal = ords[step.ordinal - 1];
        if (ordinal) return t('dir.arriveOrdinal', { ...params, side, ordinal });
      }
      return t('dir.arriveSide', { ...params, side });
    }
    default:
      return '';
  }
}

export function allStepsText(steps, t) {
  return steps.map((s) => stepText(s, t)).filter(Boolean);
}
