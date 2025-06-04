
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DiagnosticResult } from "./DiagnosticTypes";

export const useDiagnosticTests = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    console.log('[VPS Token Diagnostic] 🔍 Iniciando diagnóstico completo...');
    
    try {
      // Test 1: VPS Connectivity
      const connectivityResult = await testVPSConnectivity();
      setResults(prev => [...prev, connectivityResult]);
      
      // Test 2: Token Authentication
      const tokenResult = await testTokenAuthentication();
      setResults(prev => [...prev, tokenResult]);
      
      // Test 3: VPS Server Info
      const serverInfoResult = await testVPSServerInfo();
      setResults(prev => [...prev, serverInfoResult]);
      
      // Test 4: Instance Creation Test
      const instanceTestResult = await testInstanceCreation();
      setResults(prev => [...prev, instanceTestResult]);
      
      console.log('[VPS Token Diagnostic] ✅ Diagnóstico concluído');
      
    } catch (error: any) {
      console.error('[VPS Token Diagnostic] ❌ Erro no diagnóstico:', error);
      setResults(prev => [...prev, {
        test: 'Diagnóstico Geral',
        status: 'error',
        message: `Erro inesperado: ${error.message}`,
        details: error
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const testVPSConnectivity = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🌐 Testando conectividade VPS...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_connectivity' }
      });

      if (error) throw error;

      return {
        test: 'Conectividade VPS',
        status: data.success ? 'success' : 'error',
        message: data.success ? 'VPS acessível' : data.error || 'VPS inacessível',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Conectividade VPS',
        status: 'error',
        message: `Erro de conectividade: ${error.message}`,
        details: error
      };
    }
  };

  const testTokenAuthentication = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🔑 Testando autenticação de token...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_auth' }
      });

      if (error) throw error;

      return {
        test: 'Autenticação Token',
        status: data.success ? 'success' : 'error',
        message: data.success ? 'Token válido' : data.error || 'Token inválido',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Autenticação Token',
        status: 'error',
        message: `Erro de autenticação: ${error.message}`,
        details: error
      };
    }
  };

  const testVPSServerInfo = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🖥️ Obtendo informações do servidor VPS...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'vps_services' }
      });

      if (error) throw error;

      return {
        test: 'Informações Servidor',
        status: data.success ? 'success' : 'warning',
        message: data.success ? 'Servidor funcionando' : 'Problemas no servidor',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Informações Servidor',
        status: 'error',
        message: `Erro ao obter info: ${error.message}`,
        details: error
      };
    }
  };

  const testInstanceCreation = async (): Promise<DiagnosticResult> => {
    try {
      console.log('[Diagnostic] 🚀 Testando fluxo de criação de instância...');
      
      const { data, error } = await supabase.functions.invoke('vps_diagnostic', {
        body: { test: 'full_flow', vpsAction: 'check_server' }
      });

      if (error) throw error;

      return {
        test: 'Fluxo Criação Instância',
        status: data.success ? 'success' : 'error',
        message: data.success ? 'Fluxo funcional' : data.error || 'Fluxo com problemas',
        details: data.details
      };
    } catch (error: any) {
      return {
        test: 'Fluxo Criação Instância',
        status: 'error',
        message: `Erro no fluxo: ${error.message}`,
        details: error
      };
    }
  };

  return {
    isRunning,
    results,
    runDiagnostic
  };
};
