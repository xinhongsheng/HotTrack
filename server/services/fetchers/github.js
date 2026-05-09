import fetch from 'node-fetch'

export async function fetchTrending(language = '', since = 'daily') {
  const url = `https://api.gitterapp.com/repositories?language=${language}&since=${since}`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'HotTrack/1.0',
      },
    })

    if (!res.ok) {
      return await fetchTrendingFallback(language)
    }

    const repos = await res.json()
    return repos.slice(0, 30).map((r) => ({
      title: `${r.author}/${r.name}`,
      url: r.url,
      source: 'github',
      summary: r.description || '',
      score: r.stars || 0,
    }))
  } catch {
    return await fetchTrendingFallback(language)
  }
}

async function fetchTrendingFallback(language = '') {
  try {
    const langParam = language ? `?spoken_language_code=&language=${language}` : ''
    const res = await fetch(`https://github.com/trending${langParam}`, {
      headers: {
        'User-Agent': 'HotTrack/1.0',
        Accept: 'text/html',
      },
    })
    const html = await res.text()

    const repos = []
    const repoRegex = /<article class="Box-row">([\s\S]*?)<\/article>/g
    let match

    while ((match = repoRegex.exec(html)) !== null) {
      const block = match[1]
      const nameMatch = block.match(/href="\/([^"]+)"/)
      const descMatch = block.match(/<p class="[^"]*">([\s\S]*?)<\/p>/)
      const starMatch = block.match(/(\d[\d,]*)\s*stars/)

      if (nameMatch) {
        repos.push({
          title: nameMatch[1].trim(),
          url: `https://github.com/${nameMatch[1].trim()}`,
          source: 'github',
          summary: descMatch ? descMatch[1].trim() : '',
          score: starMatch ? parseInt(starMatch[1].replace(/,/g, '')) : 0,
        })
      }
    }

    return repos.slice(0, 30)
  } catch {
    return []
  }
}
