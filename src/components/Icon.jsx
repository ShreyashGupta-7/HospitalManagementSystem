// Inline SVG icons (24 x 24, drawn with lines). No icon font or image downloads.
// Icons are decorative (aria-hidden) unless a `label` is given.

const P = {
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  forward: <path d="M9 5l7 7-7 7" />,
  speaker: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16 9a4 4 0 010 6" /><path d="M18.5 6.5a8 8 0 010 11" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
  emergency: <><path d="M12 2v3M4.2 5.2l2 2M19.8 5.2l-2 2" /><path d="M6 20v-6a6 6 0 0112 0v6" /><path d="M4 20h16" /><path d="M12 12v4M10 14h4" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  bell: <><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 003.4 0" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 10h6M9 14h6M9 18h3" /></>,
  ticket: <><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4z" /><path d="M14 5v14" strokeDasharray="2 2" /></>,
  map: <><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  pin: <><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  stethoscope: <><path d="M6 3v6a4 4 0 008 0V3" /><path d="M10 13v2a5 5 0 0010 0v-2" /><circle cx="20" cy="11" r="2" /></>,
  child: <><circle cx="12" cy="5" r="2.5" /><path d="M12 8v7M8 11h8M10 21l2-6 2 6" /></>,
  mother: <><circle cx="10" cy="5" r="2.5" /><path d="M10 8c-3 0-4 4-4 7h3l1 6M10 8c2 0 3.5 1.5 4 4a3 3 0 01-1 4l-1 5" /><circle cx="16" cy="13" r="2" /></>,
  bone: <path d="M8.5 6.5a2.5 2.5 0 10-3.5 3.5L4 11a2.5 2.5 0 103.5 3.5l7-7A2.5 2.5 0 1011 4l-1 1zM15.5 17.5a2.5 2.5 0 103.5-3.5L20 13a2.5 2.5 0 10-3.5-3.5l-7 7A2.5 2.5 0 1013 20l1-1z" />,
  ear: <><path d="M7 9a5 5 0 0110 0c0 3-3 4-3 7a3 3 0 01-6 0" /><path d="M10 9a2 2 0 014 0c0 1.5-2 2-2 3.5" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  skin: <><path d="M6 21V9a6 6 0 0112 0v12" /><circle cx="10" cy="12" r="1" /><circle cx="14" cy="15" r="1" /><circle cx="11" cy="17" r="1" /></>,
  door: <><path d="M5 21V4a1 1 0 011-1h10a1 1 0 011 1v17" /><path d="M3 21h18M14 12h.01" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.8-2.5 2.2-2.5 4" /><path d="M12 17h.01" /></>,
  pill: <><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" /><path d="M8.5 8.5l7 7" /></>,
  flask: <><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 001.3 2h12.4a1.5 1.5 0 001.3-2L14 9V3" /><path d="M7 15h10" /></>,
  xray: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 6v12M8 9h8M7 12h10M8 15h8" /></>,
  water: <path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z" />,
  toilet: <><circle cx="7" cy="4.5" r="2" /><circle cx="17" cy="4.5" r="2" /><path d="M5 22v-7H4l1.5-6h3L10 15H9v7M15 22V9h4v13M12 3v19" /></>,
  wheelchair: <><circle cx="10" cy="4" r="2" /><path d="M10 7v7h6l3 5" /><path d="M10 10h5" /><path d="M7.5 11.5a5.5 5.5 0 108 6" /></>,
  lift: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 9l3-3 3 3M9 15l3 3 3-3" /></>,
  stairs: <path d="M3 21h5v-5h5v-5h5V6h3" />,
  ramp: <><path d="M3 20h18L3 10z" /><path d="M3 10l18 10" /></>,
  chair: <><path d="M7 3v9h10" /><path d="M7 12l-1 9M17 12l1 9M7 16h10" /></>,
  bed: <><path d="M3 18V6M3 14h18v4M21 14v-3a3 3 0 00-3-3h-7v6" /><circle cx="7" cy="10.5" r="2" /></>,
  nurse: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0114 0" /><path d="M12 3v3M10.5 4.5h3" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></>,
  print: <><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 14h12v7H6z" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 21h16" /></>,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  check: <path d="M4 12l5 5L20 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  female: <><circle cx="12" cy="8" r="5" /><path d="M12 13v8M9 18h6" /></>,
  male: <><circle cx="10" cy="14" r="5" /><path d="M14 10l6-6M15 4h5v5" /></>,
  other: <><circle cx="12" cy="12" r="5" /><path d="M12 2v5M12 17v5" /></>,
  message: <><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9h8M8 12h5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>,
  text: <path d="M4 7V5h10v2M9 5v14M7 19h4M14 12v-1h7v1M17.5 11v8M16 19h3" />,
  contrast: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18a9 9 0 000-18z" fill="currentColor" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  refresh: <><path d="M20 11a8 8 0 10-2.3 5.7" /><path d="M20 4v7h-7" /></>,
  wifiOff: <><path d="M2 2l20 20" /><path d="M8.5 16.5a5 5 0 017 0M5 12.9a10 10 0 015.2-2.8M19 12.9a10 10 0 00-2.2-1.6M2 8.8a15 15 0 014.2-2.6M22 8.8A15 15 0 0010.7 5" /><path d="M12 20h.01" /></>,
  wifi: <><path d="M8.5 16.5a5 5 0 017 0M5 12.9a10 10 0 0114 0M2 8.8a15 15 0 0120 0" /><path d="M12 20h.01" /></>,
  install: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M12 7v7M9 11l3 3 3-3M10 18h4" /></>,
  hand: <><path d="M8 13V5a1.5 1.5 0 013 0v6M11 11V4a1.5 1.5 0 013 0v7M14 11V5.5a1.5 1.5 0 013 0V13" /><path d="M17 9.5a1.5 1.5 0 013 0V15a7 7 0 01-7 7h-1a7 7 0 01-6-3.4L4 15a1.5 1.5 0 012.6-1.5L8 15" /></>,
  heart: <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />,
  tv: <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0114 0" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14a5 5 0 015 5" /></>,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  turnLeft: <path d="M18 20v-8a3 3 0 00-3-3H6M10 5L6 9l4 4" />,
  turnRight: <path d="M6 20v-8a3 3 0 013-3h9M14 5l4 4-4 4" />,
  walk: <><circle cx="13" cy="4" r="2" /><path d="M9 21l2.5-6.5L14 17v4M8 12l2.5-4.5 3 1L16 11l2 1M10.5 7.5L11.5 14.5" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  pause: <><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></>,
  move: <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export default function Icon({ name, size = 28, label, className = '', strokeWidth = 2 }) {
  const content = P[name] || P.help;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}
      {content}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P);
