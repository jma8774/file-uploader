import { Router, type Request, type Response } from 'express'
import { getStats } from '../services/statsService.js'

export const statsRouter = Router()

statsRouter.get('/stats', (_req: Request, res: Response) => {
  res.json(getStats())
})
