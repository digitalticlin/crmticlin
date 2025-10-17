/**
 * 🚀 KPI CARD ISOLADO - DASHBOARD
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Componente memoizado
 * ✅ Props tipadas 
 * ✅ Animações suaves
 * ✅ Loading state isolado
 * ✅ Zero dependências externas
 */

import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardKPICardProps {
  title: string;
  value: number | string;
  loading: boolean;
  index: number;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardKPICard = memo(({
  title,
  value,
  loading,
  index,
  prefix = '',
  suffix = '',
  trend
}: DashboardKPICardProps) => {
  
  // ✅ FORMATAÇÃO DE VALORES
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    // Formatação específica por tipo de KPI
    if (title.toLowerCase().includes('taxa') || title.toLowerCase().includes('conversao')) {
      return `${val.toFixed(1)}%`;
    }
    
    if (title.toLowerCase().includes('valor') || title.toLowerCase().includes('ticket')) {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    
    if (title.toLowerCase().includes('tempo')) {
      return `${val.toFixed(1)}h`;
    }
    
    return val.toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-6 shadow-lg">
        <div className="pb-2">
          <Skeleton className="h-4 w-24" />
        </div>
        <div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
      <h3 className="text-sm font-medium text-gray-900 capitalize mb-2">
        {title.replace(/_/g, ' ')}
      </h3>

      <div className="text-2xl font-bold text-gray-900 mb-1">
        {prefix}{formatValue(value)}{suffix}
      </div>

      {trend && (
        <div className={cn(
          "text-xs font-medium flex items-center",
          trend.isPositive ? "text-green-600" : "text-red-600"
        )}>
          <span className="mr-1">
            {trend.isPositive ? '↗' : '↘'}
          </span>
          {Math.abs(trend.value).toFixed(1)}% vs período anterior
        </div>
      )}
    </div>
  );
});

DashboardKPICard.displayName = 'DashboardKPICard';

export default DashboardKPICard;