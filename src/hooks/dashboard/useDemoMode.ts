
import { useState, useEffect } from "react";
import { DashboardKPIsWithTrends } from "./types/dashboardTypes";

const demoKPIs: DashboardKPIsWithTrends = {
  novos_leads: 47,
  total_leads: 342,
  taxa_conversao: 23.7,
  taxa_perda: 12.3,
  valor_pipeline: 284750.50,
  ticket_medio: 8520.75,
  tempo_resposta: 18.5,
  trends: {
    novos_leads: { value: 15.2, isPositive: true },
    total_leads: { value: 8.7, isPositive: true },
    taxa_conversao: { value: 3.1, isPositive: true },
    taxa_perda: { value: 2.4, isPositive: false },
    valor_pipeline: { value: 22.8, isPositive: true },
    ticket_medio: { value: 11.3, isPositive: true },
    tempo_resposta: { value: 8.9, isPositive: false }
  }
};

export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Verificar se o modo demo está ativo no localStorage
  useEffect(() => {
    const storedDemoMode = localStorage.getItem('dashboard-demo-mode');
    if (storedDemoMode === 'true') {
      setIsDemoMode(true);
    }
  }, []);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('dashboard-demo-mode', 'true');
    console.log("Modo Demo ativado - usando dados de demonstração");
  };

  const disableDemoMode = () => {
    setIsDemoMode(false);
    localStorage.setItem('dashboard-demo-mode', 'false');
    console.log("Modo Demo desativado - voltando aos dados reais");
  };

  const toggleDemoMode = () => {
    if (isDemoMode) {
      disableDemoMode();
    } else {
      enableDemoMode();
    }
  };

  const getDemoKPIs = () => {
    return demoKPIs;
  };

  return {
    isDemoMode,
    enableDemoMode,
    disableDemoMode,
    toggleDemoMode,
    getDemoKPIs
  };
};
