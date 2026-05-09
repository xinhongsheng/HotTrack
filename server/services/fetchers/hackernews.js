import { fetchWithRetry } from './utils.js'

const HN_API = 'https://hacker-news.firebaseio.com/v0'

export async function fetchTopStories(limit = 30) {
  const res = await fetchWithRetry(`${HN_API}/topstories.json`)
  const ids = await res.json()
  const topIds = ids.slice(0, limit)

  const results = await Promise.allSettled(
    topIds.map(async (id) => {
      const storyRes = await fetchWithRetry(`${HN_API}/item/${id}.json`)
      return storyRes.json()
    })
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((s) => s && s.title)
    .map((s) => ({
      title: s.title,
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      source: 'hackernews',
      score: s.score || 0,
      hnId: s.id,
    }))
}

export async function fetchNewStories(limit = 30) {
  const res = await fetchWithRetry(`${HN_API}/newstories.json`)
  const ids = await res.json()
  const topIds = ids.slice(0, limit)

  const results = await Promise.allSettled(
    topIds.map(async (id) => {
      const storyRes = await fetchWithRetry(`${HN_API}/item/${id}.json`)
      return storyRes.json()
    })
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((s) => s && s.title)
    .map((s) => ({
      title: s.title,
      url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      source: 'hackernews',
      score: s.score || 0,
      hnId: s.id,
    }))
}
