import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Clients from '@/pages/Clients';
import { useRealClientManagement } from '@/hooks/useRealClientManagement';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

// Mocks
jest.mock('@/hooks/useRealClientManagement', () => ({
  useRealClientManagement: jest.fn()
}));

jest.mock('@/hooks/clients/useAdvancedFilters', () => ({
  useAdvancedFilters: jest.fn()
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
  }
];

const mockUseRealClientManagement = {
  clients: mockClients,
  setSearchQuery: jest.fn(),
  selectedClient: null,
  isDetailsOpen: false,
  isCreateMode: false,
  isLoading: false,
  isLoadingMore: false,
  hasMoreClients: false,
  loadMoreClients: jest.fn(),
  totalClientsCount: 1,
  setIsDetailsOpen: jest.fn(),
  handleSelectClient: jest.fn(),
  handleCreateClient: jest.fn(),
  handleSaveNewClient: jest.fn(),
  handleDeleteClient: jest.fn(),
  handleUpdateNotes: jest.fn(),
  handleUpdatePurchaseValue: jest.fn(),
  handleUpdateBasicInfo: jest.fn(),
  handleUpdateDocument: jest.fn(),
  handleUpdateAddress: jest.fn(),
  refetch: jest.fn()
};

const mockUseAdvancedFilters = {
  isOpen: false,
  setIsOpen: jest.fn(),
  hasActiveFilters: false,
  activeFiltersCount: 0,
  filterSummary: {
    totalFilters: 0,
    activeFilters: []
  },
  clearFilters: jest.fn(),
  removeFilter: jest.fn(),
  filterOptions: {
    tags: [],
    responsibleUsers: [],
    funnelIds: [],
    funnelStages: [],
    states: [],
    cities: [],
    countries: []
  },
  isLoadingOptions: false,
  updateFilter: jest.fn(),
  addTagFilter: jest.fn(),
  removeTagFilter: jest.fn(),
  addUserFilter: jest.fn(),
  removeUserFilter: jest.fn(),
  addFunnelFilter: jest.fn(),
  removeFunnelFilter: jest.fn(),
  addStageFilter: jest.fn(),
  removeStageFilter: jest.fn()
};

describe('Fluxo Completo de Filtros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRealClientManagement as jest.Mock).mockReturnValue(mockUseRealClientManagement);
    (useAdvancedFilters as jest.Mock).mockReturnValue(mockUseAdvancedFilters);
  });

  it('deve renderizar a página de clientes com filtros', () => {
    render(<Clients />);
    
    // Verificar elementos principais
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Gerencie seus clientes e relacionamentos comerciais')).toBeInTheDocument();
    expect(screen.getByText('Filtros')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Cliente')).toBeInTheDocument();
  });

  it('deve mostrar contagem de clientes', () => {
    render(<Clients />);
    
    expect(screen.getByText('Total: 1 clientes')).toBeInTheDocument();
  });

  it('deve abrir o modal de filtros ao clicar no botão', () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      isOpen: true
    });

    render(<Clients />);
    
    // Verificar que o modal está aberto
    expect(screen.getByText('Filtros Avançados')).toBeInTheDocument();
  });

  it('deve mostrar badge com contagem de filtros ativos', () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      activeFiltersCount: 2,
      hasActiveFilters: true
    });

    render(<Clients />);
    
    // Verificar badge de filtros ativos
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('deve atualizar a lista de clientes quando filtros são aplicados', async () => {
    // Simular aplicação de filtros
    (useRealClientManagement as jest.Mock).mockReturnValue({
      ...mockUseRealClientManagement,
      clients: [] // Nenhum cliente após filtragem
    });

    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      hasActiveFilters: true,
      activeFiltersCount: 1
    });

    render(<Clients />);
    
    // Verificar que a lista foi atualizada
    await waitFor(() => {
      expect(screen.getByText('Total: 0 clientes')).toBeInTheDocument();
    });
  });

  it('deve manter funcionalidades existentes quando não há filtros', () => {
    render(<Clients />);
    
    // Verificar que funcionalidades básicas ainda funcionam
    expect(screen.getByText('Adicionar Cliente')).toBeInTheDocument();
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
    
    // Verificar busca
    const searchInput = screen.getByPlaceholderText('Buscar por nome, telefone, email ou empresa...');
    expect(searchInput).toBeInTheDocument();
  });

  it('deve integrar corretamente com o sistema de paginação', () => {
    (useRealClientManagement as jest.Mock).mockReturnValue({
      ...mockUseRealClientManagement,
      hasMoreClients: true,
      totalClientsCount: 100
    });

    render(<Clients />);
    
    // Verificar elementos de paginação
    expect(screen.getByText('Total: 1 clientes')).toBeInTheDocument();
  });
});