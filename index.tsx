
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './src/components/ThemeProvider';
import { Toaster } from 'sonner';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="sunlight-theme">
      <App />
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  </React.StrictMode>
);
