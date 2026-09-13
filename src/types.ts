export interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme_id: string;
  custom_css?: string;
  social_links: {
    platform: string;
    url: string;
  }[];
  is_public: boolean;
  created_at?: string;
}

export interface UserLink {
  id: number;
  user_id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  display_order: number;
  is_active: boolean;
  clicks: number;
  created_at?: string;
}

export interface AnalyticsData {
  summary: {
    totalViews: number;
    totalClicks: number;
    ctr: string;
  };
  linksBreakdown: {
    id: number;
    title: string;
    url: string;
    clicks: number;
    recent_clicks: string | number;
  }[];
  devices: {
    device: string;
    count: string | number;
  }[];
  dailyTrend: {
    day: string;
    views: string | number;
    clicks: string | number;
  }[];
}

export interface ThemeTemplate {
  id: string;
  name: string;
  previewClass: string;
  bgStyle: string;
  cardStyle: string;
  cardHover: string;
  textColor: string;
  accentColor: string;
  borderStyle: string;
}
