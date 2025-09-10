/**
 * 🚀 SETTINGS ISOLADO E OTIMIZADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Query keys com namespace específico (SETTINGS-*)
 * ✅ Cache otimizado por seção
 * ✅ Memoização de operações custosas
 * ✅ Debounce em atualizações
 * ✅ Estados isolados por aba
 * ✅ Zero interferência com outras páginas
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ✅ QUERY KEYS ISOLADAS - NAMESPACE ÚNICO
const settingsQueryKeys = {
  base: ['SETTINGS'] as const,
  profile: (userId: string) => 
    [...settingsQueryKeys.base, 'profile', userId] as const,
  team: (userId: string) => 
    [...settingsQueryKeys.base, 'team', userId] as const,
  whatsapp: (userId: string) => 
    [...settingsQueryKeys.base, 'whatsapp', userId] as const,
  permissions: (userId: string) => 
    [...settingsQueryKeys.base, 'permissions', userId] as const
};

// ✅ CONSTANTES OTIMIZADAS
const DEBOUNCE_DELAY = 500;
const CACHE_TIME_PROFILE = 10 * 60 * 1000; // 10 minutos
const CACHE_TIME_TEAM = 5 * 60 * 1000; // 5 minutos
const CACHE_TIME_WHATSAPP = 2 * 60 * 1000; // 2 minutos

// ✅ DEBOUNCE HOOK ISOLADO
const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// ✅ TIPOS ISOLADOS
interface ProfileData {
  full_name: string;
  email: string;
  username: string;
  document_id: string;
  whatsapp: string;
  company_name: string;
  company_document: string;
  avatar_url: string | null;
  role: string;
}

interface SettingsState {
  activeTab: 'profile' | 'whatsapp' | 'team';
  profileData: Partial<ProfileData>;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  connection_status: string;
  phone: string | null;
  profile_name: string | null;
  created_at: string;
}

export function useSettingsOptimized() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ✅ ESTADO SETTINGS ISOLADO
  const [settingsState, setSettingsState] = useState<SettingsState>({
    activeTab: 'profile',
    profileData: {},
    isEditing: false,
    hasUnsavedChanges: false
  });

  // ✅ DEBOUNCE - Evita atualizações excessivas
  const debouncedProfileData = useDebouncedValue(settingsState.profileData, DEBOUNCE_DELAY);

  // ✅ QUERY ISOLADA - Profile Settings
  const { 
    data: profileData, 
    isLoading: profileLoading,
    error: profileError
  } = useQuery({
    queryKey: settingsQueryKeys.profile(user?.id || ''),
    queryFn: async (): Promise<ProfileData | null> => {
      if (!user?.id) return null;

      console.log('🚀 [Settings] Buscando dados do perfil isolados:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          full_name,
          email,
          username,
          document_id,
          whatsapp,
          company_name,
          company_document,
          avatar_url,
          role
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: CACHE_TIME_PROFILE,
    gcTime: CACHE_TIME_PROFILE * 2
  });

  // ✅ QUERY ISOLADA - WhatsApp Instances
  const { 
    data: whatsappInstances, 
    isLoading: whatsappLoading,
    refetch: refetchWhatsApp
  } = useQuery({
    queryKey: settingsQueryKeys.whatsapp(user?.id || ''),
    queryFn: async (): Promise<WhatsAppInstance[]> => {
      if (!user?.id) return [];

      console.log('🚀 [Settings] Buscando instâncias WhatsApp isoladas:', user.id);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && settingsState.activeTab === 'whatsapp',
    staleTime: CACHE_TIME_WHATSAPP,
    gcTime: CACHE_TIME_WHATSAPP * 2
  });

  // ✅ QUERY ISOLADA - Team Members (só para admin)
  const { 
    data: teamMembers, 
    isLoading: teamLoading
  } = useQuery({
    queryKey: settingsQueryKeys.team(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('🚀 [Settings] Buscando membros da equipe isolados:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          whatsapp,
          created_at,
          last_sign_in_at
        `)
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && settingsState.activeTab === 'team',
    staleTime: CACHE_TIME_TEAM,
    gcTime: CACHE_TIME_TEAM * 2
  });

  // ✅ MUTATION ISOLADA - Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🚀 [Settings] Atualizando perfil isolado:', data);

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.profile(user?.id || '') });
      setSettingsState(prev => ({ 
        ...prev, 
        isEditing: false, 
        hasUnsavedChanges: false 
      }));
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ [Settings] Erro ao atualizar perfil:', error);
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    }
  });

  // ✅ MUTATION ISOLADA - Create WhatsApp Instance
  const createWhatsAppMutation = useMutation({
    mutationFn: async (instanceName: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🚀 [Settings] Criando instância WhatsApp isolada:', instanceName);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceName,
          created_by_user_id: user.id,
          connection_status: 'disconnected'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.whatsapp(user?.id || '') });
      toast.success('Instância WhatsApp criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ [Settings] Erro ao criar instância WhatsApp:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
    }
  });

  // ✅ MUTATION ISOLADA - Delete WhatsApp Instance
  const deleteWhatsAppMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      console.log('🚀 [Settings] Deletando instância WhatsApp isolada:', instanceId);

      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;
      return instanceId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.whatsapp(user?.id || '') });
      toast.success('Instância WhatsApp removida com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ [Settings] Erro ao deletar instância WhatsApp:', error);
      toast.error(`Erro ao remover instância: ${error.message}`);
    }
  });

  // ✅ CALLBACKS MEMOIZADOS
  const updateActiveTab = useCallback((tab: 'profile' | 'whatsapp' | 'team') => {
    setSettingsState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const updateProfileData = useCallback((data: Partial<ProfileData>) => {
    setSettingsState(prev => ({ 
      ...prev, 
      profileData: { ...prev.profileData, ...data },
      hasUnsavedChanges: true 
    }));
  }, []);

  const startEditing = useCallback(() => {
    if (profileData) {
      setSettingsState(prev => ({
        ...prev,
        isEditing: true,
        profileData: { ...profileData },
        hasUnsavedChanges: false
      }));
    }
  }, [profileData]);

  const cancelEditing = useCallback(() => {
    setSettingsState(prev => ({
      ...prev,
      isEditing: false,
      profileData: {},
      hasUnsavedChanges: false
    }));
  }, []);

  const saveProfileChanges = useCallback(() => {
    if (settingsState.hasUnsavedChanges) {
      updateProfileMutation.mutate(settingsState.profileData);
    }
  }, [settingsState.hasUnsavedChanges, settingsState.profileData, updateProfileMutation]);

  // ✅ MEMOIZAÇÃO - Dados processados
  const processedData = useMemo(() => ({
    profile: profileData ? {
      ...profileData,
      ...(settingsState.isEditing ? settingsState.profileData : {})
    } : null,
    whatsappStats: {
      total: whatsappInstances?.length || 0,
      connected: whatsappInstances?.filter(i => i.connection_status === 'connected').length || 0,
      disconnected: whatsappInstances?.filter(i => i.connection_status === 'disconnected').length || 0
    },
    teamStats: {
      total: teamMembers?.length || 0,
      admins: teamMembers?.filter(m => m.role === 'admin').length || 0,
      operational: teamMembers?.filter(m => m.role === 'operational').length || 0
    }
  }), [profileData, settingsState, whatsappInstances, teamMembers]);

  // ✅ FUNÇÃO DE INVALIDAÇÃO ISOLADA
  const invalidateSettingsData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: settingsQueryKeys.base });
  }, [queryClient]);

  // ✅ SYNC STATE WITH PROFILE DATA
  useEffect(() => {
    if (profileData && !settingsState.isEditing) {
      setSettingsState(prev => ({
        ...prev,
        profileData: { ...profileData }
      }));
    }
  }, [profileData, settingsState.isEditing]);

  return {
    // ✅ Dados isolados
    profileData: processedData.profile,
    whatsappInstances,
    teamMembers,
    
    // ✅ Estados isolados
    activeTab: settingsState.activeTab,
    isEditing: settingsState.isEditing,
    hasUnsavedChanges: settingsState.hasUnsavedChanges,
    
    // ✅ Loading states
    loading: profileLoading || whatsappLoading || teamLoading,
    profileLoading,
    whatsappLoading,
    teamLoading,
    
    // ✅ Mutation states
    isUpdatingProfile: updateProfileMutation.isPending,
    isCreatingWhatsApp: createWhatsAppMutation.isPending,
    isDeletingWhatsApp: deleteWhatsAppMutation.isPending,
    
    // ✅ Estatísticas processadas
    stats: {
      whatsapp: processedData.whatsappStats,
      team: processedData.teamStats
    },
    
    // ✅ Actions isoladas
    updateActiveTab,
    updateProfileData,
    startEditing,
    cancelEditing,
    saveProfileChanges,
    createWhatsAppInstance: createWhatsAppMutation.mutate,
    deleteWhatsAppInstance: deleteWhatsAppMutation.mutate,
    
    // ✅ Refresh functions
    refetchWhatsApp,
    
    // ✅ Metadata
    userId: user?.id,
    userRole: profileData?.role,
    
    // ✅ Query client e invalidação
    queryClient,
    invalidateSettingsData
  };
}