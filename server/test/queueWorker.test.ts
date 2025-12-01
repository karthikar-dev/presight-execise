import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setSocketIO } from '../services/queueWorker';
import { Server } from 'socket.io';

// Mock worker_threads module - Worker threads are complex to test in unit tests
vi.mock('worker_threads', () => ({
  Worker: class {
    on = vi.fn();
    postMessage = vi.fn();
    terminate = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_code: string | URL, _options?: any) {
    }
  }
}));

describe('Queue Worker Service', () => {
  let mockIO: any;

  beforeEach(() => {
    mockIO = {
      emit: vi.fn()
    };
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setSocketIO', () => {
    it('should set the socket.io instance without errors', () => {
      expect(() => setSocketIO(mockIO as Server)).not.toThrow();
    });

    it('should accept a valid Socket.IO server instance', () => {
      const result = setSocketIO(mockIO as Server);
      expect(result).toBeUndefined();
    });
  });

  describe('Queue Worker Integration', () => {
    it('should export setSocketIO function', () => {
      expect(typeof setSocketIO).toBe('function');
    });

    it('should handle Socket.IO instance configuration', () => {
      const mockServer = {
        emit: vi.fn(),
        on: vi.fn(),
        sockets: {
          emit: vi.fn()
        }
      };

      expect(() => setSocketIO(mockServer as any)).not.toThrow();
    });
  });

  describe('Queue Worker Module', () => {
    it('should be importable', async () => {
      const module = await import('../services/queueWorker');
      expect(module).toBeDefined();
      expect(module.addToQueue).toBeDefined();
      expect(module.setSocketIO).toBeDefined();
    });
  });
});
