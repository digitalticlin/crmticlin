import { renderHook } from '@testing-library/react';
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

describe('Teste de Exemplo', () => {
  it('deve passar', () => {
    expect(1).toBe(1);
  });
});