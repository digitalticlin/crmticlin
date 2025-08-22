import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedFiltersPopover } from '../AdvancedFiltersPopover';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

// Mock do hook useAdvancedFilters
jest.mock('@/hooks/clients/useAdvancedFilters', () => ({
  useAdvancedFilters: jest.fn()
}));

// Mock data
const mockFilterOptions = {
  tags: [
    { id: '1', name: 'Importante', color: '#ff0000' },
    { id: '2', name: 'Cliente', color: '#00ff00' }
  ],
  responsibleUsers: [
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' }
  ],
  funnelIds: [
    { id: '1', name: 'Funil Principal' },
    { id: '2', name: 'Funil Secundário' }
  ],
  funnelStages: [
    { id: '1', title: 'Entrada de Leads' },
    { id: '2', title: 'Em atendimento' }
  ],
  states: ['SP', 'RJ', 'MG'],
  cities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'],
  countries: ['Brasil', 'Portugal']
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
  filterOptions: mockFilterOptions,
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

describe('AdvancedFiltersPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAdvancedFilters as jest.Mock).mockReturnValue(mockUseAdvancedFilters);
  });

  it('deve renderizar o botão de filtros', () => {
    render(<AdvancedFiltersPopover />);
    
    expect(screen.getByText('Filtros')).toBeInTheDocument();
  });

  it('deve abrir o popover quando o botão é clicado', () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      isOpen: true
    });

    render(<AdvancedFiltersPopover />);
    
    expect(screen.getByText('Filtros Avançados')).toBeInTheDocument();
  });

  it('deve mostrar contagem de filtros ativos', () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      activeFiltersCount: 2,
      hasActiveFilters: true
    });

    render(<AdvancedFiltersPopover />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('deve mostrar resumo de filtros ativos', () => {
    const mockFilterSummary = {
      totalFilters: 1,
      activeFilters: [
        { type: 'tags', label: 'Tags', value: 'Importante' }
      ]
    };

    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      isOpen: true,
      hasActiveFilters: true,
      activeFiltersCount: 1,
      filterSummary: mockFilterSummary
    });

    render(<AdvancedFiltersPopover />);
    
    expect(screen.getByText('Filtros Ativos:')).toBeInTheDocument();
    expect(screen.getByText('Tags: Importante')).toBeInTheDocument();
  });

  it('deve renderizar todos os componentes de filtro', () => {
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      isOpen: true
    });

    render(<AdvancedFiltersPopover />);
    
    // Verificar se todos os componentes estão presentes
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Responsáveis')).toBeInTheDocument();
    expect(screen.getByText('Funis')).toBeInTheDocument();
    expect(screen.getByText('Etapas do Funil')).toBeInTheDocument();
    expect(screen.getByText('Localização')).toBeInTheDocument();
    expect(screen.getByText('Data de Criação')).toBeInTheDocument();
    expect(screen.getByText('Aplicar')).toBeInTheDocument();
  });

  it('deve chamar setIsOpen quando o botão Aplicar é clicado', () => {
    const mockSetIsOpen = jest.fn();
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      isOpen: true,
      setIsOpen: mockSetIsOpen
    });

    render(<AdvancedFiltersPopover />);
    
    const applyButton = screen.getByText('Aplicar');
    fireEvent.click(applyButton);
    
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it('deve chamar clearFilters quando o botão de limpar é clicado', () => {
    const mockClearFilters = jest.fn();
    (useAdvancedFilters as jest.Mock).mockReturnValue({
      ...mockUseAdvancedFilters,
      isOpen: true,
      hasActiveFilters: true,
      activeFiltersCount: 1,
      clearFilters: mockClearFilters
    });

    render(<AdvancedFiltersPopover />);
    
    const clearButton = screen.getByRole('button', { name: '' }); // Botão de limpar
    fireEvent.click(clearButton);
    
    expect(mockClearFilters).toHaveBeenCalled();
  });
});