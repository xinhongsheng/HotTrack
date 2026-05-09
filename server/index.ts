import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { initDB } from './db.ts'
import keywordsRouter from './routes/keywords.js'
import hotTopicsRouter from './routes/hotTopics.js'
import notificationsRouter from './routes/notifications.js'
import sourcesRouter from './routes/sources.js'
import emailRouter from './routes/email.js'
import { initRealtime } from './realtime.ts'
import { startScheduler, fetchAndAnalyze } from './services/scheduler.js'

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

initRealtime(httpServer)

app.use('/api/keywords', keywordsRouter)
app.use('/api/hot-topics', hotTopicsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/sources', sourcesRouter)
app.use('/api', emailRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/fetch-trigger', async (req, res) => {
  try {
    await fetchAndAnalyze()
    res.json({ message: 'Fetch completed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

async function start() {
  await initDB()
  console.log('Database initialized')

  if (process.env.DISABLE_SCHEDULER !== 'true') {
    startScheduler()
  }

  httpServer.listen(PORT, () => {
    console.log(`HotTrack server running on http://localhost:${PORT}`)
  })
}

start()
