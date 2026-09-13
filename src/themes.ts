import { ThemeTemplate } from './types';

export const THEMES: ThemeTemplate[] = [
  {
    id: 'dark-aurora',
    name: 'Dark Aurora (Default)',
    previewClass: 'bg-[#090d16] text-white',
    bgStyle: 'radial-gradient(circle at top, #131b2e 0%, #090d16 100%)',
    cardStyle: 'bg-white/[0.06] backdrop-blur-md text-white border-white/10 hover:border-sky-500/50 hover:bg-white/[0.12]',
    cardHover: 'hover:shadow-[0_8px_25px_rgba(56,189,248,0.2)]',
    textColor: 'text-slate-100',
    accentColor: '#38bdf8',
    borderStyle: 'border-white/10',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    previewClass: 'bg-[#0f051d] text-fuchsia-400',
    bgStyle: 'radial-gradient(circle at top, #2e0854 0%, #0a0118 100%)',
    cardStyle: 'bg-fuchsia-950/40 backdrop-blur-md text-fuchsia-200 border-fuchsia-500/30 hover:border-pink-500 hover:bg-fuchsia-900/50',
    cardHover: 'hover:shadow-[0_8px_25px_rgba(236,72,153,0.35)]',
    textColor: 'text-fuchsia-100',
    accentColor: '#ec4899',
    borderStyle: 'border-fuchsia-500/30',
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald Luxury',
    previewClass: 'bg-[#051c14] text-emerald-300',
    bgStyle: 'radial-gradient(circle at top, #063d2c 0%, #03140e 100%)',
    cardStyle: 'bg-emerald-950/40 backdrop-blur-md text-emerald-100 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-900/50',
    cardHover: 'hover:shadow-[0_8px_25px_rgba(16,185,129,0.3)]',
    textColor: 'text-emerald-50',
    accentColor: '#10b981',
    borderStyle: 'border-emerald-500/30',
  },
  {
    id: 'minimal-light',
    name: 'Clean Minimalist Light',
    previewClass: 'bg-slate-100 text-slate-800',
    bgStyle: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    cardStyle: 'bg-white/80 backdrop-blur-md text-slate-800 border-slate-200 hover:border-slate-900 hover:bg-white',
    cardHover: 'hover:shadow-lg',
    textColor: 'text-slate-900',
    accentColor: '#0f172a',
    borderStyle: 'border-slate-200',
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset Glow',
    previewClass: 'bg-[#2b1029] text-amber-300',
    bgStyle: 'linear-gradient(135deg, #1f122e 0%, #3e162f 50%, #1a0b22 100%)',
    cardStyle: 'bg-rose-950/30 backdrop-blur-md text-amber-100 border-amber-500/30 hover:border-amber-400 hover:bg-rose-900/40',
    cardHover: 'hover:shadow-[0_8px_25px_rgba(245,158,11,0.25)]',
    textColor: 'text-amber-50',
    accentColor: '#f59e0b',
    borderStyle: 'border-amber-500/30',
  },
];

export const getThemeById = (id: string): ThemeTemplate => {
  return THEMES.find(t => t.id === id) || THEMES[0];
};
