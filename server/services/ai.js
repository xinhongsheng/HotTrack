import fetch from 'node-fetch'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'google/gemini-2.0-flash-001'

export async function analyzeTopic(topic) {
  if (!OPENROUTER_API_KEY) {
    return {
      score: estimateScore(topic),
      analysis: 'AI 分析未配置 (需设置 OPENROUTER_API_KEY)',
      isRelevant: true,
    }
  }

  try {
    const prompt = `你是一个行业热点分析专家。请分析以下内容：

标题: ${topic.title}
来源: ${topic.source}
摘要: ${topic.summary || '无'}

请完成以下任务：
1. 判断这是否是一条真实的、有价值的行业热点（排除广告、钓鱼、虚假信息）
2. 给出 0-100 的热度评分（考虑时效性、影响力、技术价值）
3. 用一句话总结这条内容的核心价值

请严格按以下 JSON 格式返回（不要包含其他文字）：
{"score": 数字, "analysis": "一句话分析", "isRelevant": true/false}`

    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hottrack.dev',
        'X-Title': 'HotTrack',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    })

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        score: Math.min(100, Math.max(0, result.score || 0)),
        analysis: result.analysis || '无分析',
        isRelevant: result.isRelevant !== false,
      }
    }

    return { score: estimateScore(topic), analysis: 'AI 解析失败', isRelevant: true }
  } catch (err) {
    console.error('AI analysis error:', err.message)
    return { score: estimateScore(topic), analysis: 'AI 分析异常', isRelevant: true }
  }
}

function estimateScore(topic) {
  let score = 50
  if (topic.score > 100) score += 15
  else if (topic.score > 50) score += 10
  else if (topic.score > 20) score += 5

  const title = (topic.title || '').toLowerCase()
  const hotKeywords = ['ai', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'launch', 'release', 'open source']
  for (const kw of hotKeywords) {
    if (title.includes(kw)) {
      score += 5
    }
  }

  return Math.min(100, score)
}

export async function batchAnalyze(topics) {
  const results = []
  for (const topic of topics) {
    const analysis = await analyzeTopic(topic)
    results.push({ ...topic, ...analysis })
    await new Promise((r) => setTimeout(r, 500))
  }
  return results
}
