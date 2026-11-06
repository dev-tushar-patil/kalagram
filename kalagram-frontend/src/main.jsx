import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import AppRoutes from './routes/AppRoutes.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <MotionConfig reducedMotion="user">
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>,
);
