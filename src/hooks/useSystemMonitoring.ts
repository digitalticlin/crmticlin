
import { useState, useEffect } from 'react';
import { useWhatsAppInstanceState } from './whatsapp/whatsappInstanceStore';
import { supabase } from "@/integrations/supabase/client";
import { recordMetric, info, error } from '@/services/monitoring';

export interface SystemStatus {
  whatsappInstances: {
    total: number;
    connected: number;
    disconnected: number;
    connecting: number;
  };
  database: {
    status: 'online' | 'degraded' | 'offline';
    lastChecked: Date;
  };
  api: {
    status: 'online' | 'degraded' | 'offline';
    latency: number; // ms
    lastChecked: Date;
  };
  errors: {
    count: number;
    lastError?: {
      message: string;
      timestamp: Date;
    };
  };
}

/**
 * Hook para monitoramento geral do sistema em produção
 */
export const useSystemMonitoring = () => {
  const { instances } = useWhatsAppInstanceState();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    whatsappInstances: {
      total: 0,
      connected: 0,
      disconnected: 0,
      connecting: 0,
    },
    database: {
      status: 'online',
      lastChecked: new Date(),
    },
    api: {
      status: 'online',
      latency: 0,
      lastChecked: new Date(),
    },
    errors: {
      count: 0,
    },
  });

  // Monitor WhatsApp instances
  useEffect(() => {
    const connected = instances.filter(i => i.connected).length;
    const total = instances.length;
    const disconnected = total - connected;
    
    setSystemStatus(prev => ({
      ...prev,
      whatsappInstances: {
        total,
        connected,
        disconnected,
        connecting: 0, // This would need to be tracked separately
      }
    }));

    recordMetric('whatsapp_connected_instances', connected, 'count');
    recordMetric('whatsapp_total_instances', total, 'count');
    
    info('WhatsApp instances status updated', { total, connected, disconnected });
  }, [instances]);

  // Check database connectivity
  useEffect(() => {
    const checkDatabase = async () => {
      const start = performance.now();
      try {
        // Simple query to check database connection
        const { error: dbError } = await supabase.from('companies').select('id').limit(1);
        
        const latency = performance.now() - start;
        recordMetric('database_latency', Math.round(latency), 'ms');
        
        setSystemStatus(prev => ({
          ...prev,
          database: {
            status: dbError ? 'degraded' : 'online',
            lastChecked: new Date(),
          }
        }));
        
        if (dbError) {
          error('Database check failed', new Error(dbError.message));
        } else {
          info('Database check successful', { latency: Math.round(latency) });
        }
      } catch (e) {
        const latency = performance.now() - start;
        setSystemStatus(prev => ({
          ...prev,
          database: {
            status: 'offline',
            lastChecked: new Date(),
          },
          errors: {
            count: prev.errors.count + 1,
            lastError: {
              message: e instanceof Error ? e.message : 'Unknown database error',
              timestamp: new Date(),
            }
          }
        }));
        
        error('Database connection failed', e instanceof Error ? e : new Error('Unknown error'));
      }
    };

    // Check database every 5 minutes
    checkDatabase();
    const interval = setInterval(checkDatabase, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Check API connectivity
  useEffect(() => {
    const checkApi = async () => {
      const start = performance.now();
      try {
        // We could use a simple health check endpoint
        const response = await fetch('https://api.evolution.com/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const latency = performance.now() - start;
        recordMetric('api_latency', Math.round(latency), 'ms');
        
        setSystemStatus(prev => ({
          ...prev,
          api: {
            status: response.ok ? 'online' : 'degraded',
            latency: Math.round(latency),
            lastChecked: new Date(),
          }
        }));
        
        info('API health check', { status: response.status, latency: Math.round(latency) });
      } catch (e) {
        const latency = performance.now() - start;
        setSystemStatus(prev => ({
          ...prev,
          api: {
            status: 'offline',
            latency: Math.round(latency),
            lastChecked: new Date(),
          },
          errors: {
            count: prev.errors.count + 1,
            lastError: {
              message: e instanceof Error ? e.message : 'Unknown API error',
              timestamp: new Date(),
            }
          }
        }));
        
        error('API health check failed', e instanceof Error ? e : new Error('Unknown error'));
      }
    };

    // Check API every minute
    checkApi();
    const interval = setInterval(checkApi, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    systemStatus,
    refreshStatus: async () => {
      // This would trigger an immediate refresh of all status checks
      info('Manual system status refresh requested');
      // Implementation would call all checks immediately
    }
  };
};
