import { Router } from 'express'
import { getEmailSettings, saveEmailSettings, sendTestEmail } from '../services/email.js'

const router = Router()

router.get('/email-settings', (req, res) => {
  try {
    const settings = getEmailSettings()
    res.json({ ...settings, smtp_pass: settings.smtp_pass_masked })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/email-settings', (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, recipient, enabled } = req.body

    if (enabled && (!smtp_host || !smtp_user || !smtp_pass || !recipient)) {
      return res.status(400).json({ error: '请填写完整的 SMTP 配置信息' })
    }
    if (smtp_port && (smtp_port < 1 || smtp_port > 65535)) {
      return res.status(400).json({ error: '端口号范围为 1-65535' })
    }

    saveEmailSettings({ smtp_host, smtp_port, smtp_user, smtp_pass, recipient, enabled })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/email-test', async (req, res) => {
  try {
    const settings = getEmailSettings()
    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass || !settings.recipient) {
      return res.status(400).json({ error: '请先保存完整的 SMTP 配置' })
    }
    await sendTestEmail(settings)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ error: `发送失败: ${err.message}` })
  }
})

export default router
