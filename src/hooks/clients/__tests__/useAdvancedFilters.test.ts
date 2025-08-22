import { renderHook, act } from '@testing-library/react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

// Mock do contexto de autenticação
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user123' }
  })
}));

// Mock das queries
jest.mock('@/hooks/clients/queries', () => ({
  useFilterOptions: () => ({
    data: {
      tags: [],
      responsibleUsers: [],
      funnelIds: [],
      funnelStages: [],
      states: [],
      cities: [],
      countries: []
    },
    isLoading: false
  }),
  useFilteredClientsQuery: () => ({
    data: [],
    isLoading: false
  })
}));

describe('useAdvancedFilters', () => {
  it('deve inicializar com filtros vazios', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    expect(result.current.filters).toEqual({
      tags: [],
      responsibleUsers: [],
      funnelIds: [],
      funnelStages: [],
      states: [],
      cities: [],
      countries: [],
      dateRange: undefined
    });
  });

  it('deve adicionar tag ao filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addTagFilter('tag1');
    });
    
    expect(result.current.filters.tags).toContain('tag1');
  });

  it('deve remover tag do filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addTagFilter('tag1');
      result.current.removeTagFilter('tag1');
    });
    
    expect(result.current.filters.tags).not.toContain('tag1');
  });

  it('deve adicionar usuário ao filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addUserFilter('user1');
    });
    
    expect(result.current.filters.responsibleUsers).toContain('user1');
  });

  it('deve remover usuário do filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addUserFilter('user1');
      result.current.removeUserFilter('user1');
    });
    
    expect(result.current.filters.responsibleUsers).not.toContain('user1');
  });

  it('deve adicionar funil ao filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addFunnelFilter('funil1');
    });
    
    expect(result.current.filters.funnelIds).toContain('funil1');
  });

  it('deve remover funil do filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addFunnelFilter('funil1');
      result.current.removeFunnelFilter('funil1');
    });
    
    expect(result.current.filters.funnelIds).not.toContain('funil1');
  });

  it('deve adicionar etapa do funil ao filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addStageFilter('stage1');
    });
    
    expect(result.current.filters.funnelStages).toContain('stage1');
  });

  it('deve remover etapa do funil do filtro', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addStageFilter('stage1');
      result.current.removeStageFilter('stage1');
    });
    
    expect(result.current.filters.funnelStages).not.toContain('stage1');
  });

  it('deve atualizar filtro genérico', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.updateFilter('states', ['SP', 'RJ']);
    });
    
    expect(result.current.filters.states).toEqual(['SP', 'RJ']);
  });

  it('deve limpar todos os filtros', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addTagFilter('tag1');
      result.current.addUserFilter('user1');
      result.current.clearFilters();
    });
    
    expect(result.current.filters.tags).toHaveLength(0);
    expect(result.current.filters.responsibleUsers).toHaveLength(0);
  });

  it('deve remover filtro específico', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addTagFilter('tag1');
      result.current.addTagFilter('tag2');
      result.current.removeFilter('tags');
    });
    
    expect(result.current.filters.tags).toHaveLength(0);
  });

  it('deve detectar quando há filtros ativos', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    act(() => {
      result.current.addTagFilter('tag1');
    });
    
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.activeFiltersCount).toBe(1);
  });

  it('deve retornar 0 quando não há filtros ativos', () => {
    const { result } = renderHook(() => useAdvancedFilters());
    
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFiltersCount).toBe(0);
  });
});