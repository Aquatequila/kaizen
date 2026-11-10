import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

let applyUpdate: (reloadPage?: boolean) => Promise<void> = async () => {};
applyUpdate = registerSW({ immediate: true, onNeedRefresh: () => window.dispatchEvent(new CustomEvent('kaizen-update-ready', { detail: () => { void applyUpdate(true); } })) });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
