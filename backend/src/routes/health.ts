import { Router, type Request, type Response } from 'express'

export const healthRouter = Router()

healthRouter.get('/health', (_req: Request, res: Response) => {
  // Real numbers land once the DB is wired in TICKET-015. Until then we
  // return the spec-correct shape with zeros so the contract is stable.
  res.json({
    status: 'ok',
    storageUsedBytes: 0,
    activeFiles: 0,
  })
})
