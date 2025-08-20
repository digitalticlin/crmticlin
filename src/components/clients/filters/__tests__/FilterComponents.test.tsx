import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterByTags } from '../FilterByTags';
import { FilterByUser } from '../FilterByUser';
import { FilterByFunnel } from '../FilterByFunnel';
import { FilterByFunnelStage } from '../FilterByFunnelStage';
import { FilterByLocation } from '../FilterByLocation';
import { FilterByDate } from '../FilterByDate';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

// Mock do hook useAdvancedFilters
jest.mock('@/hooks/clients/useAdvancedFilters', () => ({
  useAdvancedFilters: jest.fn()
}));

// Mock data
const mockTags = [
  { id: '1', name: 'Importante', color: '#ff0000' },
  { id: '2', name: 'Cliente', color: '#00ff00' }
];

const mockUsers = [
  { id: '1', name: 'João Silva' },
  { id: '2', name: 'Maria Santos' }
];

const mockFunnels = [
  { id: '1', name: 'Funil Principal' },
  { id: '2', name: 'Funil Secundário' }
];

const mockStages = [
  { id: '1', title: 'Entrada de Leads' },
  { id: '2', title: 'Em atendimento' }
];

const mockStates = ['SP', 'RJ', 'MG'];
const mockCities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];
const mockCountries = ['Brasil', 'Portugal'];

// Mock implementations
const mockAddTagFilter = jest.fn();
const mockRemoveTagFilter = jest.fn();
const mockAddUserFilter = jest.fn();
const mockRemoveUserFilter = jest.fn();
const mockAddFunnelFilter = jest.fn();
const mockRemoveFunnelFilter = jest.fn();
const mockAddStageFilter = jest.fn();
const mockRemoveStageFilter = jest.fn();
const mockUpdateFilter = jest.fn();

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
  addTagFilter: mockAddTagFilter,
  removeTagFilter: mockRemoveTagFilter,
  addUserFilter: mockAddUserFilter,
  removeUserFilter: mockRemoveUserFilter,
  addFunnelFilter: mockAddFunnelFilter,
  removeFunnelFilter: mockRemoveFunnelFilter,
  addStageFilter: mockAddStageFilter,
  removeStageFilter: mockRemoveStageFilter,
  updateFilter: mockUpdateFilter
};

describe('Componentes de Filtro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAdvancedFilters as jest.Mock).mockReturnValue(mockUseAdvancedFilters);
  });

  describe('FilterByTags', () => {
    it('deve renderizar tags disponíveis', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { tags: mockTags }
      });

      render(<FilterByTags tags={mockTags} isLoading={false} />);
      
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('Importante')).toBeInTheDocument();
      expect(screen.getByText('Cliente')).toBeInTheDocument();
    });

    it('deve chamar addTagFilter quando uma tag é selecionada', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { tags: mockTags }
      });

      render(<FilterByTags tags={mockTags} isLoading={false} />);
      
      const tagCheckbox = screen.getByLabelText('Importante');
      fireEvent.click(tagCheckbox);
      
      expect(mockAddTagFilter).toHaveBeenCalledWith('1');
    });
  });

  describe('FilterByUser', () => {
    it('deve renderizar usuários disponíveis', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { responsibleUsers: mockUsers }
      });

      render(<FilterByUser users={mockUsers} isLoading={false} />);
      
      expect(screen.getByText('Responsáveis')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    it('deve chamar addUserFilter quando um usuário é selecionado', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { responsibleUsers: mockUsers }
      });

      render(<FilterByUser users={mockUsers} isLoading={false} />);
      
      const userCheckbox = screen.getByLabelText('João Silva');
      fireEvent.click(userCheckbox);
      
      expect(mockAddUserFilter).toHaveBeenCalledWith('1');
    });
  });

  describe('FilterByFunnel', () => {
    it('deve renderizar funis disponíveis', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { funnelIds: mockFunnels }
      });

      render(<FilterByFunnel funnels={mockFunnels} isLoading={false} />);
      
      expect(screen.getByText('Funis')).toBeInTheDocument();
      expect(screen.getByText('Funil Principal')).toBeInTheDocument();
      expect(screen.getByText('Funil Secundário')).toBeInTheDocument();
    });

    it('deve chamar addFunnelFilter quando um funil é selecionado', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { funnelIds: mockFunnels }
      });

      render(<FilterByFunnel funnels={mockFunnels} isLoading={false} />);
      
      const funnelCheckbox = screen.getByLabelText('Funil Principal');
      fireEvent.click(funnelCheckbox);
      
      expect(mockAddFunnelFilter).toHaveBeenCalledWith('1');
    });
  });

  describe('FilterByFunnelStage', () => {
    it('deve renderizar etapas disponíveis', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { funnelStages: mockStages }
      });

      render(<FilterByFunnelStage stages={mockStages} isLoading={false} />);
      
      expect(screen.getByText('Etapas do Funil')).toBeInTheDocument();
      expect(screen.getByText('Entrada de Leads')).toBeInTheDocument();
      expect(screen.getByText('Em atendimento')).toBeInTheDocument();
    });

    it('deve chamar addStageFilter quando uma etapa é selecionada', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { funnelStages: mockStages }
      });

      render(<FilterByFunnelStage stages={mockStages} isLoading={false} />);
      
      const stageCheckbox = screen.getByLabelText('Entrada de Leads');
      fireEvent.click(stageCheckbox);
      
      expect(mockAddStageFilter).toHaveBeenCalledWith('1');
    });
  });

  describe('FilterByLocation', () => {
    it('deve renderizar países, estados e cidades disponíveis', () => {
      (useAdvancedFilters as jest.Mock).mockReturnValue({
        ...mockUseAdvancedFilters,
        filterOptions: { 
          states: mockStates,
          cities: mockCities,
          countries: mockCountries
        }
      });

      render(
        <FilterByLocation 
          states={mockStates} 
          cities={mockCities} 
          countries={mockCountries}
          isLoading={false} 
        />
      );
      
      expect(screen.getByText('Localização')).toBeInTheDocument();
      expect(screen.getByText('Brasil')).toBeInTheDocument();
      expect(screen.getByText('SP')).toBeInTheDocument();
      expect(screen.getByText('São Paulo')).toBeInTheDocument();
    });
  });

  describe('FilterByDate', () => {
    it('deve renderizar opções de data', () => {
      render(<FilterByDate />);
      
      expect(screen.getByText('Data de Criação')).toBeInTheDocument();
      expect(screen.getByText('7 dias')).toBeInTheDocument();
      expect(screen.getByText('30 dias')).toBeInTheDocument();
    });

    it('deve chamar updateFilter quando um período é selecionado', () => {
      render(<FilterByDate />);
      
      const sevenDaysButton = screen.getByText('7 dias');
      fireEvent.click(sevenDaysButton);
      
      expect(mockUpdateFilter).toHaveBeenCalled();
    });
  });
});