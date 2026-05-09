export function keywordToApi(keyword) {
  return {
    id: keyword.id,
    keyword: keyword.keyword,
    category: keyword.category,
    is_active: keyword.isActive,
    created_at: keyword.createdAt,
  }
}

export function topicToApi(topic) {
  return {
    id: topic.id,
    title: topic.title,
    url: topic.url,
    source: topic.source,
    summary: topic.summary,
    ai_score: topic.aiScore,
    ai_analysis: topic.aiAnalysis,
    keyword_id: topic.keywordId,
    is_notified: topic.isNotified,
    fetched_at: topic.fetchedAt,
    keyword: topic.keyword?.keyword,
  }
}

export function notificationToApi(notification) {
  return {
    id: notification.id,
    hot_topic_id: notification.hotTopicId,
    is_read: notification.isRead,
    created_at: notification.createdAt,
    title: notification.hotTopic?.title,
    url: notification.hotTopic?.url,
    source: notification.hotTopic?.source,
    ai_score: notification.hotTopic?.aiScore,
  }
}
