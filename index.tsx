
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './src/components/ThemeProvider';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Optional: Prompt user to refresh
  },
  onOfflineReady() {
    console.log('App is ready to work offline');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ThemeProvider defaultTheme="system" storageKey="sunlight-theme">
    <App />
    <Toaster position="top-right" richColors closeButton />
  </ThemeProvider>
);
