import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import streamRouter from '../routes/stream';
import express, { Express } from 'express';
import http from 'http';

describe('Stream Routes', () => {
  let app: Express;
  let server: http.Server;

  beforeEach(() => {
    app = express();
    app.use('/api/stream', streamRouter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    return new Promise<void>((resolve) => {
      if (server && server.listening) {
        server.close(() => resolve());
      } else {
        resolve();
      }
      vi.restoreAllMocks();
    });
  });

  describe('GET /api/stream/text', () => {
    it('should have the stream text endpoint', () => {
      expect(streamRouter).toBeDefined();
    });

    it('should respond to stream requests', () => {
      return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const port = (server.address() as any).port;
          
          http.get(`http://localhost:${port}/api/stream/text`, (res) => {
            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toBe('text/event-stream');
            
            res.destroy();
            resolve();
          });
        });
      });
    });

    it('should set SSE headers correctly', () => {
      return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const port = (server.address() as any).port;
          
          http.get(`http://localhost:${port}/api/stream/text`, (res) => {
            expect(res.headers['content-type']).toBe('text/event-stream');
            expect(res.headers['cache-control']).toBe('no-cache');
            expect(res.headers['connection']).toBe('keep-alive');
            
            res.destroy();
            resolve();
          });
        });
      });
    });

    it('should stream data in SSE format', () => {
      return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const port = (server.address() as any).port;
          let receivedData = '';
          
          http.get(`http://localhost:${port}/api/stream/text`, (res) => {
            res.on('data', (chunk) => {
              receivedData += chunk.toString();
              
              if (receivedData.length > 50) {
                expect(receivedData).toContain('data: {');
                res.destroy();
                resolve();
              }
            });
          });
        });
      });
    });

    it('should send character data', () => {
      return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const port = (server.address() as any).port;
          let receivedData = '';
          
          http.get(`http://localhost:${port}/api/stream/text`, (res) => {
            res.on('data', (chunk) => {
              receivedData += chunk.toString();
              
              if (receivedData.includes('char')) {
                const hasCharData = receivedData.includes('"char"');
                expect(hasCharData).toBe(true);
                res.destroy();
                resolve();
              }
            });
          });
        });
      });
    });

    it('should handle multiple concurrent requests', () => {
      return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const port = (server.address() as any).port;
          let completedRequests = 0;
          const totalRequests = 3;
          
          for (let i = 0; i < totalRequests; i++) {
            http.get(`http://localhost:${port}/api/stream/text`, (res) => {
              expect(res.statusCode).toBe(200);
              res.destroy();
              
              completedRequests++;
              if (completedRequests === totalRequests) {
                resolve();
              }
            });
          }
        });
      });
    });

    it('should use SSE event format with newlines', () => {
      return new Promise<void>((resolve) => {
        server = app.listen(0, () => {
          const port = (server.address() as any).port;
          let receivedData = '';
          
          http.get(`http://localhost:${port}/api/stream/text`, (res) => {
            res.on('data', (chunk) => {
              receivedData += chunk.toString();
              
              if (receivedData.length > 100) {
                expect(receivedData).toContain('\n\n');
                res.destroy();
                resolve();
              }
            });
          });
        });
      });
    });

    it('should be importable as router', () => {
      expect(typeof streamRouter).toBe('function');
    });
  });
});
