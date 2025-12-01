import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QueueDemo from '../pages/QueueDemo';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn()
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('QueueDemo Component', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn()
    };
    
    (io as any).mockReturnValue(mockSocket);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders queue demo page with title', () => {
    render(<QueueDemo />);
    
    expect(screen.getByText('Queue Demo with WebSocket')).toBeInTheDocument();
    expect(screen.getByText(/Process tasks using worker threads/i)).toBeInTheDocument();
  });

  it('initializes 20 tasks on mount', () => {
    render(<QueueDemo />);
    
    const tasks = screen.getAllByText(/Task #/i);
    expect(tasks).toHaveLength(20);
  });

  it('displays start all tasks button', () => {
    render(<QueueDemo />);
    
    const button = screen.getByRole('button', { name: /Start All Tasks/i });
    expect(button).toBeInTheDocument();
  });

  it('all tasks are in idle state initially', () => {
    render(<QueueDemo />);
    
    const idleStatus = screen.getAllByText('IDLE');
    expect(idleStatus).toHaveLength(20);
  });

  it('connects to WebSocket on mount', () => {
    render(<QueueDemo />);
    
    expect(io).toHaveBeenCalledWith('http://localhost:3000');
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('task-result', expect.any(Function));
  });

  it('disconnects WebSocket on unmount', () => {
    const { unmount } = render(<QueueDemo />);
    
    unmount();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('submits all tasks when start button is clicked', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ status: 'pending' })
    });

    render(<QueueDemo />);
    
    const button = screen.getByRole('button', { name: /Start All Tasks/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(20);
    });

    // Check that tasks are submitted with correct data
    expect(mockFetch).toHaveBeenCalledWith('/api/queue/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('task-')
    });
  });

  it('changes task status to pending after clicking start', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ status: 'pending' })
    });

    render(<QueueDemo />);
    
    const button = screen.getByRole('button', { name: /Start All Tasks/i });
    fireEvent.click(button);

    await waitFor(() => {
      const pendingStatus = screen.getAllByText('PENDING');
      expect(pendingStatus.length).toBeGreaterThan(0);
    });
  });

  it('updates task status to completed when receiving WebSocket message', async () => {
    let taskResultHandler: any;
    
    mockSocket.on.mockImplementation((event: string, handler: any) => {
      if (event === 'task-result') {
        taskResultHandler = handler;
      }
    });

    render(<QueueDemo />);

    // Simulate receiving task result
    if (taskResultHandler) {
      taskResultHandler({
        taskId: 'task-1',
        result: 'Processed task task-1'
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Processed task task-1')).toBeInTheDocument();
    });
  });

  it('displays correct status colors for different states', () => {
    render(<QueueDemo />);
    
    const idleElements = screen.getAllByText('IDLE');
    idleElements.forEach(element => {
      expect(element).toHaveClass('bg-gray-100');
    });
  });

  it('shows processing animation for pending tasks', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ status: 'pending' })
    });

    render(<QueueDemo />);
    
    const button = screen.getByRole('button', { name: /Start All Tasks/i });
    fireEvent.click(button);

    await waitFor(() => {
      const processingText = screen.getAllByText('Processing...');
      expect(processingText.length).toBeGreaterThan(0);
    });
  });

  it('displays task results in completed state', async () => {
    let taskResultHandler: any;
    
    mockSocket.on.mockImplementation((event: string, handler: any) => {
      if (event === 'task-result') {
        taskResultHandler = handler;
      }
    });

    render(<QueueDemo />);

    // Simulate receiving multiple task results
    if (taskResultHandler) {
      taskResultHandler({
        taskId: 'task-1',
        result: 'Result for task 1'
      });
      
      taskResultHandler({
        taskId: 'task-2',
        result: 'Result for task 2'
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Result for task 1')).toBeInTheDocument();
      expect(screen.getByText('Result for task 2')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<QueueDemo />);
    
    const button = screen.getByRole('button', { name: /Start All Tasks/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('displays ready to start message for idle tasks', () => {
    render(<QueueDemo />);
    
    const readyMessages = screen.getAllByText('Ready to start');
    expect(readyMessages).toHaveLength(20);
  });

  it('logs connection to console', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    let connectHandler: any;
    mockSocket.on.mockImplementation((event: string, handler: any) => {
      if (event === 'connect') {
        connectHandler = handler;
      }
    });

    render(<QueueDemo />);

    // Simulate connection
    if (connectHandler) {
      connectHandler();
    }

    expect(consoleLogSpy).toHaveBeenCalledWith('Connected to WebSocket');
    
    consoleLogSpy.mockRestore();
  });

  it('resets tasks when starting again', async () => {
    let taskResultHandler: any;
    
    mockSocket.on.mockImplementation((event: string, handler: any) => {
      if (event === 'task-result') {
        taskResultHandler = handler;
      }
    });

    mockFetch.mockResolvedValue({
      json: async () => ({ status: 'pending' })
    });

    render(<QueueDemo />);

    // First run - complete a task
    if (taskResultHandler) {
      taskResultHandler({
        taskId: 'task-1',
        result: 'First result'
      });
    }

    await waitFor(() => {
      expect(screen.getByText('First result')).toBeInTheDocument();
    });

    // Click start again
    const button = screen.getByRole('button', { name: /Start All Tasks/i });
    fireEvent.click(button);

    await waitFor(() => {
      // All tasks should be pending
      const pendingStatus = screen.getAllByText('PENDING');
      expect(pendingStatus.length).toBe(20);
    });
  });

  it('displays information about task processing', () => {
    render(<QueueDemo />);
    
    expect(screen.getByText(/They will be processed in a worker thread/i)).toBeInTheDocument();
  });
});
