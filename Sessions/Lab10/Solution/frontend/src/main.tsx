import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import { msalConfig } from './auth/authConfig';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

// If a sign-in finishes and there's no "active" account yet (the common
// case the very first time someone signs in), make the freshly-signed-in
// account active. Without this, useMsal()'s `accounts` array is non-empty
// but nothing is "the" account, and acquireTokenSilent has nothing to ask for.
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    const account = (event.payload as { account?: import('@azure/msal-browser').AccountInfo }).account;
    if (account) msalInstance.setActiveAccount(account);
  }
});

// MSAL needs to finish reading any in-flight redirect/cache state before the
// app renders — `initialize()` (and, for popup-only flows like this one,
// `handleRedirectPromise()` is a no-op but still safe to await) — so we wait
// for it instead of rendering straight away.
msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>,
  );
});
