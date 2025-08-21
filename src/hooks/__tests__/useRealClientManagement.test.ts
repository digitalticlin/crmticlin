
import { render, screen, waitFor } from '@testing-library/react';
import { useRealClientManagement } from '@/hooks/useRealClientManagement';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';
import { useClientsQuery } from '@/hooks/clients/queries';

// Mocks
jest.mock('@/hooks/clients/useAdvancedFilters', () => ({
  useAdvancedFilters: jest.fn()
}));

jest.mock('@/hooks/clients/queries', () => ({
  useClientsQuery: jest.fn(),
  useFilterOptions: jest.fn(),
  useFilteredClientsQuery: jest.fn()
}));

// Mock data
const mockClients = [
  {
    id: '1',
    name: 'João Silva',
    phone: '11999999999',
    email: 'joao@email.com',
    company: 'Empresa A',
    created_at: '2023-01-01T00:00:00Z',
    tags: []
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '11888888888',
    email: 'maria@email.com',
    company: 'Empresa B',
    created_at: '2023-01-02T00:00:00Z',
    tags: []
  }
];

const mockUseClientsQuery = {
  data: {
    pages: [
      {
        data: mockClients,
        nextCursor: undefined,
        hasMore: false,
        totalCount: 2
      }
    ]
  },
  isLoading: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn()
};

const mockUseAdvancedFilters = {
  filters: {
    tags: [],
    responsibleUsers: [],
    funnelIds: [],
    funnelStages: [],
    states: [],
    cities: [],
    countries: [],
    dateRange: undefined
  },
  hasActiveFilters: false,
  filteredClients: mockClients
};

// Helper para renderizar hooks em testes
const renderHook = <T>(callback: () => T) => {
  let result: T;
  const TestComponent = () => {
    result = callback();
    return null;
  };
  render(<TestComponent />);
  return { result: result! };
};

describe('Integração do Sistema de Filtros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useClientsQuery as jest.Mock).mockReturnValue(mockUseClientsQuery);
    (useAdvancedFilters as jest.Mock).mockReturnValue(mockUseAdvancedFilters);
  });

  it('deve retornar clientes filtrados quando há filtros ativos', async () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      hasActiveFilters: true,
      filteredClients: [mockClients[0]] // Apenas o primeiro cliente
    });

    const { result } = renderHook(() => useRealClientManagement());
    
    await waitFor(() => {
      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].name).toBe('João Silva');
    });
  });

  it('deve retornar todos os clientes quando não há filtros ativos', async () => {
    const { result } = renderHook(() => useRealClientManagement());
    
    await waitFor(() => {
      expect(result.current.clients).toHaveLength(2);
      expect(result.current.totalClientsCount).toBe(2);
    });
  });

  it('deve desativar paginação quando há filtros ativos', async () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      hasActiveFilters: true
    });

    const { result } = renderHook(() => useRealClientManagement());
    
    await waitFor(() => {
      expect(result.current.hasMoreClients).toBe(false);
    });
  });

  it('deve manter paginação quando não há filtros ativos', async () => {
    (useClientsQuery as jest.Mock).mockReturnValue({
      ...mockUseClientsQuery,
      data: {
        pages: [
          {
            data: mockClients,
            nextCursor: 2,
            hasMore: true,
            totalCount: 10
          }
        ]
      }
    });

    const { result } = renderHook(() => useRealClientManagement());
    
    await waitFor(() => {
      expect(result.current.hasMoreClients).toBe(true);
      expect(result.current.totalClientsCount).toBe(10);
    });
  });

  it('deve atualizar contagem de clientes com base em filtros', async () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      hasActiveFilters: true,
      filteredClients: [mockClients[0]]
    });

    const { result } = renderHook(() => useRealClientManagement());
    
    await waitFor(() => {
      expect(result.current.totalClientsCount).toBe(1);
    });
  });
});
