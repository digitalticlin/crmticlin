
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useAuth } from "@/contexts/AuthContext";

export interface DiagnosticCheck {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  suggestion?: string;
  duration?: number;
}

export interface DiagnosticReport {
  overall: 'healthy' | 'warning' | 'critical';
  checks: DiagnosticCheck[];
  lastRun: Date;
  summary: string;
}

const defaultReport: DiagnosticReport = {
  overall: 'pending' as any,
  checks: [],
  lastRun: new Date(),
  summary: 'Iniciando diagnóstico...'
};

export const useDiagnosticSystem = () => {
  const [report, setReport] = useState<DiagnosticReport>(defaultReport);
  const [isRunning, setIsRunning] = useState(false);
  const { companyId } = useCompanyData();
  const { user } = useAuth();

  // Check 1: Connectivity
  const checkConnectivity = async (): Promise<DiagnosticCheck> => {
    const startTime = Date.now();
    try {
      const { error } = await Promise.race([
        supabase.from('leads').select('id').limit(1),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any;
      
      const duration = Date.now() - startTime;
      
      if (error) {
        return {
          id: 'connectivity',
          name: 'Conectividade com Supabase',
          status: 'error',
          message: `Erro de conexão: ${error.message}`,
          suggestion: 'Verifique sua conexão com a internet e as configurações do Supabase',
          duration
        };
      }
      
      return {
        id: 'connectivity',
        name: 'Conectividade com Supabase',
        status: 'success',
        message: `Conexão estabelecida (${duration}ms)`,
        duration
      };
    } catch (error) {
      return {
        id: 'connectivity',
        name: 'Conectividade com Supabase',
        status: 'error',
        message: 'Timeout na conexão com o banco',
        suggestion: 'Verifique sua conexão com a internet',
        duration: Date.now() - startTime
      };
    }
  };

  // Check 2: Authentication
  const checkAuthentication = async (): Promise<DiagnosticCheck> => {
    if (!user) {
      return {
        id: 'auth',
        name: 'Autenticação',
        status: 'error',
        message: 'Usuário não autenticado',
        suggestion: 'Faça login novamente'
      };
    }

    if (!companyId) {
      return {
        id: 'auth',
        name: 'Autenticação',
        status: 'warning',
        message: 'Usuário sem empresa associada',
        suggestion: 'Configure a empresa do usuário'
      };
    }

    return {
      id: 'auth',
      name: 'Autenticação',
      status: 'success',
      message: 'Usuário autenticado e com empresa'
    };
  };

  // Check 3: Tables existence
  const checkTables = async (): Promise<DiagnosticCheck> => {
    if (!companyId) {
      return {
        id: 'tables',
        name: 'Estrutura do Banco',
        status: 'warning',
        message: 'Não foi possível verificar (sem empresa)',
        suggestion: 'Configure a empresa primeiro'
      };
    }

    try {
      const tables = ['leads', 'kanban_stages', 'funnels'];
      const results = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase
            .from(table)
            .select('id')
            .eq('company_id', companyId)
            .limit(1);
          return { table, error };
        })
      );

      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        return {
          id: 'tables',
          name: 'Estrutura do Banco',
          status: 'error',
          message: `Erro ao acessar tabelas: ${errors.map(e => e.table).join(', ')}`,
          suggestion: 'Verifique as permissões RLS das tabelas'
        };
      }

      return {
        id: 'tables',
        name: 'Estrutura do Banco',
        status: 'success',
        message: 'Todas as tabelas acessíveis'
      };
    } catch (error) {
      return {
        id: 'tables',
        name: 'Estrutura do Banco',
        status: 'error',
        message: 'Erro ao verificar tabelas',
        suggestion: 'Verifique a configuração do banco de dados'
      };
    }
  };

  // Check 4: Data availability
  const checkDataAvailability = async (): Promise<DiagnosticCheck> => {
    if (!companyId) {
      return {
        id: 'data',
        name: 'Disponibilidade de Dados',
        status: 'warning',
        message: 'Não foi possível verificar (sem empresa)',
        suggestion: 'Configure a empresa primeiro'
      };
    }

    try {
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('company_id', companyId)
        .limit(5);

      const { data: stages, error: stagesError } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('company_id', companyId)
        .limit(5);

      if (leadsError || stagesError) {
        return {
          id: 'data',
          name: 'Disponibilidade de Dados',
          status: 'error',
          message: 'Erro ao verificar dados',
          suggestion: 'Verifique as permissões de acesso aos dados'
        };
      }

      if (!leads || leads.length === 0) {
        return {
          id: 'data',
          name: 'Disponibilidade de Dados',
          status: 'warning',
          message: 'Nenhum lead encontrado',
          suggestion: 'Importe ou crie alguns leads para visualizar métricas'
        };
      }

      if (!stages || stages.length === 0) {
        return {
          id: 'data',
          name: 'Disponibilidade de Dados',
          status: 'warning',
          message: 'Nenhum estágio do funil configurado',
          suggestion: 'Configure os estágios do funil de vendas'
        };
      }

      return {
        id: 'data',
        name: 'Disponibilidade de Dados',
        status: 'success',
        message: `${leads.length} leads e ${stages.length} estágios encontrados`
      };
    } catch (error) {
      return {
        id: 'data',
        name: 'Disponibilidade de Dados',
        status: 'error',
        message: 'Erro ao verificar dados',
        suggestion: 'Verifique a configuração do sistema'
      };
    }
  };

  // Check 5: Performance
  const checkPerformance = async (): Promise<DiagnosticCheck> => {
    const startTime = Date.now();
    
    try {
      if (!companyId) {
        return {
          id: 'performance',
          name: 'Performance do Sistema',
          status: 'warning',
          message: 'Não foi possível medir (sem empresa)',
          suggestion: 'Configure a empresa primeiro'
        };
      }

      await supabase
        .from('leads')
        .select('id, created_at')
        .eq('company_id', companyId)
        .limit(10);

      const duration = Date.now() - startTime;

      if (duration > 3000) {
        return {
          id: 'performance',
          name: 'Performance do Sistema',
          status: 'warning',
          message: `Consulta lenta: ${duration}ms`,
          suggestion: 'Sistema pode estar sobrecarregado',
          duration
        };
      }

      if (duration > 1000) {
        return {
          id: 'performance',
          name: 'Performance do Sistema',
          status: 'warning',
          message: `Performance moderada: ${duration}ms`,
          suggestion: 'Considere otimizar as consultas',
          duration
        };
      }

      return {
        id: 'performance',
        name: 'Performance do Sistema',
        status: 'success',
        message: `Performance boa: ${duration}ms`,
        duration
      };
    } catch (error) {
      return {
        id: 'performance',
        name: 'Performance do Sistema',
        status: 'error',
        message: 'Erro ao medir performance',
        suggestion: 'Verifique a estabilidade do sistema',
        duration: Date.now() - startTime
      };
    }
  };

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    console.log("=== Iniciando Diagnóstico do Sistema ===");

    const checks: DiagnosticCheck[] = [];

    // Executar verificações sequencialmente
    const checkFunctions = [
      checkConnectivity,
      checkAuthentication,
      checkTables,
      checkDataAvailability,
      checkPerformance
    ];

    for (const checkFn of checkFunctions) {
      try {
        const result = await checkFn();
        checks.push(result);
        console.log(`✓ ${result.name}: ${result.status} - ${result.message}`);
      } catch (error) {
        console.error(`Erro na verificação:`, error);
        checks.push({
          id: 'unknown',
          name: 'Verificação Desconhecida',
          status: 'error',
          message: 'Erro inesperado durante verificação'
        });
      }
    }

    // Calcular status geral
    const errorCount = checks.filter(c => c.status === 'error').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    let overall: 'healthy' | 'warning' | 'critical';
    let summary: string;

    if (errorCount > 0) {
      overall = 'critical';
      summary = `${errorCount} erro(s) crítico(s) encontrado(s)`;
    } else if (warningCount > 0) {
      overall = 'warning';
      summary = `${warningCount} aviso(s) encontrado(s)`;
    } else {
      overall = 'healthy';
      summary = 'Sistema funcionando normalmente';
    }

    const newReport: DiagnosticReport = {
      overall,
      checks,
      lastRun: new Date(),
      summary
    };

    setReport(newReport);
    setIsRunning(false);
    console.log("=== Diagnóstico Finalizado ===", newReport);

    return newReport;
  }, [companyId, user]);

  // Executar diagnóstico automaticamente na inicialização
  useEffect(() => {
    if (user && companyId) {
      runDiagnostic();
    }
  }, [user, companyId, runDiagnostic]);

  return {
    report,
    isRunning,
    runDiagnostic
  };
};
