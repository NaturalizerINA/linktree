import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://login-api.mukminullah.my.id';

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// PostgreSQL Connection Pool
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'postgres_db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'M1r4etft26!',
  database: process.env.DB_NAME || 'r2art_linktree',
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Auto-migrate tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        bio TEXT DEFAULT '',
        avatar_url TEXT DEFAULT '',
        theme_id VARCHAR(50) DEFAULT 'dark-aurora',
        custom_css TEXT DEFAULT '',
        social_links JSONB DEFAULT '[]'::jsonb,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_links (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        icon VARCHAR(100) DEFAULT 'link',
        category VARCHAR(100) DEFAULT 'General',
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        clicks INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS link_analytics (
        id BIGSERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        link_id INT REFERENCES user_links(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL, -- 'page_view' or 'click'
        visitor_ip VARCHAR(100),
        user_agent TEXT,
        referrer TEXT,
        device_type VARCHAR(50),
        browser VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
      CREATE INDEX IF NOT EXISTS idx_user_links_user_id ON user_links(user_id);
      CREATE INDEX IF NOT EXISTS idx_link_analytics_user_event ON link_analytics(user_id, event_type, created_at);
    `);
    console.log('✅ PostgreSQL Schema r2art_linktree initialized successfully');
  } catch (err) {
    console.error('⚠️ Database init error:', err.message);
  }
}
initDatabase();

// Auth Verification Helper (Connecting to R2Art Login Gateway)
async function verifyUserSession(req) {
  let sessionCookie = null;
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)r2art_sso_session=([^;]+)/);
    if (match) {
      sessionCookie = decodeURIComponent(match[1].trim());
    }
  }

  let bearerToken = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.split(' ')[1].trim();
  }

  const tokenOrSession = sessionCookie || bearerToken;
  if (!tokenOrSession) return null;

  const gatewayHeaders = {};
  if (sessionCookie) gatewayHeaders['Cookie'] = `r2art_sso_session=${sessionCookie}`;
  if (bearerToken) gatewayHeaders['Authorization'] = `Bearer ${bearerToken}`;

  try {
    const verifyRes = await fetch(`${GATEWAY_URL}/api/auth/me`, {
      headers: gatewayHeaders,
    });

    if (!verifyRes.ok) return null;

    const data = await verifyRes.json();
    if (!data.authenticated && (!data.user && !data.data)) {
      return null;
    }

    const userData = data.user?.user || data.user || data.data;
    if (!userData || !userData.email) return null;

    return {
      id: userData.id || userData.user_id || 'user',
      email: userData.email.toLowerCase(),
      full_name: userData.full_name || userData.name || userData.email.split('@')[0],
      avatar_url: userData.avatar_url || userData.picture || null,
      role: userData.role || (userData.is_superadmin ? 'ADMIN' : 'USER'),
      is_superadmin: !!userData.is_superadmin,
    };
  } catch (err) {
    console.error('Auth verification error:', err.message);
    return null;
  }
}

// Ensure User Profile exists in Database
async function getOrCreateUserProfile(user) {
  const existing = await pool.query('SELECT * FROM user_profiles WHERE email = $1', [user.email]);
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  // Generate username from email
  let baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!baseUsername) baseUsername = 'user';
  
  let username = baseUsername;
  let counter = 1;
  while (true) {
    const check = await pool.query('SELECT user_id FROM user_profiles WHERE username = $1', [username]);
    if (check.rows.length === 0) break;
    username = `${baseUsername}${counter}`;
    counter++;
  }

  const res = await pool.query(
    `INSERT INTO user_profiles (user_id, email, username, display_name, avatar_url, theme_id, social_links)
     VALUES ($1, $2, $3, $4, $5, 'dark-aurora', '[]'::jsonb)
     RETURNING *`,
    [user.id || username, user.email, username, user.full_name, user.avatar_url || '']
  );
  return res.rows[0];
}

// Middleware: Require Authenticated User
async function requireAuth(req, res, next) {
  const user = await verifyUserSession(req);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Silakan login melalui Login Gateway',
    });
  }
  const profile = await getOrCreateUserProfile(user);
  req.user = user;
  req.profile = profile;
  next();
}

// ================= API ROUTES =================

// 1. Check Auth Status
app.get('/api/auth/me', async (req, res) => {
  const user = await verifyUserSession(req);
  if (!user) {
    return res.json({ authenticated: false });
  }
  const profile = await getOrCreateUserProfile(user);
  return res.json({
    authenticated: true,
    user,
    profile,
  });
});

// Helper to determine device type
function parseDevice(ua = '') {
  const agent = ua.toLowerCase();
  if (/mobile|android|touch|iphone|ipad|ipod/.test(agent)) {
    if (/tablet|ipad/.test(agent)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
}

function parseBrowser(ua = '') {
  const agent = ua.toLowerCase();
  if (agent.includes('firefox')) return 'Firefox';
  if (agent.includes('chrome') && !agent.includes('edg')) return 'Chrome';
  if (agent.includes('safari') && !agent.includes('chrome')) return 'Safari';
  if (agent.includes('edg')) return 'Edge';
  if (agent.includes('opera') || agent.includes('opr')) return 'Opera';
  return 'Other';
}

// 2. Public Linktree View: Get Page Data by Username or Primary
app.get('/api/public/profile/:username?', async (req, res) => {
  try {
    let { username } = req.params;
    let query = 'SELECT * FROM user_profiles WHERE username = $1';
    let params = [username];

    if (!username || username === 'primary' || username === 'default') {
      // Find rahmad or first profile
      query = `SELECT * FROM user_profiles WHERE username = 'rahmad' OR email LIKE 'rahmad%' ORDER BY created_at ASC LIMIT 1`;
      params = [];
    }

    const profileRes = await pool.query(query, params);
    if (profileRes.rows.length === 0) {
      // If none found, fallback to any first profile
      const anyProfile = await pool.query('SELECT * FROM user_profiles ORDER BY created_at ASC LIMIT 1');
      if (anyProfile.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.json({ profile: anyProfile.rows[0], links: [] });
    }

    const profile = profileRes.rows[0];

    // Fetch active links
    const linksRes = await pool.query(
      'SELECT id, title, url, icon, category, display_order, clicks FROM user_links WHERE user_id = $1 AND is_active = true ORDER BY display_order ASC, id ASC',
      [profile.user_id]
    );

    // Record page view analytics async
    const visitorIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';
    const deviceType = parseDevice(userAgent);
    const browser = parseBrowser(userAgent);

    pool.query(
      `INSERT INTO link_analytics (user_id, link_id, event_type, visitor_ip, user_agent, referrer, device_type, browser)
       VALUES ($1, NULL, 'page_view', $2, $3, $4, $5, $6)`,
      [profile.user_id, visitorIp.toString(), userAgent, referrer, deviceType, browser]
    ).catch(e => console.error('Analytics page_view log error:', e.message));

    return res.json({
      profile,
      links: linksRes.rows,
    });
  } catch (err) {
    console.error('Error fetching public profile:', err);
    return res.status(500).json({ error: 'Failed to load linktree profile' });
  }
});

// 3. Public Analytics: Record Link Click
app.post('/api/public/links/:id/click', async (req, res) => {
  try {
    const linkId = parseInt(req.params.id, 10);
    const updateRes = await pool.query(
      'UPDATE user_links SET clicks = clicks + 1 WHERE id = $1 RETURNING user_id, url',
      [linkId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const { user_id, url } = updateRes.rows[0];
    const visitorIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';
    const deviceType = parseDevice(userAgent);
    const browser = parseBrowser(userAgent);

    pool.query(
      `INSERT INTO link_analytics (user_id, link_id, event_type, visitor_ip, user_agent, referrer, device_type, browser)
       VALUES ($1, $2, 'click', $3, $4, $5, $6, $7)`,
      [user_id, linkId, visitorIp.toString(), userAgent, referrer, deviceType, browser]
    ).catch(e => console.error('Analytics click log error:', e.message));

    return res.json({ success: true, url });
  } catch (err) {
    console.error('Error logging link click:', err);
    return res.status(500).json({ error: 'Failed to record click' });
  }
});

// ================= DASHBOARD PROTECTED ROUTES =================

// 4. Get Current User's Profile & Links
app.get('/api/dashboard/my-data', requireAuth, async (req, res) => {
  try {
    const userId = req.profile.user_id;

    // Refresh profile
    const profileRes = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    const linksRes = await pool.query('SELECT * FROM user_links WHERE user_id = $1 ORDER BY display_order ASC, id ASC', [userId]);

    return res.json({
      profile: profileRes.rows[0],
      links: linksRes.rows,
    });
  } catch (err) {
    console.error('Dashboard data error:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// 5. Update Profile / Appearance / Template
app.put('/api/dashboard/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.profile.user_id;
    const { display_name, bio, avatar_url, theme_id, custom_css, social_links, username } = req.body;

    // If username is changing, ensure uniqueness
    if (username && username !== req.profile.username) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const conflict = await pool.query('SELECT user_id FROM user_profiles WHERE username = $1 AND user_id != $2', [cleanUsername, userId]);
      if (conflict.rows.length > 0) {
        return res.status(400).json({ error: 'Username sudah digunakan orang lain' });
      }
    }

    const cleanUsername = (username || req.profile.username).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const updateRes = await pool.query(
      `UPDATE user_profiles
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           theme_id = COALESCE($4, theme_id),
           custom_css = COALESCE($5, custom_css),
           social_links = COALESCE($6, social_links),
           username = $7,
           updated_at = NOW()
       WHERE user_id = $8
       RETURNING *`,
      [display_name, bio, avatar_url, theme_id, custom_css, JSON.stringify(social_links || []), cleanUsername, userId]
    );

    return res.json({ success: true, profile: updateRes.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 6. Manage Links (Add, Edit, Reorder, Delete)
app.post('/api/dashboard/links', requireAuth, async (req, res) => {
  try {
    const userId = req.profile.user_id;
    const { title, url, icon, category, display_order } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Judul dan URL wajib diisi' });
    }

    const maxOrderRes = await pool.query('SELECT COALESCE(MAX(display_order), 0) as max_ord FROM user_links WHERE user_id = $1', [userId]);
    const order = display_order !== undefined ? display_order : (maxOrderRes.rows[0].max_ord + 1);

    const insertRes = await pool.query(
      `INSERT INTO user_links (user_id, title, url, icon, category, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [userId, title, url, icon || 'link', category || 'General', order]
    );

    return res.json({ success: true, link: insertRes.rows[0] });
  } catch (err) {
    console.error('Add link error:', err);
    return res.status(500).json({ error: 'Failed to add link' });
  }
});

app.put('/api/dashboard/links/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.profile.user_id;
    const linkId = parseInt(req.params.id, 10);
    const { title, url, icon, category, display_order, is_active } = req.body;

    const updateRes = await pool.query(
      `UPDATE user_links
       SET title = COALESCE($1, title),
           url = COALESCE($2, url),
           icon = COALESCE($3, icon),
           category = COALESCE($4, category),
           display_order = COALESCE($5, display_order),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, url, icon, category, display_order, is_active, linkId, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Link tidak ditemukan atau bukan milik Anda' });
    }

    return res.json({ success: true, link: updateRes.rows[0] });
  } catch (err) {
    console.error('Update link error:', err);
    return res.status(500).json({ error: 'Failed to update link' });
  }
});

app.delete('/api/dashboard/links/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.profile.user_id;
    const linkId = parseInt(req.params.id, 10);

    const delRes = await pool.query('DELETE FROM user_links WHERE id = $1 AND user_id = $2 RETURNING id', [linkId, userId]);
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Link tidak ditemukan' });
    }

    return res.json({ success: true, deletedId: linkId });
  } catch (err) {
    console.error('Delete link error:', err);
    return res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Reorder Links
app.post('/api/dashboard/links/reorder', requireAuth, async (req, res) => {
  try {
    const userId = req.profile.user_id;
    const { linkIds } = req.body; // Array of IDs in order

    if (!Array.isArray(linkIds)) {
      return res.status(400).json({ error: 'linkIds must be an array' });
    }

    for (let i = 0; i < linkIds.length; i++) {
      await pool.query('UPDATE user_links SET display_order = $1 WHERE id = $2 AND user_id = $3', [i + 1, linkIds[i], userId]);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Reorder error:', err);
    return res.status(500).json({ error: 'Failed to reorder links' });
  }
});

// 7. Analytics Dashboard Stats
app.get('/api/dashboard/analytics', requireAuth, async (req, res) => {
  try {
    const userId = req.profile.user_id;

    // Total Page Views
    const totalViewsRes = await pool.query(
      `SELECT COUNT(*) as total FROM link_analytics WHERE user_id = $1 AND event_type = 'page_view'`,
      [userId]
    );

    // Total Clicks
    const totalClicksRes = await pool.query(
      `SELECT COUNT(*) as total FROM link_analytics WHERE user_id = $1 AND event_type = 'click'`,
      [userId]
    );

    // Click through rate
    const views = parseInt(totalViewsRes.rows[0].total, 10) || 0;
    const clicks = parseInt(totalClicksRes.rows[0].total, 10) || 0;
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : 0;

    // Link performance breakdown
    const linksBreakdownRes = await pool.query(
      `SELECT l.id, l.title, l.url, l.clicks,
              COUNT(a.id) as recent_clicks
       FROM user_links l
       LEFT JOIN link_analytics a ON l.id = a.link_id AND a.created_at >= NOW() - INTERVAL '7 days'
       WHERE l.user_id = $1
       GROUP BY l.id, l.title, l.url, l.clicks
       ORDER BY l.clicks DESC`,
      [userId]
    );

    // Device breakdown
    const devicesRes = await pool.query(
      `SELECT COALESCE(device_type, 'desktop') as device, COUNT(*) as count
       FROM link_analytics
       WHERE user_id = $1
       GROUP BY device_type
       ORDER BY count DESC`,
      [userId]
    );

    // Daily views last 7 days
    const dailyViewsRes = await pool.query(
      `SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as day,
              COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
              COUNT(*) FILTER (WHERE event_type = 'click') as clicks
       FROM link_analytics
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
       ORDER BY day ASC`,
      [userId]
    );

    return res.json({
      summary: {
        totalViews: views,
        totalClicks: clicks,
        ctr: `${ctr}%`,
      },
      linksBreakdown: linksBreakdownRes.rows,
      devices: devicesRes.rows,
      dailyTrend: dailyViewsRes.rows,
    });
  } catch (err) {
    console.error('Analytics fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Serve frontend static build in production
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 R2Art Linktree Dynamic Engine running on http://0.0.0.0:${PORT}`);
});
