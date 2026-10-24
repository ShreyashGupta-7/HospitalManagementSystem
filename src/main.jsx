import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SettingsProvider } from './lib/settings.jsx';
import { I18nProvider } from './lib/i18n.jsx';
import { startStore } from './store/store.js';
import { registerPWA } from './lib/pwa.js';
import './index.css';

startStore();
registerPWA();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SettingsProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
