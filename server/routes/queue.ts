import express, { Request, Response } from 'express';
import { addToQueue } from '../services/queueWorker';

const router = express.Router();

interface TaskRequest {
  taskId: string;
  data: any;
}

// POST /api/queue/task - Add task to queue
router.post('/task', (req: Request<{}, {}, TaskRequest>, res: Response) => {
  const { taskId, data } = req.body;
  
  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  addToQueue(taskId, data);
  
  res.json({ status: 'pending', taskId });
});

export default router;
