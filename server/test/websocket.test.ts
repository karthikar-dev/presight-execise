import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupWebSocketHandlers } from '../services/websocket';
import * as queueWorker from '../services/queueWorker';

// Mock queueWorker
vi.mock('../services/queueWorker', () => ({
  setSocketIO: vi.fn(),
  addToQueue: vi.fn()
}));

describe('WebSocket Service', () => {
  let mockIO: any;
  let mockSocket: any;
  let connectionHandler: any;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn()
    };

    mockIO = {
      on: vi.fn((event, handler) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }
      }),
      emit: vi.fn()
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setupWebSocketHandlers', () => {
    it('should set up connection handler', () => {
      setupWebSocketHandlers(mockIO);

      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should pass IO instance to queueWorker', () => {
      setupWebSocketHandlers(mockIO);

      expect(queueWorker.setSocketIO).toHaveBeenCalledWith(mockIO);
    });

    it('should log client connection', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      setupWebSocketHandlers(mockIO);

      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('Client connected:', 'test-socket-id');

      consoleLogSpy.mockRestore();
    });

    it('should set up disconnect handler for client', () => {
      setupWebSocketHandlers(mockIO);

      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should log client disconnection', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      let disconnectHandler: any;
      mockSocket.on.mockImplementation((event: string, handler: any) => {
        if (event === 'disconnect') {
          disconnectHandler = handler;
        }
      });

      setupWebSocketHandlers(mockIO);

      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      if (disconnectHandler) {
        disconnectHandler();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('Client disconnected:', 'test-socket-id');

      consoleLogSpy.mockRestore();
    });

    it('should handle multiple client connections', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      setupWebSocketHandlers(mockIO);

      // Simulate multiple clients
      const clients = [
        { id: 'client-1', on: vi.fn() },
        { id: 'client-2', on: vi.fn() },
        { id: 'client-3', on: vi.fn() }
      ];

      clients.forEach(client => {
        if (connectionHandler) {
          connectionHandler(client);
        }
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledWith('Client connected:', 'client-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('Client connected:', 'client-2');
      expect(consoleLogSpy).toHaveBeenCalledWith('Client connected:', 'client-3');

      consoleLogSpy.mockRestore();
    });

    it('should handle rapid connect/disconnect cycles', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      let disconnectHandler: any;
      const dynamicSocket = {
        id: 'rapid-client',
        on: vi.fn((event: string, handler: any) => {
          if (event === 'disconnect') {
            disconnectHandler = handler;
          }
        }),
        emit: vi.fn()
      };

      setupWebSocketHandlers(mockIO);

      if (connectionHandler) {
        connectionHandler(dynamicSocket);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('Client connected:', 'rapid-client');

      if (disconnectHandler) {
        disconnectHandler();
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('Client disconnected:', 'rapid-client');

      if (connectionHandler) {
        connectionHandler(dynamicSocket);
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('Client connected:', 'rapid-client');

      consoleLogSpy.mockRestore();
    });
  });
});
