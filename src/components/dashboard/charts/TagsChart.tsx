
import ChartCard from "@/components/dashboard/ChartCard";
import { useDashboardConfig } from "@/hooks/dashboard/useDashboardConfig";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

export default function TagsChart() {
  const { config } = useDashboardConfig();
  const { user } = useAuth();
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) { setData([]); return; }
      // Buscar estágios ativos (não ganho/perdido)
      const { data: stages } = await supabase
        .from('kanban_stages')
        .select('id, color')
        .eq('is_won', false)
        .eq('is_lost', false);
      const activeStageIds = (stages || []).map(s => s.id);

      if (activeStageIds.length === 0) { setData([]); return; }

      // Buscar tags apenas para leads do usuário, em funis e estágios ativos
      const { data: tagRows } = await supabase
        .from('lead_tags')
        .select(`
          lead_id,
          tags:tags(id, name, color, created_by_user_id),
          leads:lead_id(kanban_stage_id, funnel_id, created_by_user_id)
        `)
        .eq('leads.created_by_user_id', user.id)
        .not('leads.funnel_id', 'is', null)
        .in('leads.kanban_stage_id', activeStageIds);

      const count: Record<string, { name: string; value: number; color: string }> = {};
      (tagRows || []).forEach((r: any) => {
        const t = r.tags;
        if (!t) return;
        if (!count[t.id]) count[t.id] = { name: t.name, value: 0, color: t.color || '#d3d800' };
        count[t.id].value += 1;
      });

      setData(Object.values(count));
    };
    load();
  }, [config.period_filter, user?.id]);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard 
      title="Leads por Etiquetas" 
      description="Distribuição de leads por etiquetas no funil"
    >
      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#d3d800'} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.9)", 
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                border: "none"
              }} 
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
