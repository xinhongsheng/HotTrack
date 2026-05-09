import { Router } from 'express'
import { SOURCE_META, getActiveFetchers } from '../services/fetchers/index.js'

const router = Router()

router.get('/', (req, res) => {
  const active = new Set(getActiveFetchers().map((f) => f.name))
  const meta = Object.entries(SOURCE_META).map(([id, val]) => ({
    id,
    ...val,
    active: active.has(id),
  }))
  res.json(meta)
})

export default router
