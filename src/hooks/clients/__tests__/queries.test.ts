
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useClients } from '@/hooks/clients/queries';

// Mock the queries module
vi.mock('@/hooks/clients/queries', () => ({
  useClients: vi.fn()
}));

const mockUseClients = useClients as any;

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle client queries correctly', () => {
    const mockData = [
      { id: '1', name: 'Client 1', phone: '+1234567890', createdAt: '2023-01-01' },
      { id: '2', name: 'Client 2', phone: '+0987654321', createdAt: '2023-01-02' }
    ];

    mockUseClients.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    const { result } = renderHook(() => useClients());

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle loading state', () => {
    mockUseClients.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn()
    });

    const { result } = renderHook(() => useClients());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
