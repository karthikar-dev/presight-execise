import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import usersRouter from '../routes/users.js';
import streamRouter from '../routes/stream.js';
import queueRouter from '../routes/queue.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', usersRouter);
app.use('/api/stream', streamRouter);
app.use('/api/queue', queueRouter);

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '1', limit: '10' })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
      
      // Check pagination structure
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('hasMore');
    });

    it('should return users with correct structure', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '1', limit: '5' })
        .expect(200);

      const user = response.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('avatar');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('age');
      expect(user).toHaveProperty('nationality');
      expect(user).toHaveProperty('hobbies');
      expect(Array.isArray(user.hobbies)).toBe(true);
      expect(user.hobbies.length).toBeGreaterThan(0);
    });

    it('should filter users by search term', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '1', limit: '20', search: 'john' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((user: any) => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        expect(fullName).toContain('john');
      });
    });

    it('should filter users by nationality', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '1', limit: '20', nationality: 'US' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((user: any) => {
        expect(user.nationality).toBe('US');
      });
    });

    it('should filter users by hobbies', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '1', limit: '20', hobbies: 'Reading' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach((user: any) => {
          expect(user.hobbies).toContain('Reading');
        });
      }
    });

    it('should handle pagination correctly', async () => {
      const page1 = await request(app)
        .get('/api/users')
        .query({ page: '1', limit: '5' })
        .expect(200);

      const page2 = await request(app)
        .get('/api/users')
        .query({ page: '2', limit: '5' })
        .expect(200);

      expect(page1.body.data).not.toEqual(page2.body.data);
      expect(page1.body.pagination.page).toBe(1);
      expect(page2.body.pagination.page).toBe(2);
    });

    it('should return hasMore=false for last page', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '100', limit: '20' })
        .expect(200);

      expect(response.body.pagination.hasMore).toBe(false);
      expect(response.body.data.length).toBeLessThanOrEqual(20);
    });

    it('should handle invalid page numbers gracefully', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '0', limit: '10' })
        .expect(200);

      expect(response.body.pagination.page).toBeGreaterThanOrEqual(1);
    });

    it('should handle large page sizes', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ page: '1', limit: '100' })
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('GET /api/users/stats', () => {
    it('should return hobbies and nationalities statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .expect(200);

      expect(response.body).toHaveProperty('hobbies');
      expect(response.body).toHaveProperty('nationalities');
      expect(Array.isArray(response.body.hobbies)).toBe(true);
      expect(Array.isArray(response.body.nationalities)).toBe(true);
    });

    it('should return stats with correct structure', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .expect(200);

      if (response.body.hobbies.length > 0) {
        const hobby = response.body.hobbies[0];
        expect(hobby).toHaveProperty('name');
        expect(hobby).toHaveProperty('count');
        expect(typeof hobby.name).toBe('string');
        expect(typeof hobby.count).toBe('number');
      }

      if (response.body.nationalities.length > 0) {
        const nationality = response.body.nationalities[0];
        expect(nationality).toHaveProperty('name');
        expect(nationality).toHaveProperty('count');
        expect(typeof nationality.name).toBe('string');
        expect(typeof nationality.count).toBe('number');
      }
    });

    it('should return stats sorted by count', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .expect(200);

      // Check if hobbies are sorted by count (descending)
      for (let i = 0; i < response.body.hobbies.length - 1; i++) {
        expect(response.body.hobbies[i].count).toBeGreaterThanOrEqual(
          response.body.hobbies[i + 1].count
        );
      }

      // Check if nationalities are sorted by count (descending)
      for (let i = 0; i < response.body.nationalities.length - 1; i++) {
        expect(response.body.nationalities[i].count).toBeGreaterThanOrEqual(
          response.body.nationalities[i + 1].count
        );
      }
    });
  });
});

describe('Stream API', () => {
  describe('GET /api/stream/text', () => {
    it.skip('should return SSE stream (skipped: long-running)', async () => {
      // SSE streams are long-running and timeout in unit tests
      // This should be tested in integration tests or manually
      await request(app)
        .get('/api/stream/text')
        .expect(200)
        .expect('Content-Type', /text\/event-stream/);
    });
  });
});

describe('Queue API', () => {
  describe('POST /api/queue/task', () => {
    it('should accept queue tasks', async () => {
      const response = await request(app)
        .post('/api/queue/task')
        .send({ taskId: 'test-task-1' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('taskId', 'test-task-1');
    });

    it('should handle multiple tasks', async () => {
      const tasks = [
        { taskId: 'test-task-1' },
        { taskId: 'test-task-2' },
        { taskId: 'test-task-3' }
      ];

      for (const task of tasks) {
        const response = await request(app)
          .post('/api/queue/task')
          .send(task)
          .expect(200);

        expect(response.body.status).toBe('pending');
        expect(response.body.taskId).toBe(task.taskId);
      }
    });

    it('should return error for missing taskId', async () => {
      const response = await request(app)
        .post('/api/queue/task')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
