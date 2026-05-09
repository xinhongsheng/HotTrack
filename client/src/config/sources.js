export const SOURCE_META = {
  hackernews: { label: 'Hacker News', shortLabel: 'HN', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  github: { label: 'GitHub', shortLabel: 'GH', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' },
  twitter: { label: 'Twitter/X', shortLabel: 'X', color: '#1d9bf0', bg: 'rgba(29,155,240,0.1)', border: 'rgba(29,155,240,0.25)' },
  bing: { label: 'Bing', shortLabel: 'Bi', color: '#00809d', bg: 'rgba(0,128,157,0.1)', border: 'rgba(0,128,157,0.25)' },
  google: { label: 'Google', shortLabel: 'Go', color: '#4285f4', bg: 'rgba(66,133,244,0.1)', border: 'rgba(66,133,244,0.25)' },
  duckduckgo: { label: 'DuckDuckGo', shortLabel: 'DD', color: '#de5833', bg: 'rgba(222,88,51,0.1)', border: 'rgba(222,88,51,0.25)' },
  sogou: { label: '搜狗', shortLabel: 'SG', color: '#ff6e00', bg: 'rgba(255,110,0,0.1)', border: 'rgba(255,110,0,0.25)' },
  bilibili: { label: 'B站', shortLabel: 'B', color: '#00a1d6', bg: 'rgba(0,161,214,0.1)', border: 'rgba(0,161,214,0.25)' },
  weibo: { label: '微博', shortLabel: 'WB', color: '#e6162d', bg: 'rgba(230,22,45,0.1)', border: 'rgba(230,22,45,0.25)' },
}

export const CHART_COLORS = Object.values(SOURCE_META).map((s) => s.color)
