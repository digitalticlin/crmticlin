
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import KPICard from "@/components/dashboard/KPICard";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import SystemStatusPanel from "@/components/admin/SystemStatusPanel";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageSquare, 
  Zap, 
  TrendingUp, 
  Bell,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

// Sample data for charts
const areaData = [
  { name: "Jan", leads: 400, converted: 240 },
  { name: "Fev", leads: 300, converted: 139 },
  { name: "Mar", leads: 200, converted: 980 },
  { name: "Abr", leads: 278, converted: 390 },
  { name: "Mai", leads: 189, converted: 480 },
  { name: "Jun", leads: 239, converted: 380 },
  { name: "Jul", leads: 349, converted: 430 },
];

const barData = [
  { name: "Seg", whatsapp: 20, calls: 10, email: 5 },
  { name: "Ter", whatsapp: 30, calls: 15, email: 7 },
  { name: "Qua", whatsapp: 35, calls: 12, email: 10 },
  { name: "Qui", whatsapp: 40, calls: 18, email: 8 },
  { name: "Sex", whatsapp: 28, calls: 14, email: 9 }
];

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">{greeting}, Admin</h1>
              <p className="text-muted-foreground">Bem-vindo de volta ao seu dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="glass"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="icon" className="relative glass">
                <Bell className="h-4 w-4" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-ticlin rounded-full" />
              </Button>
              
              <div className="h-10 w-10 rounded-full bg-ticlin grid place-items-center text-black font-medium">
                A
              </div>
            </div>
          </div>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Leads Novos"
              value="185"
              trend={{ value: 12, isPositive: true }}
              icon={<Users className="h-5 w-5" />}
            />
            <KPICard
              title="Atendimentos"
              value="1,234"
              trend={{ value: 8, isPositive: true }}
              icon={<MessageSquare className="h-5 w-5" />}
            />
            <KPICard
              title="Taxa de Conversão"
              value="12.5%"
              trend={{ value: 3.2, isPositive: true }}
              icon={<Zap className="h-5 w-5" />}
            />
            <KPICard
              title="Vendas"
              value="R$ 45.678"
              trend={{ value: 2.5, isPositive: false }}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>
          
          {/* System Status Panel */}
          <div className="mb-6">
            <SystemStatusPanel />
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard 
              title="Funil de Vendas" 
              description="Desempenho do funil de vendas no período selecionado"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={areaData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stackId="1"
                      stroke="var(--ticlin)" 
                      fill="var(--ticlin)" 
                      fillOpacity={0.6} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="converted" 
                      stackId="1"
                      stroke="#4caf50" 
                      fill="#4caf50" 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            <ChartCard 
              title="Canais de Comunicação" 
              description="Distribuição de atendimentos por canal"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="whatsapp" fill="var(--ticlin)" name="WhatsApp" />
                    <Bar dataKey="calls" fill="#4caf50" name="Ligações" />
                    <Bar dataKey="email" fill="#2196f3" name="Email" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      </main>
    </div>
  );
}
