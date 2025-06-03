
import { supabase } from "@/integrations/supabase/client";
import { DiagnosticCheck } from "../types/diagnosticTypes";
import type { User } from "@supabase/supabase-js";

export class DiagnosticChecks {
  // Check 1: Connectivity
  static async checkConnectivity(): Promise<DiagnosticCheck> {
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
  }

  // Check 2: Authentication
  static async checkAuthentication(user: User | null, companyId: string | null): Promise<DiagnosticCheck> {
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
  }

  // Check 3: Tables existence
  static async checkTables(companyId: string | null): Promise<DiagnosticCheck> {
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
      // Verificar tabela leads
      const { error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      // Verificar tabela kanban_stages
      const { error: stagesError } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      // Verificar tabela funnels
      const { error: funnelsError } = await supabase
        .from('funnels')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      const errors = [
        { table: 'leads', error: leadsError },
        { table: 'kanban_stages', error: stagesError },
        { table: 'funnels', error: funnelsError }
      ].filter(r => r.error);

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
  }

  // Check 4: Data availability
  static async checkDataAvailability(companyId: string | null): Promise<DiagnosticCheck> {
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
  }

  // Check 5: Performance
  static async checkPerformance(companyId: string | null): Promise<DiagnosticCheck> {
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
  }
}
