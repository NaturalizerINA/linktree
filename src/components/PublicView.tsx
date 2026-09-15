import React, { useEffect, useState } from 'react';
import { UserProfile, UserLink } from '../types';
import { getThemeById } from '../themes';
import { 
  Globe, Github, Linkedin, Send, Mail, Twitter, Instagram, Youtube, ExternalLink,
  Sparkles, ArrowRight, Share2, Check
} from 'lucide-react';

interface PublicViewProps {
  username?: string;
  currentUser?: any;
  onOpenDashboard?: () => void;
  isAuthenticated?: boolean;
}

export const PublicView: React.FC<PublicViewProps> = ({ username, currentUser, onOpenDashboard, isAuthenticated }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const path = username ? `/api/public/profile/${username}` : '/api/public/profile';
        const res = await fetch(path);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setLinks(data.links || []);
          setIsOwner(Boolean(
            data.isOwner ||
            (currentUser && data.profile && (
              currentUser.id === data.profile.user_id ||
              currentUser.email?.toLowerCase() === data.profile.email?.toLowerCase()
            ))
          ));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, [username, currentUser]);

  const handleLinkClick = async (link: UserLink) => {
    try {
      fetch(`/api/public/links/${link.id}/click`, { method: 'POST' }).catch(() => {});
    } catch {
      // Ignore
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      const urlToCopy = profile?.username
        ? `${window.location.origin}/@${profile.username}`
        : window.location.href;
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Memuat Tautan...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Profil Tidak Ditemukan</h2>
          <p className="text-slate-400 text-sm mb-6">Profil dengan tautan ini belum tersedia atau telah diubah.</p>
          {onOpenDashboard && isAuthenticated && (
            <button
              onClick={onOpenDashboard}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 font-semibold rounded-xl text-white transition-all inline-flex items-center gap-2 text-sm shadow-lg shadow-sky-500/25"
            >
              Masuk ke Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentTheme = getThemeById(profile.theme_id);

  const renderIcon = (iconName: string, className = "w-5 h-5") => {
    const icon = (iconName || '').toLowerCase();
    if (icon.includes('github')) return <Github className={className} />;
    if (icon.includes('linkedin')) return <Linkedin className={className} />;
    if (icon.includes('telegram') || icon.includes('send')) return <Send className={className} />;
    if (icon.includes('mail') || icon.includes('email')) return <Mail className={className} />;
    if (icon.includes('twitter') || icon.includes('x')) return <Twitter className={className} />;
    if (icon.includes('instagram')) return <Instagram className={className} />;
    if (icon.includes('youtube')) return <Youtube className={className} />;
    return <Globe className={className} />;
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between items-center py-8 sm:py-12 px-4 relative transition-colors duration-500 ${currentTheme.textColor}`}
      style={{ background: currentTheme.bgStyle }}
    >
      {/* Owner Quick Banner */}
      {isOwner && onOpenDashboard && (
        <div className="w-full max-w-[580px] mb-4 p-2.5 px-4 rounded-2xl bg-sky-500/15 border border-sky-500/30 backdrop-blur-md flex items-center justify-between text-xs text-sky-200 shadow-lg shadow-sky-500/10 z-20 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">Halaman Tautan Publik Anda</span>
          </div>
          <button
            onClick={onOpenDashboard}
            className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow"
          >
            <Sparkles className="w-3 h-3" />
            <span>Edit di Studio</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-[580px] flex items-center justify-between mb-8 z-10">
        <button
          onClick={handleShare}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all text-sm flex items-center gap-1.5 shadow-sm active:scale-95"
          title="Salin Tautan"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span className="text-xs font-medium pr-1">{copied ? 'Tersalin!' : 'Bagikan'}</span>
        </button>

        {onOpenDashboard && isAuthenticated && (
          <button
            onClick={onOpenDashboard}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm group hover:border-cyan-400/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dashboard Kelola</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      <main className="w-full max-w-[560px] flex flex-col items-center text-center z-10">
        <div className="relative mb-5 group">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white/20 shadow-xl shadow-black/20 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-3xl sm:text-4xl font-black text-white border-4 border-white/20 shadow-2xl shadow-sky-500/25 group-hover:scale-105 transition-transform duration-300">
              {profile.display_name
                ? profile.display_name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'RM'}
            </div>
          )}
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-[#090d16] rounded-full"></span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          {profile.display_name}
        </h1>

        {profile.bio && (
          <p className="text-sm sm:text-base opacity-85 max-w-md mb-6 leading-relaxed font-normal">
            {profile.bio}
          </p>
        )}

        {profile.social_links && profile.social_links.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            {profile.social_links.map((s, idx) => (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-sm"
                title={s.platform}
              >
                {renderIcon(s.platform, "w-4 h-4")}
              </a>
            ))}
          </div>
        )}

        <div className="w-full flex flex-col gap-3.5 mb-10">
          {links.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-sm opacity-70">Belum ada tautan yang dibagikan.</p>
            </div>
          ) : (
            links.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link)}
                className={`w-full group flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 transform active:scale-[0.99] ${currentTheme.cardStyle} ${currentTheme.cardHover}`}
              >
                <div className="flex items-center gap-3.5 text-left truncate">
                  <span className="p-2 rounded-xl bg-white/10 text-white/90 group-hover:scale-110 transition-transform">
                    {renderIcon(link.icon || link.title, "w-5 h-5")}
                  </span>
                  <span className="font-semibold text-sm sm:text-base truncate tracking-tight">
                    {link.title}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </a>
            ))
          )}
        </div>
      </main>

      {!isOwner && !isAuthenticated && (
        <div className="z-10 mb-6 text-center">
          <a
            href="https://login.mukminullah.my.id/login?return_to=https%3A%2F%2Flinks.mukminullah.my.id%2Fdashboard&client_id=r2art_linktree&app_name=R2Art%20Linktree"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-xs font-semibold text-white/90 hover:text-white inline-flex items-center gap-2 transition-all hover:scale-105 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Buat Halaman Linktree Dinamis Milikmu Sendiri</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      <footer className="z-10 text-center text-xs opacity-60 font-medium py-4">
        <span>© {new Date().getFullYear()} {profile.display_name}. Powered by R2Art Dynamic Links.</span>
      </footer>
    </div>
  );
};
