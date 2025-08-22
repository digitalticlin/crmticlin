import { useFilteredClientsQuery } from '@/hooks/clients/queries';
import { renderHook } from '@testing-library/react';

// Mock do Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockIn = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockOr = jest.fn();
const mockLimit = jest.fn();

// Mock do módulo Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom
  }
}));

describe('useFilteredClientsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar os mocks em cadeia
    mockFrom.mockReturnValue({
      select: mockSelect
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq
    });
    
    mockEq.mockReturnValue({
      order: mockOrder
    });
    
    mockOrder.mockReturnValue({
      or: mockOr
    });
    
    mockOr.mockReturnValue({
      in: mockIn
    });
    
    mockIn.mockReturnValue({
      gte: mockGte
    });
    
    mockGte.mockReturnValue({
      lte: mockLte
    });
    
    mockLte.mockReturnValue({
      limit: mockLimit
    });
    
    mockLimit.mockResolvedValue({
      data: [],
      error: null
    });
  });

  it('deve aplicar filtro por estados', async () => {
    const filters = {
      states: ['SP', 'RJ']
    };

    mockLimit.mockResolvedValue({
      data: [],
      error: null
    });

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockIn).toHaveBeenCalledWith('state', ['SP', 'RJ']);
  });

  it('deve aplicar filtro por cidades', async () => {
    const filters = {
      cities: ['São Paulo', 'Rio de Janeiro']
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockIn).toHaveBeenCalledWith('city', ['São Paulo', 'Rio de Janeiro']);
  });

  it('deve aplicar filtro por países', async () => {
    const filters = {
      countries: ['Brasil', 'Portugal']
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockIn).toHaveBeenCalledWith('country', ['Brasil', 'Portugal']);
  });

  it('deve aplicar filtro por data', async () => {
    const from = new Date('2023-01-01');
    const to = new Date('2023-12-31');
    
    const filters = {
      dateRange: { from, to }
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGte).toHaveBeenCalledWith('created_at', from.toISOString());
    expect(mockLte).toHaveBeenCalledWith('created_at', to.toISOString());
  });

  it('deve aplicar filtro por usuários responsáveis', async () => {
    const filters = {
      responsibleUsers: ['user1', 'user2']
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockIn).toHaveBeenCalledWith('owner_id', ['user1', 'user2']);
  });

  it('deve aplicar filtro por funis', async () => {
    const filters = {
      funnelIds: ['funil1', 'funil2']
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockIn).toHaveBeenCalledWith('funnel_id', ['funil1', 'funil2']);
  });

  it('deve aplicar filtro por etapas do funil', async () => {
    const filters = {
      funnelStages: ['stage1', 'stage2']
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockIn).toHaveBeenCalledWith('kanban_stage_id', ['stage1', 'stage2']);
  });

  it('deve aplicar filtro por tags', async () => {
    const mockData = [
      {
        id: '1',
        name: 'Cliente Teste',
        lead_tags: [
          {
            tags: {
              id: 'tag1',
              name: 'Importante'
            }
          }
        ]
      }
    ];

    mockLimit.mockResolvedValue({
      data: mockData,
      error: null
    });

    const filters = {
      tags: ['tag1']
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verificar que os dados foram filtrados corretamente
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('1');
  });

  it('deve aplicar múltiplos filtros simultaneamente', async () => {
    const filters = {
      states: ['SP'],
      cities: ['São Paulo'],
      dateRange: { 
        from: new Date('2023-01-01'),
        to: new Date('2023-12-31')
      },
      responsibleUsers: ['user1']
    };

    const { result } = renderHook(() => 
      useFilteredClientsQuery('user123', '', filters)
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verificar que todos os filtros foram aplicados
    expect(mockIn).toHaveBeenCalledWith('state', ['SP']);
    expect(mockIn).toHaveBeenCalledWith('city', ['São Paulo']);
    expect(mockIn).toHaveBeenCalledWith('owner_id', ['user1']);
    expect(mockGte).toHaveBeenCalled();
    expect(mockLte).toHaveBeenCalled();
  });
});

// Helper para waitFor
const waitFor = (callback: () => void) => {
  return new Promise<void>((resolve) => {
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        setTimeout(check, 10);
      }
    };
    check();
  });
};