
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import KPICard from "@/components/dashboard/KPICard";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
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
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { useSwitchCompany } from "@/hooks/useSwitchCompany";
import TopbarUserMenu from "@/components/layout/TopbarUserMenu";
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

  // Dados do usuário para o menu/avatar
  const { user } = useAuth();
  const { fullName, avatarUrl } = useProfileData();
  const { companyId } = useCompanyData();
  const { companies } = useUserCompanies(user?.id);
  const { switchCompany } = useSwitchCompany(user?.id);
  const email = user?.email || "";

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-auto">
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header (Greeting + Ícones à direita) */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold">{greeting}, Admin</h1>
                <p className="text-muted-foreground">Bem-vindo de volta ao seu dashboard</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Botão de tema */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Trocar tema"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>

                {/* Botão de notificações */}
                <Button variant="ghost" size="icon" aria-label="Notificações">
                  <Bell className="w-5 h-5" />
                </Button>

                {/* Avatar/Menu do usuário */}
                <TopbarUserMenu
                  fullName={fullName}
                  email={email}
                  avatarUrl={avatarUrl}
                  companyId={companyId}
                  companies={companies}
                  onSwitchCompany={switchCompany}
                />
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
                variant="primary"
              />
              <KPICard
                title="Leads Ganhos"
                value="72"
                trend={{ value: 5, isPositive: true }}
                icon={<Zap className="h-5 w-5" />}
                variant="highlight"
              />
              <KPICard
                title="Taxa de Conversão"
                value="38.9%"
                trend={{ value: 2, isPositive: false }}
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <ChartCard 
                title="Visão Geral de Leads" 
                description="Leads recebidos vs. convertidos nos últimos 6 meses"
                className="lg:col-span-2"
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={areaData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d3d800" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#d3d800" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.8)", 
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          border: "none"
                        }} 
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        name="Leads Recebidos"
                        stroke="#d3d800"
                        fillOpacity={1}
                        fill="url(#colorLeads)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="converted"
                        name="Leads Convertidos"
                        stroke="#0088FE"
                        fillOpacity={1}
                        fill="url(#colorConverted)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard 
                title="Atendimentos por Canal" 
                description="Últimos 5 dias"
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.8)", 
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          border: "none"
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="whatsapp" name="WhatsApp" fill="#25D366" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="calls" name="Ligações" fill="#0088FE" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="email" name="E-mail" fill="#d3d800" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard 
                title="Total de Contas"
                value="12"
                description="Contas conectadas ao WhatsApp"
                icon={<MessageSquare className="h-5 w-5" />}
              />
              <StatCard 
                title="Membros da Equipe"
                value="8"
                description="Ativos na plataforma"
                icon={<Users className="h-5 w-5" />}
                color="bg-blue-500"
              />
              <StatCard 
                title="Agentes de IA"
                value="3"
                description="Configurados e ativos"
                icon={<Zap className="h-5 w-5" />}
                color="bg-purple-500"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

