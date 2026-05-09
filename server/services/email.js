import nodemailer from 'nodemailer'
import { queryAll, runSQL } from '../db.js'

const EMAIL_KEYS = [
  'email_enabled',
  'email_smtp_host',
  'email_smtp_port',
  'email_smtp_user',
  'email_smtp_pass',
  'email_recipient',
]

export function getEmailSettings() {
  const rows = queryAll(
    `SELECT key, value FROM settings WHERE key IN (${EMAIL_KEYS.map(() => '?').join(',')})`,
    EMAIL_KEYS
  )
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    enabled: map.email_enabled === 'true',
    smtp_host: map.email_smtp_host || '',
    smtp_port: parseInt(map.email_smtp_port) || 465,
    smtp_user: map.email_smtp_user || '',
    smtp_pass: map.email_smtp_pass || '',
    recipient: map.email_recipient || '',
    smtp_pass_masked: map.email_smtp_pass ? '••••••' : '',
  }
}

export function saveEmailSettings(settings) {
  const pairs = [
    ['email_enabled', settings.enabled ? 'true' : 'false'],
    ['email_smtp_host', settings.smtp_host || ''],
    ['email_smtp_port', String(settings.smtp_port || '465')],
    ['email_smtp_user', settings.smtp_user || ''],
    ['email_smtp_pass', settings.smtp_pass || ''],
    ['email_recipient', settings.recipient || ''],
  ]
  // Don't overwrite password if masked value was sent back
  if (settings.smtp_pass && settings.smtp_pass !== '••••••') {
    // use as-is
  } else if (settings.smtp_pass === '••••••') {
    // keep existing password
    const existing = queryAll('SELECT value FROM settings WHERE key = ?', ['email_smtp_pass'])
    pairs[4][1] = existing[0]?.value || ''
  }

  for (const [key, value] of pairs) {
    runSQL(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    )
  }
}

function createTransporter(settings) {
  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port,
    secure: settings.smtp_port === 465,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
  })
}

function buildDigestHtml(topics) {
  const rows = topics
    .map((t) => {
      const scoreColor = t.score >= 80 ? '#22c55e' : '#f59e0b'
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
            <a href="${t.url}" style="color:#3b82f6;text-decoration:none" target="_blank">${t.title}</a>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#64748b">${t.source}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:${scoreColor};font-weight:600">${t.score}</td>
        </tr>`
    })
    .join('')

  return `
    <div style="max-width:640px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <h2 style="color:#1e293b;margin-bottom:4px">HotTrack 热点摘要</h2>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 16px">${new Date().toLocaleString('zh-CN')}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f1f5f9;text-align:left">
            <th style="padding:8px 12px;color:#475569">标题</th>
            <th style="padding:8px 12px;color:#475569">来源</th>
            <th style="padding:8px 12px;color:#475569">分数</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#cbd5e1;font-size:11px;margin-top:16px;text-align:center">HotTrack 自动生成</p>
    </div>`
}

export async function sendTestEmail(settings) {
  const transporter = createTransporter(settings)
  await transporter.sendMail({
    from: settings.smtp_user,
    to: settings.recipient,
    subject: 'HotTrack 邮件通知测试',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;padding:40px 0">
        <h2 style="color:#22c55e;margin-bottom:8px">✓ 配置成功</h2>
        <p style="color:#64748b;font-size:14px">您的 HotTrack 邮件通知已就绪</p>
      </div>`,
  })
}

export async function sendDigestEmail(topics) {
  const settings = getEmailSettings()
  if (!settings.enabled || !settings.smtp_host || !settings.recipient) {
    console.log('[email] Email not enabled or config incomplete, skipping digest')
    return
  }
  if (topics.length === 0) return

  try {
    const transporter = createTransporter(settings)
    const html = buildDigestHtml(topics)
    const now = new Date().toLocaleString('zh-CN')
    await transporter.sendMail({
      from: settings.smtp_user,
      to: settings.recipient,
      subject: `HotTrack 热点摘要 — ${now}`,
      html,
    })
    console.log(`[email] Digest sent with ${topics.length} topics to ${settings.recipient}`)
  } catch (err) {
    console.error('[email] Failed to send digest:', err.message)
  }
}
