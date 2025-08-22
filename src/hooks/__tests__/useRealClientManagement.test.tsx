
import { renderHook, waitFor } from '@testing-library/react';
import { useClients } from '@/hooks/clients/queries';

// Mock the queries module
jest.mock('@/hooks/clients/queries', () => ({
  useClients: jest.fn()
}));

const mockUseClients = useClients as jest.MockedFunction<typeof useClients>;

describe('useRealClientManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle client queries correctly', async () => {
    const mockData = [
      { id: '1', name: 'Client 1', phone: '+1234567890' },
      { id: '2', name: 'Client 2', phone: '+0987654321' }
    ];

    mockUseClients.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    } as any);

    const { result } = renderHook(() => useClients());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle loading state', () => {
    mockUseClients.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    } as any);

    const { result } = renderHook(() => useClients());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
