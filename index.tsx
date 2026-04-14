
import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthView from './components/AuthView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import SuperAdminDashboard from './app/super-admin/page';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isSuperAdmin = window.location.pathname.startsWith('/super-admin');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isSuperAdmin ? <SuperAdminDashboard /> : <AuthView />}
    </ErrorBoundary>
  </React.StrictMode>
);