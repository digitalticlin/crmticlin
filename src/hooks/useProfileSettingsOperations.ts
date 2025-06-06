
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProfileSettingsOperations = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  /**
   * Load user profile data from Supabase with error handling
   */
  const loadUserProfile = async (userId: string) => {
    try {
      setSyncStatus('syncing');
      console.log('[Profile Operations] 🚀 Carregando dados do perfil...');
      
      // Check for infinite recursion error first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error("❌ Erro ao carregar perfil:", profileError);
        
        // Special handling for infinite recursion
        if (profileError.code === '42P17') {
          setSyncStatus('error');
          toast.error("Sistema pausado: erro de configuração RLS detectado");
          throw new Error("Infinite recursion detected in database policy");
        }
        
        setSyncStatus('error');
        toast.error("Erro ao carregar dados do perfil: " + profileError.message);
        throw profileError;
      }
      
      if (profile) {
        console.log('[Profile Operations] ✅ Perfil carregado:', profile.full_name);
        setSyncStatus('success');
        return profile;
      } else {
        console.log('[Profile Operations] ⚠️ Perfil não encontrado, tentando criar...');
        return await createUserProfile(userId);
      }
      
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados:", error);
      setSyncStatus('error');
      
      // Don't show toast for infinite recursion as it's already handled above
      if (error.code !== '42P17') {
        toast.error("Erro ao carregar dados: " + error.message);
      }
      
      throw error;
    }
  };

  /**
   * Create a new user profile if it doesn't exist
   */
  const createUserProfile = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: user?.user_metadata?.full_name || '',
          document_id: '',
          whatsapp: ''
        });
        
      if (createError) {
        console.error("❌ Erro ao criar perfil:", createError);
        setSyncStatus('error');
        
        if (createError.code === '42P17') {
          toast.error("Sistema pausado: erro de configuração RLS detectado");
          throw new Error("Infinite recursion detected in database policy");
        }
        
        toast.error("Erro ao criar perfil: " + createError.message);
        throw createError;
      } else {
        console.log('[Profile Operations] ✅ Perfil criado com sucesso');
        setSyncStatus('success');
        toast.success("Perfil criado com sucesso!");
        return await loadUserProfile(userId);
      }
    } catch (error: any) {
      console.error("❌ Erro ao criar perfil:", error);
      setSyncStatus('error');
      
      if (error.code !== '42P17') {
        toast.error("Erro ao criar perfil: " + error.message);
      }
      
      throw error;
    }
  };

  /**
   * Update user profile data
   */
  const updateUserProfile = async (userId: string, profileData: {
    full_name: string;
    document_id: string;
    whatsapp: string;
  }) => {
    try {
      const updateData = {
        ...profileData,
        updated_at: new Date().toISOString()
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (profileError) {
        if (profileError.code === '42P17') {
          toast.error("Sistema pausado: erro de configuração RLS detectado");
          throw new Error("Infinite recursion detected in database policy");
        }
        
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }
      
      console.log('[Profile Operations] ✅ Perfil atualizado com sucesso');
      return true;
    } catch (error: any) {
      console.error("❌ Erro ao atualizar perfil:", error);
      throw error;
    }
  };

  return {
    syncStatus,
    setSyncStatus,
    loadUserProfile,
    createUserProfile,
    updateUserProfile
  };
};
