import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { UrgentHelpProvider } from './components/UrgentHelp.jsx';
import { ScreenSpeechProvider } from './lib/screenSpeech.jsx';
import Home from './screens/Home.jsx';
import Emergency from './screens/Emergency.jsx';
import { useT } from './lib/i18n.jsx';

const Register = lazy(() => import('./screens/Register.jsx'));
const Slip = lazy(() => import('./screens/Slip.jsx'));
const Turn = lazy(() => import('./screens/Turn.jsx'));
const HaveSlip = lazy(() => import('./screens/HaveSlip.jsx'));
const FindPlace = lazy(() => import('./screens/FindPlace.jsx'));
const Settings = lazy(() => import('./screens/Settings.jsx'));
const Lost = lazy(() => import('./screens/Lost.jsx'));
const LanguagePicker = lazy(() => import('./screens/LanguagePicker.jsx'));
const NotFound = lazy(() => import('./screens/NotFound.jsx'));
// Less-used screens load when opened, so the first screen appears fast on a weak connection.
// Home and Emergency are always loaded at once.
// Staff screens are loaded only when opened, so patient phones download less.
const Staff = lazy(() => import('./staff/StaffApp.jsx'));
const Board = lazy(() => import('./staff/Board.jsx'));

// The loading message appears inside the page frame, so the Emergency bar never disappears.
function Patient({ children }) {
  return (
    <Layout>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </Layout>
  );
}

function ScrollAndFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Move focus to the page so screen readers announce the new screen.
    const main = document.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

function Loading() {
  const t = useT();
  return <p className="p-6 text-lg">{t('common.loading')}</p>;
}

export default function App() {
  const t = useT();
  useEffect(() => {
    document.title = `${t('appName')} · ${t('hospital')}`;
  }, [t]);

  return (
    <ScreenSpeechProvider>
      <UrgentHelpProvider>
        <ScrollAndFocus />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Patient><Home /></Patient>} />
            <Route path="/language" element={<Patient><LanguagePicker /></Patient>} />
            <Route path="/register" element={<Patient><Register /></Patient>} />
            <Route path="/slip" element={<Patient><Slip /></Patient>} />
            <Route path="/slip/:token" element={<Patient><Slip /></Patient>} />
            <Route path="/pending/:ref" element={<Patient><Slip pending /></Patient>} />
            <Route path="/turn/:token" element={<Patient><Turn /></Patient>} />
            <Route path="/have-slip" element={<Patient><HaveSlip /></Patient>} />
            <Route path="/find" element={<Patient><FindPlace /></Patient>} />
            <Route path="/lost" element={<Patient><Lost /></Patient>} />
            <Route path="/emergency" element={<Patient><Emergency /></Patient>} />
            <Route path="/settings" element={<Patient><Settings /></Patient>} />
            <Route path="/staff/*" element={<Staff />} />
            <Route path="/counter" element={<Staff counter />} />
            <Route path="/board" element={<Board />} />
            <Route path="*" element={<Patient><NotFound /></Patient>} />
          </Routes>
        </Suspense>
      </UrgentHelpProvider>
    </ScreenSpeechProvider>
  );
}
