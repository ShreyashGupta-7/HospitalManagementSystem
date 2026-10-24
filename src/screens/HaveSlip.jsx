import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import MicButton from '../components/MicButton.jsx';
import { useT } from '../lib/i18n.jsx';
import { useScreenSpeech } from '../lib/screenSpeech.jsx';
import { parseToken } from '../lib/qr.js';
import { useHospital } from '../store/hooks.js';
import { useVisits } from '../store/visits.js';

const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window && Boolean(navigator.mediaDevices?.getUserMedia);

function Scanner({ onFound, onError, onClose }) {
  const t = useT();
  const videoRef = useRef(null);
  // Keep the latest callbacks without restarting the camera on every re-render.
  const cb = useRef({ onFound, onError });
  cb.current = { onFound, onError };
  useEffect(() => {
    let stream = null;
    let stopped = false;
    let timer = null;
    (async () => {
      try {
        const formats = (await window.BarcodeDetector.getSupportedFormats?.()) || ['qr_code'];
        if (!formats.includes('qr_code')) throw new Error('no-qr');
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const scan = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const hit = codes.map((c) => parseToken(c.rawValue)).find(Boolean);
            if (hit) {
              cb.current.onFound(hit);
              return;
            }
          } catch {
            /* keep trying */
          }
          timer = setTimeout(scan, 250);
        };
        scan();
      } catch {
        cb.current.onError();
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  return (
    <div className="card space-y-3">
      <p className="text-lg">{t('have.scanHint')}</p>
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-square max-w-sm mx-auto">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label={t('have.scanning')} />
        <div className="absolute inset-[18%] border-4 border-white/90 rounded-2xl" aria-hidden="true" />
      </div>
      <p className="text-base text-muted" role="status">{t('have.scanning')}</p>
      <button type="button" className="btn-secondary w-full" onClick={onClose}>
        <Icon name="x" size={24} />
        <span>{t('common.close')}</span>
      </button>
    </div>
  );
}

export default function HaveSlip() {
  const t = useT();
  const navigate = useNavigate();
  const { hospital, conn } = useHospital();
  const visits = useVisits();
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  useScreenSpeech(`${t('have.title')}. ${t('have.enter')}. ${t('have.example')}`);

  const open = (tok) => {
    const token = parseToken(tok);
    if (!token) {
      setError(t('have.invalid'));
      return;
    }
    // In server mode a phone that is offline may not know the token yet; open it anyway.
    if (!hospital.patients[token] && conn.status === 'online') {
      setError(t('have.notFound'));
      return;
    }
    navigate(`/turn/${token}`);
  };

  const recent = visits.filter((v) => v.token).slice(0, 3);

  return (
    <div className="space-y-4">
      <h1 className="h1">{t('have.title')}</h1>
      <form
        className="card space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          open(value);
        }}
        noValidate
      >
        <label htmlFor="token" className="label">{t('have.enter')}</label>
        <input
          id="token"
          className="input text-3xl font-bold tracking-widest uppercase text-center"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase().slice(0, 8));
            setError(null);
          }}
          placeholder={t('have.placeholder')}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-describedby="token-hint token-error"
          aria-invalid={Boolean(error)}
        />
        <p id="token-hint" className="text-base text-muted">{t('have.example')}</p>
        <MicButton onText={(s) => setValue(s.toUpperCase().replace(/\s+/g, '').slice(0, 8))} />
        {error ? (
          <p id="token-error" className="text-danger text-lg font-semibold" role="alert">{error}</p>
        ) : null}
        <button type="submit" className="btn-primary w-full min-h-btn-lg text-xl">
          <Icon name="search" size={28} />
          <span>{t('have.go')}</span>
        </button>
      </form>

      {canScan ? (
        scanning ? (
          <Scanner
            onFound={(tok) => {
              setScanning(false);
              navigate(`/turn/${tok}`);
            }}
            onError={() => {
              setScanning(false);
              setError(t('have.cameraError'));
            }}
            onClose={() => setScanning(false)}
          />
        ) : (
          <button type="button" className="btn-secondary w-full min-h-btn-lg" onClick={() => setScanning(true)}>
            <Icon name="qr" size={30} />
            <span>{t('have.scan')}</span>
          </button>
        )
      ) : null}

      {recent.length ? (
        <section>
          <h2 className="h2 mb-2">{t('have.recent')}</h2>
          <div className="grid gap-2">
            {recent.map((v) => (
              <Link key={v.ref} to={`/turn/${v.token}`} className="btn-secondary !justify-between">
                <span className="text-2xl font-black tracking-wide">{v.token}</span>
                <span className="text-base text-muted">{t.dept(v.dept)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
