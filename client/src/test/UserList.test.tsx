import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserList from '../pages/UserList';

// Mock fetch
global.fetch = vi.fn();

const mockUsers = [
  {
    id: '1',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    first_name: 'John',
    last_name: 'Doe',
    age: 30,
    nationality: 'US',
    hobbies: ['Reading', 'Gaming', 'Cooking']
  },
  {
    id: '2',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    first_name: 'Jane',
    last_name: 'Smith',
    age: 25,
    nationality: 'UK',
    hobbies: ['Photography', 'Hiking']
  },
  {
    id: '3',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    first_name: 'Bob',
    last_name: 'Johnson',
    age: 35,
    nationality: 'CA',
    hobbies: ['Music', 'Sports']
  }
];

const mockStats = {
  hobbies: [
    { name: 'Reading', count: 150 },
    { name: 'Gaming', count: 120 },
    { name: 'Cooking', count: 100 },
    { name: 'Photography', count: 90 },
    { name: 'Hiking', count: 80 }
  ],
  nationalities: [
    { name: 'US', count: 200 },
    { name: 'UK', count: 150 },
    { name: 'CA', count: 100 }
  ]
};

describe('UserList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/users/stats')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockStats)
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            data: mockUsers,
            pagination: {
              page: 1,
              limit: 20,
              total: 3,
              hasMore: false
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders user list with correct title', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/User List/)).toBeInTheDocument();
    });
  });

  it('fetches users on mount', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/stats');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/users?'));
    });
  });

  it('shows user count in title', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByText(/User List \(/)).toBeInTheDocument();
    });
  });

  it('has search input and button', async () => {
    render(<UserList />);
    
    const searchInput = screen.getByPlaceholderText('Search by name...');
    const searchButton = screen.getByRole('button', { name: 'Search' });
    
    expect(searchInput).toBeInTheDocument();
    expect(searchButton).toBeInTheDocument();
  });

  it('has nationality filter dropdown', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      const nationalitySelect = screen.getByRole('combobox');
      expect(nationalitySelect).toBeInTheDocument();
      expect(screen.getByText('All Countries')).toBeInTheDocument();
    });
  });

  it('displays hobbies filter checkboxes', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Reading/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Gaming/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Cooking/)).toBeInTheDocument();
    });
  });

  it('has list and grid view toggle buttons', async () => {
    render(<UserList />);
    
    const listButton = screen.getByRole('button', { name: /List/i });
    const gridButton = screen.getByRole('button', { name: /Grid/i });
    
    expect(listButton).toBeInTheDocument();
    expect(gridButton).toBeInTheDocument();
    expect(listButton).toHaveClass('bg-white'); // List is default
  });

  it('switches to grid view when clicking grid button', async () => {
    const user = userEvent.setup();
    render(<UserList />);
    
    const gridButton = screen.getByRole('button', { name: /Grid/i });
    await user.click(gridButton);

    await waitFor(() => {
      expect(gridButton).toHaveClass('bg-white');
    });
  });

  it('renders nationality options with counts', async () => {
    render(<UserList />);
    
    await waitFor(() => {
      const nationalitySelect = screen.getByRole('combobox');
      const options = Array.from(nationalitySelect.querySelectorAll('option'));
      
      // Should have "All Countries" + nationality options
      expect(options.length).toBeGreaterThan(1);
      expect(options[0].textContent).toContain('All Countries');
    });
  });

  it('does not make additional API calls when filters change', async () => {
    const user = userEvent.setup();
    render(<UserList />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const initialCallCount = (global.fetch as any).mock.calls.length;

    // Change filter
    const nationalitySelect = screen.getByRole('combobox');
    await user.selectOptions(nationalitySelect, 'UK');

    // Wait a bit to ensure no new calls
    await new Promise(resolve => setTimeout(resolve, 100));

    // No additional API calls should be made for filtering
    expect((global.fetch as any).mock.calls.length).toBe(initialCallCount);
  });
});
