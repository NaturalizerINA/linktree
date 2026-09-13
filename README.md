# R2Art Linktree Dynamic Studio

Sistem Linktree modern, dinamis, multi-user dengan integrasi R2Art Single Sign-On (SSO) Login Gateway, real-time visual styling & template chooser, serta analitik statistik kunjungan & interaksi klik.

## Fitur Unggulan
- **SSO Login Gateway Sync**: Autentikasi terpusat via `login-api.mukminullah.my.id` (OAuth/SSO cookies & Bearer token).
- **Multi-User Dynamic Profiles**: Setiap akun login memiliki data link, bio, username (`/@username`), dan template masing-masing yang tersimpan di PostgreSQL.
- **Tampilan Live & Tema Estetik**: Berbagai pilihan template visual (Dark Aurora, Cyberpunk Neon, Emerald Luxury, Minimalist Light, Sunset Glow) dengan responsif UI Tailwind CSS.
- **Statistik & Analitik Realtime**:
  - Total profil views & link clicks
  - Click-Through Rate (CTR)
  - Link performance breakdown
  - Analisis pengunjung berdasarkan jenis perangkat (Mobile, Tablet, Desktop) & browser
- **Dashboard Manajemen Lengkap**: Tambah link, ubah link, reorder urutan naik/turun, pengaturan profil, dan link sosial media cepat.

## Arsitektur Teknis
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend API**: Express.js REST API & static file serving
- **Database**: PostgreSQL (`r2art_linktree`)
- **Deployment**: Docker container terhubung jaringan Coolify & Traefik Reverse Proxy HTTPS
