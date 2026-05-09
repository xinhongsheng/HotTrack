import { useEffect, useState } from 'react'
import { Bell, Info, Loader2, Mail, Radar, Settings as SettingsIcon } from 'lucide-react'
import { api } from '../api'

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
    loadEmailSettings()
  }, [])

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
    } catch (err) {
      console.error('Email settings load error:', err)
    }
  }

  const saveEmailSettings = async () => {
    setEmailSaving(true)
    setEmailMsg(null)
    try {
      await api.updateEmailSettings({
        enabled: emailEnabled,
        ...emailConfig,
        smtp_port: parseInt(emailConfig.smtp_port, 10) || 465,
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

  return (
    <div className="space-y-7">
      <div className="panel-elevated rounded-xl p-5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-bold text-teal-100">
          <SettingsIcon size={13} />
          通知与系统
        </div>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: 'var(--text-primary)' }}>设置</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          桌面弹窗已关闭，所有新消息统一进入右上角铃铛；邮件推送仍可按需启用，让高价值信号准时抵达。
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-300/10 text-teal-100">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="panel-title">站内通知</h2>
              <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                发现高分热点后，系统会写入通知中心并更新铃铛红点，不再申请浏览器桌面通知权限。
              </p>
            </div>
          </div>
        </div>

        <div className="panel rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-100">
                <Mail size={18} />
              </div>
              <div>
                <h2 className="panel-title">邮件通知</h2>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  每轮抓取后，将高分热点摘要发送到指定邮箱。
                </p>
              </div>
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
