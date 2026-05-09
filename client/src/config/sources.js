import { Code2, MessageCircle, Search, Video } from 'lucide-react'

export const SOURCE_META = {
  hackernews: { label: 'Hacker News', shortLabel: 'HN', icon: Search, color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)' },
  github: { label: 'GitHub', shortLabel: 'GH', icon: Code2, color: '#c084fc', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.28)' },
  twitter: { label: 'twitter', shortLabel: 'X', icon: MessageCircle, color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.28)' },
  bing: { label: 'Bing', shortLabel: 'Bi', icon: Search, color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)', border: 'rgba(45,212,191,0.28)' },
  google: { label: 'Google', shortLabel: 'Go', icon: Search, color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.28)' },
  duckduckgo: { label: 'DuckDuckGo', shortLabel: 'DD', icon: Search, color: '#fb7185', bg: 'rgba(251,113,133,0.10)', border: 'rgba(251,113,133,0.28)' },
  sogou: { label: '搜狗', shortLabel: 'SG', icon: Search, color: '#fb923c', bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.28)' },
  bilibili: { label: '哔哩哔哩', shortLabel: 'B站', icon: Video, color: '#22d3ee', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.28)' },
  weibo: { label: '微博', shortLabel: 'WB', icon: Search, color: '#f43f5e', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.28)' },
}

export const CHART_COLORS = Object.values(SOURCE_META).map((source) => source.color)
