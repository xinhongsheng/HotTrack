const BASE = '/api'

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Keywords
  getKeywords: () => request('/keywords'),
  createKeyword: (data) => request('/keywords', { method: 'POST', body: JSON.stringify(data) }),
  updateKeyword: (id, data) => request(`/keywords/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteKeyword: (id) => request(`/keywords/${id}`, { method: 'DELETE' }),

  // Hot Topics
  getHotTopics: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/hot-topics?${qs}`)
  },
  getHotTopic: (id) => request(`/hot-topics/${id}`),
  getStats: () => request('/hot-topics/stats'),

  // Notifications
  getNotifications: (unreadOnly = false) => request(`/notifications?unread_only=${unreadOnly}`),
  getUnreadCount: () => request('/notifications/count'),
  markAsRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Trigger fetch
  triggerFetch: () => request('/fetch-trigger', { method: 'POST' }),

  // Email settings
  getEmailSettings: () => request('/email-settings'),
  updateEmailSettings: (data) => request('/email-settings', { method: 'PUT', body: JSON.stringify(data) }),
  sendTestEmail: () => request('/email-test', { method: 'POST' }),
}
