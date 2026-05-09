import express from 'express'
import cors from 'cors'
import { initDB } from './db.js'
import keywordsRouter from './routes/keywords.js'
import hotTopicsRouter from './routes/hotTopics.js'
import notificationsRouter from './routes/notifications.js'
import { startScheduler, fetchAndAnalyze } from './services/scheduler.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/keywords', keywordsRouter)
app.use('/api/hot-topics', hotTopicsRouter)
app.use('/api/notifications', notificationsRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/fetch-trigger', async (req, res) => {
  fetchAndAnalyze()
  res.json({ message: 'Fetch triggered' })
})

async function start() {
  await initDB()
  console.log('Database initialized')

  startScheduler()

  app.listen(PORT, () => {
    console.log(`HotTrack server running on http://localhost:${PORT}`)
  })
}

start()
