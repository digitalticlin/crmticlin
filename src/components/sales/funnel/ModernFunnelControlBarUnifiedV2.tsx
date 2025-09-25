/**
 * 🎨 MODERN UNIFIED CONTROL BAR V2
 *
 * Versão refatorada com hooks coordenadores isolados
 * Estrutura modular sem conflitos
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Search, X, Settings, Users, Tag, Zap, UserPlus, Filter, CheckSquare, Square } from "lucide-react";

// Hooks coordenadores
import { useControlBarCoordinator } from "@/hooks/salesFunnel/useControlBarCoordinator";
import { useFiltersCoordinator } from "@/hooks/salesFunnel/useFiltersCoordinator";

// Modais
import { SimplifiedTagModal } from "../tags/SimplifiedTagModal";
import { CreateFunnelModal } from "./CreateFunnelModal";
import { FunnelConfigModal } from "./modals/FunnelConfigModal";
import { RealClientDetails } from "@/components/clients/RealClientDetails";

// Hooks auxiliares
import { useSimplifiedTagModal } from "@/hooks/salesFunnel/useSimplifiedTagModal";
import { MassSelectionCoordinatedReturn } from "@/hooks/useMassSelectionCoordinated";

interface ModernFunnelControlBarUnifiedV2Props {
  funnels: any[];
  selectedFunnel: any;
  onFunnelSelect: (funnel: any) => void;
  onRefresh: () => void;
  onRefreshLeads?: () => void;
  stages?: any[];
  massSelection?: MassSelectionCoordinatedReturn;
  allLeads?: any[];
  onFiltersChange?: (filters: any) => void;
  currentView?: "board" | "won-lost";
  onViewChange?: (view: "board" | "won-lost") => void;
}

export function ModernFunnelControlBarUnifiedV2({
  funnels,
  selectedFunnel,
  onFunnelSelect,
  onRefresh,
  onRefreshLeads,
  stages = [],
  massSelection,
  allLeads = [],
  onFiltersChange,
  currentView = "board",
  onViewChange
}: ModernFunnelControlBarUnifiedV2Props) {

  // 🎮 Hook coordenador da barra de controle
  const controlBar = useControlBarCoordinator(onRefresh, onFunnelSelect, onRefreshLeads);

  // 🔍 Hook coordenador dos filtros
  const filters = useFiltersCoordinator();

  // 🏷️ Hook do modal de tags
  const {
    isOpen: isTagModalOpen,
    setIsOpen: setIsTagModalOpen,
    tags,
    isLoading: isTagsLoading,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag,
  } = useSimplifiedTagModal();

  // Sincronizar estado do funil selecionado
  useEffect(() => {
    if (selectedFunnel) {
      controlBar.setSelectedFunnel(selectedFunnel);
    }
  }, [selectedFunnel]);

  // Sincronizar stages
  useEffect(() => {
    if (stages) {
      controlBar.setStages(stages);
    }
  }, [stages]);

  // Sincronizar view
  useEffect(() => {
    controlBar.setCurrentView(currentView);
  }, [currentView]);

  // Notificar mudanças nos filtros - COM DEBOUNCE para evitar loops
  useEffect(() => {
    if (onFiltersChange) {
      const timeoutId = setTimeout(() => {
        // ✅ CORREÇÃO: Sempre notificar mudanças, mesmo quando filtros estão vazios
        onFiltersChange({
          searchTerm: filters.state.searchTerm,
          selectedTags: filters.state.selectedTags,
          selectedUser: filters.state.selectedUser,
          hasActiveFilters: filters.hasActiveFilters
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [filters.state.searchTerm, filters.state.selectedTags, filters.state.selectedUser, filters.hasActiveFilters, onFiltersChange]);

  // Extrair dados para filtros
  const availableTags = filters.getAvailableTags(allLeads);
  const availableUsers = filters.getAvailableUsers(allLeads);

  // Debug dos filtros
  console.log('[ModernFunnelControlBarUnifiedV2] Dados dos filtros:', {
    allLeads: allLeads.length,
    availableTags: availableTags.length,
    availableUsers: availableUsers.length,
    tags: availableTags,
    users: availableUsers
  });

  return (
    <>
      {/* 🎨 BARRA DE CONTROLE SUPERIOR */}
      <div className="relative w-full">
        {/* Backdrop glassmórfico */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 backdrop-blur-xl border-b border-white/20"></div>

        {/* Conteúdo principal */}
        <div className="relative">
          {/* Header: Tabs + Actions */}
          <div className="flex items-center justify-between px-6 py-4">

            {/* Left: Navigation Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('[ModernFunnelControlBarUnifiedV2] ⚡ Clicando em Board/Funil');
                  console.log('Current view:', currentView);
                  console.log('onViewChange exists:', !!onViewChange);

                  // Executar mudança de view primeiro
                  if (onViewChange) {
                    onViewChange("board");
                  }

                  // Depois executar ação do coordinator
                  controlBar.switchToBoard();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === "board"
                    ? "bg-white/80 text-gray-900 shadow-lg backdrop-blur-sm ring-1 ring-white/30"
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {selectedFunnel?.name || "Funil"}
                </span>
              </button>

              <button
                onClick={() => {
                  console.log('[ModernFunnelControlBarUnifiedV2] 🏆 Clicando em Ganhos e Perdidos');
                  console.log('Current view:', currentView);
                  console.log('onViewChange exists:', !!onViewChange);

                  // Executar mudança de view primeiro
                  if (onViewChange) {
                    onViewChange("won-lost");
                  }

                  // Depois executar ação do coordinator
                  controlBar.switchToWonLost();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentView === "won-lost"
                    ? "bg-white/80 text-gray-900 shadow-lg backdrop-blur-sm ring-1 ring-white/30"
                    : "text-gray-700 hover:text-gray-900 hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                <span className="flex items-center gap-2">
                  🏆 Ganhos e Perdidos
                </span>
              </button>

              {/* Seletor de Funil */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-3 text-gray-600 hover:text-gray-900 hover:bg-white/30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl rounded-2xl">
                  <div className="p-2">
                    {/* Lista de Funis Existentes */}
                    <div className="text-xs font-medium text-gray-500 px-3 py-2">Alternar Funil ({funnels.length})</div>
                    <div className="max-h-64 overflow-y-auto">
                      {funnels.map(funnel => (
                        <DropdownMenuItem
                          key={funnel.id}
                          onClick={() => onFunnelSelect(funnel)}
                          className={`rounded-xl mx-1 px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                            selectedFunnel?.id === funnel.id
                              ? 'bg-blue-50 text-blue-900 font-medium ring-1 ring-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate font-medium">{funnel.name}</span>
                            {selectedFunnel?.id === funnel.id && (
                              <span className="ml-2 text-blue-600 font-semibold">✓</span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>

                    {/* Botão Criar Funil - SIMPLIFICADO NO FINAL */}
                    {controlBar.canCreateFunnel && (
                      <>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem
                          onClick={controlBar.openCreateFunnel}
                          className="rounded-xl mx-1 px-3 py-2 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Funil
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Botões de Ação Principais */}
              {!massSelection?.isSelectionMode && (
                <>
                  {/* Botão + Lead */}
                  <Button
                    onClick={controlBar.openCreateLead}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    + Lead
                  </Button>

                  {/* Botão + Tags */}
                  <Button
                    onClick={() => {
                      console.log('[ModernFunnelControlBarUnifiedV2] 🏷️ Clicando em + Tags');
                      console.log('Modal state before:', controlBar.state.isManageTagsOpen);
                      controlBar.openManageTags();
                    }}
                    variant="outline"
                    className="bg-white/60 backdrop-blur-sm border-white/30 rounded-xl hover:bg-white/80"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    + Tags
                  </Button>

                  {/* Botão Personalizar Funil */}
                  <Button
                    onClick={() => {
                      console.log('[ModernFunnelControlBarUnifiedV2] ⚙️ Clicando em Personalizar');
                      console.log('Selected funnel:', selectedFunnel?.id, selectedFunnel?.name);
                      console.log('Stages available:', stages?.length || 0);
                      if (!selectedFunnel?.id) {
                        console.warn('Nenhum funil selecionado para personalizar');
                        return;
                      }
                      controlBar.openConfigureFunnel();
                    }}
                    variant="outline"
                    className="bg-white/60 backdrop-blur-sm border-white/30 rounded-xl hover:bg-white/80"
                    disabled={!selectedFunnel?.id}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Personalizar
                  </Button>
                </>
              )}

              {/* Menu de Configurações Adicionais (oculto por enquanto) */}
              {false && controlBar.isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900 hover:bg-white/40 rounded-xl"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl rounded-2xl">
                    <div className="p-2">
                      <DropdownMenuItem onClick={controlBar.openManageTags} className="rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <Tag className="w-4 h-4 mr-2" />
                        Gerenciar Tags
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={controlBar.openConfigureFunnel} className="rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <Settings className="w-4 h-4 mr-2" />
                        Personalizar Funil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem onClick={onRefresh} className="rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50">
                        Atualizar
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* 🔍 BARRA DE FILTROS */}
          <div className="px-6 pb-4">
            <div className="bg-white/30 backdrop-blur-lg border border-white/30 rounded-2xl px-4 py-2.5 shadow-lg">
              <div className="flex items-center justify-center gap-4">
              {/* Ícone de Filtro */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Filtros:</span>
              </div>
              {/* Campo de Busca */}
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar leads..."
                  value={filters.state.searchTerm}
                  onChange={(e) => filters.setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-200 rounded-xl h-9 text-sm placeholder:text-gray-400 focus:bg-white focus:border-blue-300 transition-all shadow-sm"
                />
              </div>

              {/* Filtro de Tags - Sempre visível */}
              {true && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-white border border-gray-200 hover:border-gray-300 rounded-full h-8 px-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all text-xs font-medium shadow-sm"
                    >
                      <Tag className="w-3 h-3 mr-2" />
                      Tags
                      {filters.state.selectedTags.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs h-4 px-1.5">
                          {filters.state.selectedTags.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl rounded-2xl">
                    <div className="p-3">
                      <div className="text-xs font-medium text-gray-500 mb-3">Filtrar por Tags</div>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {availableTags.length > 0 ? (
                          availableTags.map((tag) => (
                            <div
                              key={tag.id}
                              onClick={() => filters.toggleTag(tag.id)}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer group"
                            >
                              <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                {tag.name}
                              </span>
                              {filters.state.selectedTags.includes(tag.id) && (
                                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 text-xs">✓</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Nenhuma tag encontrada.<br />
                            Adicione tags aos leads para filtrar.
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Filtro de Responsável - Sempre visível */}
              {true && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-white border border-gray-200 hover:border-gray-300 rounded-full h-8 px-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all text-xs font-medium shadow-sm"
                    >
                      <Users className="w-3 h-3 mr-2" />
                      Responsável
                      {filters.state.selectedUser && filters.state.selectedUser !== "all" && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-xs h-4 px-1.5">
                          1
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-xl border-white/30 shadow-2xl rounded-2xl">
                    <div className="p-3">
                      <div className="text-xs font-medium text-gray-500 mb-3">Filtrar por Responsável</div>
                      <div className="space-y-1">
                        <div
                          onClick={() => filters.setSelectedUser("all")}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="text-sm font-medium text-gray-700">Todos</span>
                          {(!filters.state.selectedUser || filters.state.selectedUser === "all") && (
                            <span className="text-blue-600 text-xs">✓</span>
                          )}
                        </div>
                        {availableUsers.length > 0 ? (
                          availableUsers.map((user) => (
                            <div
                              key={user}
                              onClick={() => filters.setSelectedUser(user)}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                            >
                              <span className="text-sm font-medium text-gray-700">
                                {user || "Sem responsável"}
                              </span>
                              {filters.state.selectedUser === user && (
                                <span className="text-blue-600 text-xs">✓</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Nenhum responsável encontrado.<br />
                            Atribua leads para filtrar por responsável.
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Seleção em Massa */}
              {massSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (massSelection.isSelectionMode) {
                      massSelection.exitSelectionMode();
                    } else {
                      massSelection.enterSelectionMode();
                    }
                  }}
                  className={`rounded-full h-8 px-3 text-xs font-medium border transition-all ${
                    massSelection.isSelectionMode
                      ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                      : "bg-white border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {massSelection.isSelectionMode ? (
                    <>
                      <CheckSquare className="w-3 h-3 mr-2" />
                      Sair da Seleção
                    </>
                  ) : (
                    <>
                      <Square className="w-3 h-3 mr-2" />
                      Seleção em Massa
                    </>
                  )}
                </Button>
              )}

              {/* Limpar Filtros */}
              {filters.hasActiveFilters && (
                <Button
                  onClick={filters.clearFilters}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 px-3 text-xs font-medium border border-red-200 hover:border-red-300 transition-all"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar ({filters.getActiveFiltersCount()})
                </Button>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAIS */}

      {/* Modal de Tags */}
      <SimplifiedTagModal
        isOpen={controlBar.state.isManageTagsOpen}
        onOpenChange={(open) => {
          console.log('[ModernFunnelControlBarUnifiedV2] 🏷️ Modal de tags mudou:', open);
          console.log('Modal state before:', controlBar.state.isManageTagsOpen);
          if (!open) {
            controlBar.closeManageTags();
          }
        }}
        tags={tags}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />

      {/* Modal de Criação de Funil */}
      <CreateFunnelModal
        isOpen={controlBar.state.isCreateFunnelOpen}
        onClose={controlBar.closeCreateFunnel}
        onCreateFunnel={controlBar.handleCreateFunnel}
      />

      {/* Modal de Configuração do Funil */}
      <FunnelConfigModal
        isOpen={controlBar.state.isConfigureFunnelOpen}
        onClose={() => {
          console.log('[ModernFunnelControlBarUnifiedV2] ⚙️ Fechando modal de configuração');
          console.log('Selected funnel ID:', selectedFunnel?.id);
          controlBar.closeConfigureFunnel();
        }}
        selectedFunnelId={selectedFunnel?.id}
      />

      {/* Modal de Criação de Lead */}
      <RealClientDetails
        client={null}
        isOpen={controlBar.state.isCreateLeadOpen}
        isCreateMode={true}
        onOpenChange={(open) => !open && controlBar.closeCreateLead()}
        onCreateClient={controlBar.handleCreateLead}
      />
    </>
  );
}