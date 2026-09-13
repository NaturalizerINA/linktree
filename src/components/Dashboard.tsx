import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserLink, AnalyticsData, UserProfile } from '../types';
import { THEMES } from '../themes';
import {
  Menu,
  BarChart3, Link2, Palette, Eye, ArrowLeft, Plus, Trash2, Edit3, Save,
  Check, MoveUp, MoveDown, Globe, LogOut, TrendingUp, MousePointerClick,
  Monitor, Smartphone, Tablet, RefreshCw, Sparkles, ExternalLink, X
} from 'lucide-react';

interface DashboardProps {
  onBackToLive: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBackToLive }) => {
  const { user, profile, setProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics'>('links');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Data states
  const [links, setLinks] = useState<UserLink[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Profile Form states
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [themeId, setThemeId] = useState('dark-aurora');
  const [socialGithub, setSocialGithub] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialTelegram, setSocialTelegram] = useState('');
  const [socialEmail, setSocialEmail] = useState('');

  // Link Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<UserLink | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkIcon, setLinkIcon] = useState('globe');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch initial dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, resAnalytics] = await Promise.all([
        fetch('/api/dashboard/my-data'),
        fetch('/api/dashboard/analytics'),
      ]);

      if (resData.ok) {
        const d = await resData.json();
        setLinks(d.links || []);
        if (d.profile) {
          setProfile(d.profile);
          setDisplayName(d.profile.display_name || '');
          setUsername(d.profile.username || '');
          setBio(d.profile.bio || '');
          setAvatarUrl(d.profile.avatar_url || '');
          setThemeId(d.profile.theme_id || 'dark-aurora');

          // Populate social links
          const socials = d.profile.social_links || [];
          setSocialGithub(socials.find((s: any) => s.platform === 'github')?.url || '');
          setSocialLinkedin(socials.find((s: any) => s.platform === 'linkedin')?.url || '');
          setSocialTelegram(socials.find((s: any) => s.platform === 'telegram')?.url || '');
          setSocialEmail(socials.find((s: any) => s.platform === 'email')?.url || '');
        }
      }

      if (resAnalytics.ok) {
        const a = await resAnalytics.json();
        setAnalytics(a);
      }
    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Appearance Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const socialLinks = [
      { platform: 'github', url: socialGithub },
      { platform: 'linkedin', url: socialLinkedin },
      { platform: 'telegram', url: socialTelegram },
      { platform: 'email', url: socialEmail },
    ].filter(s => s.url.trim() !== '');

    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          username,
          bio,
          avatar_url: avatarUrl,
          theme_id: themeId,
          social_links: socialLinks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan profil');
        return;
      }

      setProfile(data.profile);
      showToast('✅ Pengaturan profil & tema berhasil disimpan!');
    } catch (err) {
      showToast('Gagal menghubungi server');
    } finally {
      setSaving(false);
    }
  };

  // Add / Edit Link
  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle || !linkUrl) return;

    try {
      if (editingLink) {
        // Update
        const res = await fetch(`/api/dashboard/links/${editingLink.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: linkTitle,
            url: linkUrl,
            icon: linkIcon,
          }),
        });
        if (res.ok) {
          const { link } = await res.json();
          setLinks(links.map(l => (l.id === link.id ? link : l)));
          showToast('✅ Tautan diperbarui!');
        }
      } else {
        // Create
        const res = await fetch('/api/dashboard/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: linkTitle,
            url: linkUrl,
            icon: linkIcon,
          }),
        });
        if (res.ok) {
          const { link } = await res.json();
          setLinks([...links, link]);
          showToast('✅ Tautan baru ditambahkan!');
        }
      }
      setIsModalOpen(false);
      setEditingLink(null);
      setLinkTitle('');
      setLinkUrl('');
      setLinkIcon('globe');
    } catch (err) {
      showToast('Gagal menyimpan link');
    }
  };

  // Delete Link
  const handleDeleteLink = async (id: number) => {
    if (!confirm('Yakin ingin menghapus tautan ini?')) return;
    try {
      const res = await fetch(`/api/dashboard/links/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks(links.filter(l => l.id !== id));
        showToast('Tautan telah dihapus');
      }
    } catch {
      showToast('Gagal menghapus tautan');
    }
  };

  // Move Link up/down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const newLinks = [...links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[newIndex];
    newLinks[newIndex] = temp;

    setLinks(newLinks);

    try {
      await fetch('/api/dashboard/links/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkIds: newLinks.map(l => l.id) }),
      });
    } catch {
      // Revert if error
      setLinks(links);
    }
  };

  const openAddModal = () => {
    setEditingLink(null);
    setLinkTitle('');
    setLinkUrl('');
    setLinkIcon('globe');
    setIsModalOpen(true);
  };

  const openEditModal = (link: UserLink) => {
    setEditingLink(link);
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setLinkIcon(link.icon || 'globe');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-[#0d1424]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-sky-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-300" />
            )}
          </button>

          <button
            onClick={onBackToLive}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Lihat Halaman Live</span>
            <span className="sm:hidden">Live</span>
          </button>
          
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <span className="text-sm font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent truncate max-w-[150px] sm:max-w-none">
              R2Art Studio
            </span>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col text-right hidden sm:block">
            <div className="text-xs font-semibold text-white truncate max-w-[140px] md:max-w-[200px]">
              {user?.full_name || 'Pengguna Gateway'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              @{profile?.username || 'user'}
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Keluar / Logout SSO"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer / Hamburger Menu (Dropdown when overflow/small screen) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0a101f]/95 border-b border-white/10 backdrop-blur-xl px-4 py-3 space-y-2 sticky top-[57px] z-30 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between mb-2">
            <div className="text-xs">
              <div className="font-semibold text-white">{user?.full_name || 'Pengguna Gateway'}</div>
              <div className="text-[11px] text-sky-400 font-mono">@{profile?.username || 'user'}</div>
            </div>
            <div className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Online
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1">
            Navigasi Menu
          </div>

          <button
            onClick={() => {
              setActiveTab('links');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
              activeTab === 'links'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Link2 className="w-4 h-4 text-sky-400" />
              <span>Kelola Tautan</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-300 font-mono">
              {links.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('appearance');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'appearance'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Tampilan & Template</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('analytics');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'analytics'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-300 hover:bg-white/5 border border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Statistik Analitik</span>
          </button>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onBackToLive();
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-1.5 mr-2"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Live</span>
            </button>
            <button
              onClick={logout}
              className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Navigation Tabs (Hidden on mobile overflow) */}
      <div className="hidden md:flex border-b border-white/10 bg-[#090d16]/90 px-4 sm:px-8 pt-2 items-center gap-2">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'links'
              ? 'border-sky-400 text-sky-400 bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
          }`}
        >
          <Link2 className="w-4 h-4" />
          Kelola Tautan ({links.length})
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'appearance'
              ? 'border-sky-400 text-sky-400 bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
          }`}
        >
          <Palette className="w-4 h-4" />
          Tampilan & Template
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-t-xl text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'analytics'
              ? 'border-sky-400 text-sky-400 bg-white/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Statistik Analitik
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/50 shadow-2xl text-cyan-300 text-sm font-medium flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMsg}
          </div>
        )}

        {/* TAB 1: LINKS MANAGEMENT */}
        {activeTab === 'links' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Daftar Tautan Aktif</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur urutan dan isi tautan yang tampil di halaman profil Anda.
                </p>
              </div>
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Tambah Tautan Baru
              </button>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center items-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              </div>
            ) : links.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center bg-white/[0.02]">
                <Link2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-300 mb-1">Belum Ada Tautan</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Tambahkan website, portofolio, media sosial, atau link kontak Anda sekarang.
                </p>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-all"
                >
                  + Tambah Tautan Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link, idx) => (
                  <div
                    key={link.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Order controls */}
                      <div className="flex sm:flex-col flex-row gap-1 shrink-0">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          className="p-1.5 sm:p-1 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5"
                          title="Pindah Ke Atas"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === links.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          className="p-1.5 sm:p-1 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:bg-white/5"
                          title="Pindah Ke Bawah"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-100 text-sm truncate group-hover:text-sky-300 transition-colors">
                          {link.title}
                        </h4>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:underline truncate flex items-center gap-1 max-w-[200px] sm:max-w-none"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 inline" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t border-white/5 sm:border-0 shrink-0">
                      <div className="text-center sm:text-right px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 text-[11px] text-slate-300">
                        <span className="font-bold text-sky-400">{link.clicks || 0}</span> klik
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(link)}
                          className="px-3 py-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all"
                          title="Edit Tautan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="sm:hidden">Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="px-3 py-1.5 sm:p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1 transition-all"
                          title="Hapus Tautan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sm:hidden">Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPEARANCE & TEMPLATES */}
        {activeTab === 'appearance' && (
          <form onSubmit={handleSaveProfile} className="space-y-8">
            {/* Profile Info */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white">Profil Pengguna</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Tampilan</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                    placeholder="Nama Lengkap / Brand"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Username URL</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 rounded-l-xl bg-white/5 border border-r-0 border-white/10 text-xs text-slate-400 font-mono">
                      /@
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-r-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none font-mono"
                      placeholder="username"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bio Singkat</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                  placeholder="Software Engineer • Content Creator • Designer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">URL Foto Avatar (Opsional)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            {/* Template Chooser */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Pilih Template Visual</h3>
                  <p className="text-xs text-slate-400">Pilih tema warna dan gaya card yang sesuai preferensi Anda.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {THEMES.map(theme => (
                  <div
                    key={theme.id}
                    onClick={() => setThemeId(theme.id)}
                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all relative overflow-hidden flex flex-col justify-between h-36 ${
                      themeId === theme.id
                        ? 'border-sky-400 shadow-lg shadow-sky-500/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: theme.bgStyle }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-wide">{theme.name}</span>
                      {themeId === theme.id && (
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    <div className="w-full py-2 px-3 rounded-lg bg-white/10 border border-white/15 text-center text-xs font-medium text-white/90 backdrop-blur-sm">
                      Contoh Button Link
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links Quick Bar */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h3 className="text-lg font-bold text-white">Tautan Sosial Cepat</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub URL</label>
                  <input
                    type="url"
                    value={socialGithub}
                    onChange={e => setSocialGithub(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">LinkedIn URL</label>
                  <input
                    type="url"
                    value={socialLinkedin}
                    onChange={e => setSocialLinkedin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telegram URL</label>
                  <input
                    type="url"
                    value={socialTelegram}
                    onChange={e => setSocialTelegram(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                    placeholder="https://t.me/username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Kontak</label>
                  <input
                    type="text"
                    value={socialEmail}
                    onChange={e => setSocialEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                    placeholder="mailto:contact@domain.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end w-full sm:w-auto">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ANALYTICS & STATS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Statistik & Kunjungan</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pantau performa interaksi pengunjung dan efektivitas tautan Anda.
              </p>
            </div>

            {analytics ? (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Views Profil</span>
                      <Eye className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="text-3xl font-black text-white">
                      {analytics.summary.totalViews}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total Klik Tautan</span>
                      <MousePointerClick className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-black text-white">
                      {analytics.summary.totalClicks}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Click Through Rate</span>
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-white">
                      {analytics.summary.ctr}
                    </div>
                  </div>
                </div>

                {/* Breakdown per Link */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <h3 className="text-base font-bold text-white">Performa Masing-Masing Tautan</h3>
                  {analytics.linksBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-400">Belum ada aktivitas klik tercatat.</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.linksBreakdown.map(l => (
                        <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                          <div className="truncate mr-4">
                            <h5 className="text-sm font-semibold text-white truncate">{l.title}</h5>
                            <span className="text-xs text-slate-400 truncate">{l.url}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-emerald-400">{l.clicks}</span>
                            <span className="text-[11px] text-slate-400 block">total klik</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Device Breakdown */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <h3 className="text-base font-bold text-white">Perangkat Pengunjung</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {analytics.devices.map((d, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 text-center">
                        <div className="text-xs font-semibold text-slate-400 capitalize mb-1">{d.device}</div>
                        <div className="text-xl font-bold text-sky-400">{d.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-20 flex justify-center items-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Add / Edit Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingLink ? 'Edit Tautan' : 'Tambah Tautan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Tautan</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  placeholder="e.g. 🌐 Portofolio Desain Grafis"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL Tujuan</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-sky-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
