
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for authentication-related actions
 */
export const useAuthActions = () => {
  /**
   * Sends a password reset email to the user
   * @param email User's email address
   */
  const handleChangePassword = async (email: string) => {
    try {
      if (!email || !email.trim()) {
        toast.error("Email não informado");
        return;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Email para redefinição de senha enviado!");
    } catch (error: any) {
      console.error("Erro ao solicitar redefinição de senha:", error);
      toast.error(error.message || "Não foi possível solicitar redefinição de senha");
    }
  };
  
  return {
    handleChangePassword
  };
};
