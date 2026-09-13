import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PublicView } from './components/PublicView';
import { Dashboard } from './components/Dashboard';

const AppRoot: React.FC = () => {
  const { user, loading, loginWithGateway } = useAuth();
  const [view, setView] = useState<'public' | 'dashboard'>('public');

  // Parse path for username support e.g. /@username or /u/username
  const path = window.location.pathname;
  let customUsername: string | undefined = undefined;

  if (path.startsWith('/@')) {
    customUsername = path.substring(2);
  } else if (path.startsWith('/u/')) {
    customUsername = path.substring(3);
  }

  // Handle URL navigation to dashboard
  if (path === '/dashboard' && view !== 'dashboard') {
    if (user) {
      setView('dashboard');
    }
  }

  const handleOpenDashboard = () => {
    if (!user) {
      loginWithGateway();
    } else {
      setView('dashboard');
    }
  };

  if (view === 'dashboard') {
    if (!user) {
      return (
        <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Autentikasi Diperlukan</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm">
            Silakan masuk dengan akun R2Art Login Gateway untuk mengakses studio kelola tautan & analitik.
          </p>
          <button
            onClick={loginWithGateway}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 font-bold rounded-xl text-white transition-all shadow-lg shadow-sky-500/25"
          >
            Masuk dengan R2Art SSO
          </button>
        </div>
      );
    }

    return <Dashboard onBackToLive={() => setView('public')} />;
  }

  return (
    <PublicView
      username={customUsername}
      isAuthenticated={!!user}
      onOpenDashboard={handleOpenDashboard}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}
