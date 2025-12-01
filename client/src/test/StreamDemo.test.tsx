import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StreamDemo from '../pages/StreamDemo';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('StreamDemo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders stream demo page with title', () => {
    render(<StreamDemo />);
    
    expect(screen.getByText('Stream Demo')).toBeInTheDocument();
    expect(screen.getByText(/Watch text stream character by character/i)).toBeInTheDocument();
  });

  it('displays start stream button', () => {
    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('disables button while streaming', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"H"}\n') })
        .mockResolvedValueOnce({ done: true, value: undefined })
    };

    mockFetch.mockResolvedValueOnce({
      body: {
        getReader: () => mockReader
      }
    });

    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Streaming\.\.\./i)).toBeInTheDocument();
    });

    const streamingButton = screen.getByRole('button', { name: /Streaming\.\.\./i });
    expect(streamingButton).toBeDisabled();
  });

  it('streams text character by character', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"H"}\n') })
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"e"}\n') })
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"l"}\n') })
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"l"}\n') })
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"o"}\n') })
        .mockResolvedValueOnce({ done: true, value: undefined })
    };

    mockFetch.mockResolvedValueOnce({
      body: {
        getReader: () => mockReader
      }
    });

    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Hello/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays completion message when stream is complete', async () => {
    const fullText = 'Complete stream text';
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"C"}\n') })
        .mockResolvedValueOnce({ 
          done: false, 
          value: new TextEncoder().encode(`data: {"complete":true,"fullText":"${fullText}"}\n`) 
        })
        .mockResolvedValueOnce({ done: true, value: undefined })
    };

    mockFetch.mockResolvedValueOnce({
      body: {
        getReader: () => mockReader
      }
    });

    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Stream Complete!')).toBeInTheDocument();
      expect(screen.getByText(fullText)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles stream errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockRejectedValueOnce(new Error('Stream error'));

    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stream error:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('resets state when starting a new stream', async () => {
    const mockReader1 = {
      read: vi.fn()
        .mockResolvedValueOnce({ 
          done: false, 
          value: new TextEncoder().encode('data: {"complete":true,"fullText":"First stream"}\n') 
        })
        .mockResolvedValueOnce({ done: true, value: undefined })
    };

    const mockReader2 = {
      read: vi.fn()
        .mockResolvedValueOnce({ 
          done: false, 
          value: new TextEncoder().encode('data: {"complete":true,"fullText":"Second stream"}\n') 
        })
        .mockResolvedValueOnce({ done: true, value: undefined })
    };

    mockFetch
      .mockResolvedValueOnce({ body: { getReader: () => mockReader1 } })
      .mockResolvedValueOnce({ body: { getReader: () => mockReader2 } });

    render(<StreamDemo />);
    
    // First stream
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('First stream')).toBeInTheDocument();
    });

    // Second stream
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Second stream')).toBeInTheDocument();
      expect(screen.queryByText('First stream')).not.toBeInTheDocument();
    });
  });

  it('calls fetch with correct endpoint', async () => {
    const mockReader = {
      read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined })
    };

    mockFetch.mockResolvedValueOnce({
      body: {
        getReader: () => mockReader
      }
    });

    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stream/text');
    });
  });

  it('displays animated pulse indicator while streaming', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"char":"T"}\n') })
        .mockImplementation(() => new Promise(() => {})) // Keep it hanging
    };

    mockFetch.mockResolvedValueOnce({
      body: {
        getReader: () => mockReader
      }
    });

    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Streaming in Progress\.\.\./i)).toBeInTheDocument();
    });
  });

  it('throws error when reader is not available', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockResolvedValueOnce({
      body: null
    });

    render(<StreamDemo />);
    
    const button = screen.getByRole('button', { name: /Start Stream/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Stream error:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});
