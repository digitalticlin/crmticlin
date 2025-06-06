
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Hook simplificado para dados do perfil
export const useProfileData = () => {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadProfileData = async (userId: string) => {
    if (!userId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || '');
        setAvatarUrl(profile.avatar_url);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProfileData(user.id);
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    fullName,
    avatarUrl,
    loading,
    loadProfileData
  };
};
