import { fetchTopStories } from './hackernews.js'
import { fetchTrending } from './github.js'
import { searchTwitter } from './twitter.js'
import { searchBing } from './bing.js'
import { searchGoogle } from './google.js'
import { searchDuckDuckGo } from './duckduckgo.js'
import { searchSogou } from './sogou.js'
import { searchBilibili } from './bilibili.js'
import { searchWeibo } from './weibo.js'

export const fetchers = [
  { name: 'hackernews', fetchFn: () => fetchTopStories(30), tier: 1 },
  { name: 'github', fetchFn: () => fetchTrending(), tier: 1 },
  { name: 'twitter', fetchFn: searchTwitter, tier: 2, enabled: Boolean(process.env.TWITTER_API_KEY || process.env.TWITTERAPI_IO_KEY) },
  { name: 'bing', fetchFn: searchBing, tier: 2 },
  { name: 'duckduckgo', fetchFn: searchDuckDuckGo, tier: 2 },
  { name: 'sogou', fetchFn: searchSogou, tier: 2 },
  { name: 'bilibili', fetchFn: searchBilibili, tier: 2 },
  { name: 'google', fetchFn: searchGoogle, tier: 3 },
  { name: 'weibo', fetchFn: searchWeibo, tier: 3 },
]

export function getActiveFetchers() {
  return fetchers.filter((f) => f.enabled !== false)
}

export const SOURCE_META = {
  hackernews: { label: 'Hacker News', shortLabel: 'HN', color: '#f59e0b' },
  github: { label: 'GitHub', shortLabel: 'GH', color: '#a855f7' },
  twitter: { label: 'Twitter/X', shortLabel: 'X', color: '#1d9bf0' },
  bing: { label: 'Bing', shortLabel: 'Bi', color: '#00809d' },
  google: { label: 'Google', shortLabel: 'Go', color: '#4285f4' },
  duckduckgo: { label: 'DuckDuckGo', shortLabel: 'DD', color: '#de5833' },
  sogou: { label: '搜狗', shortLabel: 'SG', color: '#ff6e00' },
  bilibili: { label: 'B站', shortLabel: 'B', color: '#00a1d6' },
  weibo: { label: '微博', shortLabel: 'WB', color: '#e6162d' },
}
