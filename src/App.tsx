import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PublicView } from './components/PublicView';
import { Dashboard } from './components/Dashboard';

const AppRoot: React.FC = () => {
  const { user, profile, loading, loginWithGateway } = useAuth();
  const [view, setView] = useState<'public' | 'dashboard'>('public');
  const [customUsername, setCustomUsername] = useState<string | undefined>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/@')) return path.substring(2);
    if (path.startsWith('/u/')) return path.substring(3);
    if (path.length > 1) {
      const seg = path.substring(1).split('/')[0];
      if (!['dashboard', 'api', 'callback', 'login', 'logout'].includes(seg.toLowerCase())) {
        return seg;
      }
    }
    return undefined;
  });

  React.useEffect(() => {
    const parseUrlState = () => {
      const path = window.location.pathname;
      if (path === '/dashboard') {
        setView('dashboard');
      } else {
        setView('public');
        if (path.startsWith('/@')) setCustomUsername(path.substring(2));
        else if (path.startsWith('/u/')) setCustomUsername(path.substring(3));
        else if (path.length > 1) {
          const seg = path.substring(1).split('/')[0];
          if (!['dashboard', 'api', 'callback', 'login', 'logout'].includes(seg.toLowerCase())) {
            setCustomUsername(seg);
          } else {
            setCustomUsername(undefined);
          }
        } else {
          setCustomUsername(undefined);
        }
      }
    };

    window.addEventListener('popstate', parseUrlState);
    if (window.location.pathname === '/dashboard') {
      setView('dashboard');
    }
    return () => window.removeEventListener('popstate', parseUrlState);
  }, []);

  const handleOpenDashboard = () => {
    if (!user) {
      loginWithGateway();
    } else {
      window.history.pushState({}, '', '/dashboard');
      setView('dashboard');
    }
  };

  const handleBackToLive = (usernameOrId?: string) => {
    const slug = usernameOrId || profile?.username || user?.id;
    const target = slug ? `/@${slug}` : '/';
    window.history.pushState({}, '', target);
    setCustomUsername(slug);
    setView('public');
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

    return (
      <Dashboard
        onBackToLive={() => handleBackToLive(profile?.username || user.id)}
      />
    );
  }

  return (
    <PublicView
      username={customUsername}
      currentUser={user}
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
