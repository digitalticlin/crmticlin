
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseQRCode = (instanceId: string | null) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!instanceId) {
      setQrCode(null);
      return;
    }

    const fetchQRCode = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('whatsapp_instances')
          .select('qr_code, connection_status')
          .eq('id', instanceId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setQrCode(data?.qr_code || null);
      } catch (err: any) {
        console.error('[useSupabaseQRCode] ❌ Erro:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQRCode();

    // Configurar escuta em tempo real para mudanças na instância
    const channel = supabase
      .channel(`qr-code-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `id=eq.${instanceId}`
        },
        (payload) => {
          console.log('[useSupabaseQRCode] 🔄 Atualização em tempo real:', payload);
          const newData = payload.new as any;
          if (newData.qr_code !== qrCode) {
            setQrCode(newData.qr_code || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  return { qrCode, isLoading, error };
};
