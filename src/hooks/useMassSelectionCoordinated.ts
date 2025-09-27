/**
 * 🎯 MASS SELECTION COORDINATED
 *
 * Seleção em massa integrada com coordinator - SEM dependência circular
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { KanbanLead } from "@/types/kanban";
import { SalesFunnelCoordinatorReturn } from "@/components/sales/core/SalesFunnelCoordinator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MassSelectionCoordinatedReturn {
  selectedLeads: Set<string>;
  isSelectionMode: boolean;
  selectedCount: number;
  selectLead: (leadId: string) => void;
  unselectLead: (leadId: string) => void;
  toggleLead: (leadId: string) => void;
  selectAll: (leads: KanbanLead[]) => void;
  selectStage: (stageLeads: KanbanLead[]) => void;
  selectAllFromStage: (stageId: string, funnelId: string) => Promise<void>;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  getSelectedLeadsData: (allLeads: KanbanLead[]) => KanbanLead[];
  getStageSelectionState: (stageLeads: KanbanLead[]) => 'none' | 'some' | 'all';
  isLeadSelected: (leadId: string) => boolean;
  canSelect: () => boolean;
  canDragWithSelection: () => boolean;
}

/**
 * Hook de seleção em massa coordenada - recebe coordinator como parâmetro
 */
export const useMassSelectionCoordinated = (coordinator: SalesFunnelCoordinatorReturn): MassSelectionCoordinatedReturn => {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(() => new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Cache otimizado para performance
  const lastSelectedLeadsSize = useRef(0);
  const cachedSelectedArray = useRef<string[]>([]);
  const stageSelectionCache = useRef(new Map<string, 'none' | 'some' | 'all'>());

  const selectedCount = useMemo(() => selectedLeads.size, [selectedLeads]);

  const canSelect = useCallback(() => {
    return coordinator.canExecute('selection:toggle');
  }, [coordinator]);

  const canDragWithSelection = useCallback(() => {
    // Durante modo de seleção em massa, drag deve estar desabilitado
    // para evitar conflito entre clique para selecionar e drag
    return false;
  }, []);

  const isLeadSelected = useCallback((leadId: string) => {
    return selectedLeads.has(leadId);
  }, [selectedLeads]);

  const selectLead = useCallback((leadId: string) => {
    if (!coordinator.canExecute('selection:toggle')) {
      console.log('[useMassSelectionCoordinated] ❌ NÃO PODE EXECUTAR selection:toggle');
      return;
    }

    console.log('[useMassSelectionCoordinated] ✅ Adicionando lead ao Set:', leadId);
    setSelectedLeads(prev => {
      if (prev.has(leadId)) {
        console.log('[useMassSelectionCoordinated] ⚠️ Lead já estava selecionado, ignorando');
        return prev;
      }
      const newSet = new Set(prev);
      newSet.add(leadId);
      console.log('[useMassSelectionCoordinated] ✅ Novo Set criado, tamanho:', newSet.size);
      stageSelectionCache.current.clear();
      return newSet;
    });

    if (!isSelectionMode) {
      setIsSelectionMode(true);
      coordinator.emit({
        type: 'selection:mode-changed',
        payload: { isSelectionMode: true },
        priority: 'normal',
        source: 'MassSelection'
      });
    }

    // Evento removido para evitar loop de re-renders
    // coordinator.emit({
    //   type: 'selection:lead-selected',
    //   payload: { leadId },
    //   priority: 'normal',
    //   source: 'MassSelection'
    // });
  }, [isSelectionMode, coordinator]);

  const unselectLead = useCallback((leadId: string) => {
    console.log('[useMassSelectionCoordinated] 🗑️ Removendo lead do Set:', leadId);
    setSelectedLeads(prev => {
      if (!prev.has(leadId)) {
        console.log('[useMassSelectionCoordinated] ⚠️ Lead não estava selecionado, ignorando');
        return prev;
      }
      const newSet = new Set(prev);
      newSet.delete(leadId);
      console.log('[useMassSelectionCoordinated] ✅ Lead removido, novo tamanho:', newSet.size);
      stageSelectionCache.current.clear();

      if (newSet.size === 0) {
        console.log('[useMassSelectionCoordinated] 🚫 Set vazio, saindo do modo seleção');
        setIsSelectionMode(false);
      }
      return newSet;
    });
  }, []);

  const toggleLead = useCallback((leadId: string) => {
    console.log('[useMassSelectionCoordinated] 🔄 toggleLead chamado:', {
      leadId,
      isCurrentlySelected: selectedLeads.has(leadId),
      selectedLeadsSize: selectedLeads.size
    });

    if (selectedLeads.has(leadId)) {
      console.log('[useMassSelectionCoordinated] ➖ Desmarcando lead:', leadId);
      unselectLead(leadId);
    } else {
      console.log('[useMassSelectionCoordinated] ➕ Marcando lead:', leadId);
      selectLead(leadId);
    }
  }, [selectedLeads, selectLead, unselectLead]);

  const selectAll = useCallback((leads: KanbanLead[]) => {
    const leadIds = new Set(leads.map(lead => lead.id));
    setSelectedLeads(leadIds);
    setIsSelectionMode(true);
    stageSelectionCache.current.clear();
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLeads(new Set());
    setIsSelectionMode(false);
    stageSelectionCache.current.clear();
    cachedSelectedArray.current = [];
    lastSelectedLeadsSize.current = 0;

    coordinator.emit({
      type: 'selection:cleared',
      payload: {},
      priority: 'normal',
      source: 'MassSelection'
    });
  }, [coordinator]);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const selectStage = useCallback((stageLeads: KanbanLead[]) => {
    if (stageLeads.length === 0) return;

    const stageLeadIds = stageLeads.map(lead => lead.id);
    const allSelected = stageLeadIds.every(id => selectedLeads.has(id));

    setSelectedLeads(prev => {
      const newSet = new Set(prev);

      if (allSelected) {
        stageLeadIds.forEach(id => newSet.delete(id));
        if (newSet.size === 0) {
          setIsSelectionMode(false);
        }
      } else {
        stageLeadIds.forEach(id => newSet.add(id));
        setIsSelectionMode(true);
      }

      stageSelectionCache.current.clear();
      return newSet;
    });
  }, [selectedLeads]);

  const selectAllFromStage = useCallback(async (stageId: string, funnelId: string) => {
    try {
      const { data: allStageLeads, error } = await supabase
        .from('leads')
        .select('id')
        .eq('kanban_stage_id', stageId)
        .eq('funnel_id', funnelId);

      if (error) throw error;

      if (!allStageLeads || allStageLeads.length === 0) {
        toast.info('Nenhum lead encontrado nesta etapa');
        return;
      }

      const leadIds = allStageLeads.map(lead => lead.id);

      // Verificar se todos já estão selecionados
      const allSelected = leadIds.every(id => selectedLeads.has(id));

      setSelectedLeads(prev => {
        const newSet = new Set(prev);

        if (allSelected) {
          // Se todos estão selecionados, DESMARCAR todos
          leadIds.forEach(id => newSet.delete(id));

          if (newSet.size === 0) {
            setIsSelectionMode(false);
          }

          toast.success(`${leadIds.length} leads desmarcados da etapa`);
        } else {
          // Se nem todos estão selecionados, SELECIONAR todos
          leadIds.forEach(id => newSet.add(id));
          setIsSelectionMode(true);
          toast.success(`${leadIds.length} leads selecionados da etapa`);
        }

        return newSet;
      });

      stageSelectionCache.current.clear();

      coordinator.emit({
        type: allSelected ? 'selection:stage-unselected' : 'selection:stage-selected',
        payload: { stageId, count: leadIds.length },
        priority: 'normal',
        source: 'MassSelection'
      });
    } catch (error) {
      console.error('[useMassSelectionCoordinated] Erro ao selecionar todos da etapa:', error);
      toast.error('Erro ao processar leads da etapa');
    }
  }, [coordinator, selectedLeads]);

  const getStageSelectionState = useCallback((stageLeads: KanbanLead[]) => {
    if (stageLeads.length === 0) return 'none';

    const stageHash = stageLeads.map(l => l.id).sort().join(',');
    const cached = stageSelectionCache.current.get(stageHash);
    if (cached) return cached;

    let selectedCount = 0;
    for (const lead of stageLeads) {
      if (selectedLeads.has(lead.id)) {
        selectedCount++;
      }
    }

    const result = selectedCount === 0 ? 'none' :
                   selectedCount === stageLeads.length ? 'all' : 'some';

    stageSelectionCache.current.set(stageHash, result);
    return result;
  }, [selectedLeads]);

  const getSelectedLeadsData = useCallback((allLeads: KanbanLead[]) => {
    if (selectedLeads.size === lastSelectedLeadsSize.current && cachedSelectedArray.current.length > 0) {
      return allLeads.filter(lead => selectedLeads.has(lead.id));
    }

    const result = allLeads.filter(lead => selectedLeads.has(lead.id));
    lastSelectedLeadsSize.current = selectedLeads.size;
    cachedSelectedArray.current = result.map(lead => lead.id);

    return result;
  }, [selectedLeads]);

  return useMemo(() => ({
    selectedLeads,
    isSelectionMode,
    selectedCount,
    selectLead,
    unselectLead,
    toggleLead,
    selectAll,
    selectStage,
    selectAllFromStage,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    getSelectedLeadsData,
    getStageSelectionState,
    isLeadSelected,
    canSelect,
    canDragWithSelection
  }), [
    selectedLeads,
    isSelectionMode,
    selectedCount,
    selectLead,
    unselectLead,
    toggleLead,
    selectAll,
    selectStage,
    selectAllFromStage,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    getSelectedLeadsData,
    getStageSelectionState,
    isLeadSelected,
    canSelect,
    canDragWithSelection
  ]);
};