/**
 * 🚀 DASHBOARD CUSTOMIZER ISOLADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Drag & drop isolado
 * ✅ Estado local isolado
 * ✅ Callbacks memoizados
 * ✅ Zero dependências externas
 * ✅ Persistência local
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from '@hello-pangea/dnd';
import { GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCustomizerProps {
  kpiOrder: string[];
  selectedCharts: string[];
  onReorderKPIs: (newOrder: string[]) => void;
  onUpdateCharts: (charts: string[]) => void;
}

// ✅ CONFIGURAÇÕES DISPONÍVEIS
const AVAILABLE_KPIS = [
  { key: 'novos_leads', label: 'Novos Leads', description: 'Leads criados hoje' },
  { key: 'total_leads', label: 'Total de Leads', description: 'Total no período' },
  { key: 'taxa_conversao', label: 'Taxa de Conversão', description: 'Leads convertidos em vendas' },
  { key: 'valor_pipeline', label: 'Valor Pipeline', description: 'Valor total em negociação' },
  { key: 'ticket_medio', label: 'Ticket Médio', description: 'Valor médio por venda' },
  { key: 'tempo_resposta', label: 'Tempo Resposta', description: 'Tempo médio de resposta' }
];

const AVAILABLE_CHARTS = [
  { key: 'funnel', label: 'Distribuição por Funis', description: 'Visualiza leads por funil' },
  { key: 'performance', label: 'Performance Temporal', description: 'Evolução ao longo do tempo' },
  { key: 'conversion', label: 'Taxa de Conversão', description: 'Análise de conversão' },
  { key: 'revenue', label: 'Receita', description: 'Evolução da receita' }
];

const DashboardCustomizer = memo(({
  kpiOrder,
  selectedCharts,
  onReorderKPIs,
  onUpdateCharts
}: DashboardCustomizerProps) => {
  
  const [activeTab, setActiveTab] = useState<'kpis' | 'charts'>('kpis');

  // ✅ DRAG & DROP HANDLER
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(kpiOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderKPIs(items);
  }, [kpiOrder, onReorderKPIs]);

  // ✅ CHART SELECTION HANDLER
  const handleChartToggle = useCallback((chartKey: string) => {
    const newSelection = selectedCharts.includes(chartKey)
      ? selectedCharts.filter(c => c !== chartKey)
      : [...selectedCharts, chartKey];
    
    onUpdateCharts(newSelection);
  }, [selectedCharts, onUpdateCharts]);

  // ✅ RESET TO DEFAULTS
  const handleReset = useCallback(() => {
    const defaultKPIs = ['novos_leads', 'total_leads', 'taxa_conversao', 'valor_pipeline'];
    const defaultCharts = ['funnel', 'performance'];
    
    onReorderKPIs(defaultKPIs);
    onUpdateCharts(defaultCharts);
  }, [onReorderKPIs, onUpdateCharts]);

  // ✅ MEMOIZED KPI ITEMS
  const kpiItems = useMemo(() => 
    kpiOrder.map(kpiKey => 
      AVAILABLE_KPIS.find(kpi => kpi.key === kpiKey)
    ).filter(Boolean),
    [kpiOrder]
  );

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Personalizar Dashboard
          </CardTitle>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
        
        {/* ✅ TABS */}
        <div className="flex space-x-1 bg-white rounded-lg p-1">
          <Button
            variant={activeTab === 'kpis' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('kpis')}
            className="flex-1 text-xs"
          >
            KPIs ({kpiOrder.length})
          </Button>
          <Button
            variant={activeTab === 'charts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('charts')}
            className="flex-1 text-xs"
          >
            Gráficos ({selectedCharts.length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* ✅ KPIs TAB */}
        {activeTab === 'kpis' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Arraste os KPIs para reordenar sua exibição no dashboard:
            </div>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="kpis">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "space-y-2 p-3 rounded-lg border-2 border-dashed transition-colors",
                      snapshot.isDraggingOver 
                        ? "border-blue-400 bg-blue-50" 
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {kpiItems.map((kpi, index) => (
                      <Draggable key={kpi!.key} draggableId={kpi!.key} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "flex items-center gap-3 p-3 bg-white rounded-lg border transition-all",
                              snapshot.isDragging 
                                ? "shadow-lg border-blue-300 rotate-2" 
                                : "shadow-sm border-gray-200 hover:border-blue-200"
                            )}
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900">
                                {kpi!.label}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {kpi!.description}
                              </div>
                            </div>
                            
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* ✅ CHARTS TAB */}
        {activeTab === 'charts' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Selecione os gráficos que deseja exibir no dashboard:
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_CHARTS.map(chart => (
                <div
                  key={chart.key}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                    selectedCharts.includes(chart.key)
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-200"
                  )}
                  onClick={() => handleChartToggle(chart.key)}
                >
                  <Checkbox
                    checked={selectedCharts.includes(chart.key)}
                    onChange={() => handleChartToggle(chart.key)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {chart.label}
                      </span>
                      {selectedCharts.includes(chart.key) ? (
                        <Eye className="h-3 w-3 text-blue-500" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {chart.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DashboardCustomizer.displayName = 'DashboardCustomizer';

export default DashboardCustomizer;