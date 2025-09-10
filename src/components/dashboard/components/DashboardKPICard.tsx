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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // ✅ CORES BASEADAS NO ÍNDICE
  const getCardColor = (idx: number): string => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600'
    ];
    return colors[idx % colors.length];
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105",
      "bg-gradient-to-br", getCardColor(index)
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/90 capitalize">
          {title.replace(/_/g, ' ')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">
          {prefix}{formatValue(value)}{suffix}
        </div>
        
        {trend && (
          <div className={cn(
            "text-xs font-medium flex items-center",
            trend.isPositive ? "text-green-200" : "text-red-200"
          )}>
            <span className="mr-1">
              {trend.isPositive ? '↗' : '↘'}
            </span>
            {Math.abs(trend.value).toFixed(1)}% vs período anterior
          </div>
        )}
        
        {/* ✅ EFEITO VISUAL */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full translate-y-6 -translate-x-6" />
      </CardContent>
    </Card>
  );
});

DashboardKPICard.displayName = 'DashboardKPICard';

export default DashboardKPICard;