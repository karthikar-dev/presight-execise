import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import queueRouter from '../routes/queue';
import * as queueWorker from '../services/queueWorker';

// Mock the queueWorker module
vi.mock('../services/queueWorker', () => ({
  addToQueue: vi.fn(),
  setSocketIO: vi.fn()
}));

describe('Queue Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/queue', queueRouter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/queue/task', () => {
    it('should accept a valid task', async () => {
      const taskData = {
        taskId: 'task-1',
        data: { message: 'Test task' }
      };

      const response = await request(app)
        .post('/api/queue/task')
        .send(taskData)
        .expect(200);

      expect(response.body).toEqual({
        status: 'pending',
        taskId: 'task-1'
      });

      expect(queueWorker.addToQueue).toHaveBeenCalledWith('task-1', { message: 'Test task' });
    });

    it('should return 400 when taskId is missing', async () => {
      const taskData = {
        data: { message: 'Test task' }
      };

      const response = await request(app)
        .post('/api/queue/task')
        .send(taskData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'taskId is required'
      });

      expect(queueWorker.addToQueue).not.toHaveBeenCalled();
    });

    it('should accept task with empty data', async () => {
      const taskData = {
        taskId: 'task-2',
        data: {}
      };

      const response = await request(app)
        .post('/api/queue/task')
        .send(taskData)
        .expect(200);

      expect(response.body).toEqual({
        status: 'pending',
        taskId: 'task-2'
      });

      expect(queueWorker.addToQueue).toHaveBeenCalledWith('task-2', {});
    });

    it('should accept task without data field', async () => {
      const taskData = {
        taskId: 'task-3'
      };

      const response = await request(app)
        .post('/api/queue/task')
        .send(taskData)
        .expect(200);

      expect(response.body).toEqual({
        status: 'pending',
        taskId: 'task-3'
      });

      expect(queueWorker.addToQueue).toHaveBeenCalledWith('task-3', undefined);
    });

    it('should handle multiple task submissions', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        taskId: `task-${i}`,
        data: { index: i }
      }));

      for (const task of tasks) {
        const response = await request(app)
          .post('/api/queue/task')
          .send(task)
          .expect(200);

        expect(response.body.status).toBe('pending');
        expect(response.body.taskId).toBe(task.taskId);
      }

      expect(queueWorker.addToQueue).toHaveBeenCalledTimes(5);
    });

    it('should accept complex data objects', async () => {
      const taskData = {
        taskId: 'complex-task',
        data: {
          user: { id: 1, name: 'John' },
          items: [1, 2, 3],
          metadata: { timestamp: Date.now() }
        }
      };

      const response = await request(app)
        .post('/api/queue/task')
        .send(taskData)
        .expect(200);

      expect(response.body).toEqual({
        status: 'pending',
        taskId: 'complex-task'
      });

      expect(queueWorker.addToQueue).toHaveBeenCalledWith('complex-task', taskData.data);
    });
  });
});
