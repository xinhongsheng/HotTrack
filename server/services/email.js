import nodemailer from 'nodemailer'
import { prisma } from '../db.ts'

const EMAIL_KEYS = [
  'email_enabled',
  'email_smtp_host',
  'email_smtp_port',
  'email_smtp_user',
  'email_smtp_pass',
  'email_recipient',
]

const MASKED_PASSWORD = '••••••'

export async function getEmailSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: EMAIL_KEYS } },
  })
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  return {
    enabled: map.email_enabled === 'true',
    smtp_host: map.email_smtp_host || '',
    smtp_port: parseInt(map.email_smtp_port) || 465,
    smtp_user: map.email_smtp_user || '',
    smtp_pass: map.email_smtp_pass || '',
    recipient: map.email_recipient || '',
    smtp_pass_masked: map.email_smtp_pass ? MASKED_PASSWORD : '',
  }
}

export async function saveEmailSettings(settings) {
  const existingPassword = await prisma.setting.findUnique({ where: { key: 'email_smtp_pass' } })
  const smtpPass = settings.smtp_pass === MASKED_PASSWORD
    ? existingPassword?.value || ''
    : settings.smtp_pass || ''

  const pairs = [
    ['email_enabled', settings.enabled ? 'true' : 'false'],
    ['email_smtp_host', settings.smtp_host || ''],
    ['email_smtp_port', String(settings.smtp_port || '465')],
    ['email_smtp_user', settings.smtp_user || ''],
    ['email_smtp_pass', smtpPass],
    ['email_recipient', settings.recipient || ''],
  ]

  await prisma.$transaction(
    pairs.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  )
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
    .map((topic) => {
      const scoreColor = topic.score >= 80 ? '#22c55e' : '#f59e0b'
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
            <a href="${topic.url}" style="color:#3b82f6;text-decoration:none" target="_blank">${topic.title}</a>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#64748b">${topic.source}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:${scoreColor};font-weight:600">${topic.score}</td>
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
        <h2 style="color:#22c55e;margin-bottom:8px">配置成功</h2>
        <p style="color:#64748b;font-size:14px">你的 HotTrack 邮件通知已经就绪。</p>
      </div>`,
  })
}

export async function sendDigestEmail(topics) {
  const settings = await getEmailSettings()
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
      subject: `HotTrack 热点摘要 - ${now}`,
      html,
    })
    console.log(`[email] Digest sent with ${topics.length} topics to ${settings.recipient}`)
  } catch (err) {
    console.error('[email] Failed to send digest:', err.message)
  }
}
