import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle2, ExternalLink, Info, Loader2, Mail, Radar, Settings as SettingsIcon } from 'lucide-react'
import { api } from '../api'
import { SOURCE_META } from '../config/sources'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      onClick={onChange}
      className="relative h-6 w-11 rounded-full transition-colors"
      style={{ background: checked ? 'var(--accent-green)' : 'rgba(112,128,150,0.28)' }}
      aria-label={label}
      type="button"
    >
      <span
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ left: checked ? 23 : 4 }}
      />
    </button>
  )
}

export default function Settings() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifPermission, setNotifPermission] = useState('default')
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailConfig, setEmailConfig] = useState({
    smtp_host: '',
    smtp_port: '465',
    smtp_user: '',
    smtp_pass: '',
    recipient: '',
  })
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailTesting, setEmailTesting] = useState(false)
  const [emailMsg, setEmailMsg] = useState(null)

  useEffect(() => {
    loadNotifications()
    loadEmailSettings()
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const [notificationData, countData] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount(),
      ])
      setNotifications(notificationData)
      setUnreadCount(countData.unread || 0)
    } catch {}
  }

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotifPermission(permission)
    }
  }

  const handleMarkRead = async (id) => {
    await api.markAsRead(id)
    loadNotifications()
  }

  const handleMarkAllRead = async () => {
    await api.markAllAsRead()
    loadNotifications()
  }

  const loadEmailSettings = async () => {
    try {
      const data = await api.getEmailSettings()
      setEmailEnabled(data.enabled)
      setEmailConfig({
        smtp_host: data.smtp_host || '',
        smtp_port: String(data.smtp_port || '465'),
        smtp_user: data.smtp_user || '',
        smtp_pass: data.smtp_pass_masked || '',
        recipient: data.recipient || '',
      })
    } catch {}
  }

  const saveEmailSettings = async () => {
    setEmailSaving(true)
    setEmailMsg(null)
    try {
      await api.updateEmailSettings({
        enabled: emailEnabled,
        ...emailConfig,
        smtp_port: parseInt(emailConfig.smtp_port) || 465,
      })
      setEmailMsg({ type: 'success', text: '配置已保存' })
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message })
    } finally {
      setEmailSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setEmailTesting(true)
    setEmailMsg(null)
    try {
      await api.sendTestEmail()
      setEmailMsg({ type: 'success', text: '测试邮件已发送，请检查收件箱。' })
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message })
    } finally {
      setEmailTesting(false)
    }
  }

  const getSourceStyle = (source) => {
    const meta = SOURCE_META[source]
    if (meta) {
      return { bg: meta.bg, color: meta.color, label: meta.shortLabel }
    }
    return { bg: 'rgba(112,128,150,0.14)', color: 'var(--text-muted)', label: source?.slice(0, 2) || '?' }
  }

  return (
    <div className="space-y-7">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
          <SettingsIcon size={13} />
          通知与系统
        </div>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: 'var(--text-primary)' }}>设置</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          管理浏览器通知、邮件推送和热点发现记录，让重要信号及时抵达。
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="panel rounded-xl p-5">
          <h2 className="panel-title">浏览器通知</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            发现新的高分热点时，在桌面弹出提醒。
          </p>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/[0.04]">
                {notifPermission === 'granted'
                  ? <Bell size={19} style={{ color: 'var(--accent-green)' }} />
                  : <BellOff size={19} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>桌面通知权限</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  当前状态：{notifPermission === 'granted' ? '已开启' : '未开启'}
                </p>
              </div>
            </div>

            {notifPermission === 'granted' ? (
              <span className="badge border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                <CheckCircle2 size={13} />
                已开启
              </span>
            ) : (
              <button onClick={requestNotifPermission} className="btn-primary px-4 py-2 text-xs" type="button">
                开启通知
              </button>
            )}
          </div>
        </div>

        <div className="panel rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="panel-title">邮件通知</h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                每轮抓取后将高分热点摘要发送到指定邮箱。
              </p>
            </div>
            <Toggle
              checked={emailEnabled}
              onChange={() => setEmailEnabled(!emailEnabled)}
              label={emailEnabled ? '关闭邮件通知' : '开启邮件通知'}
            />
          </div>

          {emailEnabled && (
            <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="SMTP 服务器">
                  <input
                    type="text"
                    value={emailConfig.smtp_host}
                    onChange={(event) => setEmailConfig({ ...emailConfig, smtp_host: event.target.value })}
                    placeholder="smtp.qq.com"
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="端口">
                  <input
                    type="number"
                    value={emailConfig.smtp_port}
                    onChange={(event) => setEmailConfig({ ...emailConfig, smtp_port: event.target.value })}
                    placeholder="465"
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="发送邮箱">
                  <input
                    type="email"
                    value={emailConfig.smtp_user}
                    onChange={(event) => setEmailConfig({ ...emailConfig, smtp_user: event.target.value })}
                    placeholder="your@qq.com"
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="SMTP 密码 / 授权码">
                  <input
                    type="password"
                    value={emailConfig.smtp_pass}
                    onChange={(event) => setEmailConfig({ ...emailConfig, smtp_pass: event.target.value })}
                    placeholder="授权码"
                    className="input-field w-full px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <Field label="接收邮箱">
                <input
                  type="email"
                  value={emailConfig.recipient}
                  onChange={(event) => setEmailConfig({ ...emailConfig, recipient: event.target.value })}
                  placeholder="receive@example.com"
                  className="input-field w-full px-3 py-2 text-sm"
                />
              </Field>

              {emailMsg && (
                <div
                  className="rounded-lg border px-3 py-2 text-xs"
                  style={{
                    background: emailMsg.type === 'success' ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
                    borderColor: emailMsg.type === 'success' ? 'rgba(52,211,153,0.22)' : 'rgba(251,113,133,0.22)',
                    color: emailMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}
                >
                  {emailMsg.text}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={saveEmailSettings} disabled={emailSaving} className="btn-primary px-4 py-2 text-xs" type="button">
                  {emailSaving && <Loader2 size={13} className="animate-spin" />}
                  保存配置
                </button>
                <button onClick={handleTestEmail} disabled={emailTesting} className="btn-secondary px-4 py-2 text-xs" type="button">
                  {emailTesting && <Loader2 size={13} className="animate-spin" />}
                  发送测试邮件
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="panel rounded-xl p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="panel-title">通知记录</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {unreadCount > 0 ? `${unreadCount} 条未读信号` : '暂无未读信号'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary min-h-9 px-3 text-xs" type="button">
              全部标为已读
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {notifications.map((notification) => {
              const srcStyle = getSourceStyle(notification.source)
              return (
                <div
                  key={notification.id}
                  className="rounded-xl border p-3 transition-colors"
                  style={{
                    background: notification.is_read ? 'rgba(255,255,255,0.025)' : 'var(--accent-blue-dim)',
                    borderColor: notification.is_read ? 'rgba(255,255,255,0.06)' : 'rgba(56,189,248,0.22)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="badge" style={{ background: srcStyle.bg, color: srcStyle.color }}>
                          {srcStyle.label}
                        </span>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                        )}
                      </div>
                      <a
                        href={notification.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-1 text-sm font-bold transition-colors hover:text-sky-200"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {notification.title}
                        <ExternalLink size={12} className="ml-1 inline opacity-50" />
                      </a>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(notification.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="btn-secondary min-h-8 px-3 text-xs"
                        type="button"
                      >
                        已读
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state py-10">
            <Bell size={28} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>暂无通知</p>
          </div>
        )}
      </section>

      <section className="panel rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Info size={16} style={{ color: 'var(--text-muted)' }} />
          <h2 className="panel-title">关于 HotTrack</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2 xl:grid-cols-4" style={{ color: 'var(--text-muted)' }}>
          <div className="rounded-lg bg-white/[0.035] p-3">
            <Radar size={15} className="mb-2" style={{ color: 'var(--accent-green)' }} />
            <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>HotTrack v1.0.0</p>
            <p>行业热点雷达</p>
          </div>
          <div className="rounded-lg bg-white/[0.035] p-3">
            <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>数据来源</p>
            <p className="mt-1">HN、GitHub、Twitter/X、搜索引擎、B站、微博</p>
          </div>
          <div className="rounded-lg bg-white/[0.035] p-3">
            <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>AI 分析</p>
            <p className="mt-1">OpenRouter API</p>
          </div>
          <div className="rounded-lg bg-white/[0.035] p-3">
            <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>抓取频率</p>
            <p className="mt-1">每 30 分钟自动抓取</p>
          </div>
        </div>
      </section>
    </div>
  )
}
