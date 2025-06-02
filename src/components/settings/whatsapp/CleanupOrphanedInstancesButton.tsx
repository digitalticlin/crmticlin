
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanyData } from "@/hooks/useCompanyData";

interface CleanupOrphanedInstancesButtonProps {
  onCleanupComplete: () => void;
}

export function CleanupOrphanedInstancesButton({ onCleanupComplete }: CleanupOrphanedInstancesButtonProps) {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { companyId } = useCompanyData();

  const handleCleanup = async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setIsCleaningUp(true);
    
    try {
      // Find orphaned instances (no vps_instance_id or empty string)
      const { data: orphanedInstances, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, vps_instance_id')
        .eq('company_id', companyId)
        .or('vps_instance_id.is.null,vps_instance_id.eq.');

      if (fetchError) {
        throw new Error(`Erro ao buscar instâncias órfãs: ${fetchError.message}`);
      }

      if (!orphanedInstances || orphanedInstances.length === 0) {
        toast.info('Nenhuma instância órfã encontrada');
        return;
      }

      console.log(`Found ${orphanedInstances.length} orphaned instances`);

      // Delete orphaned instances
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('company_id', companyId)
        .or('vps_instance_id.is.null,vps_instance_id.eq.');

      if (deleteError) {
        throw new Error(`Erro ao limpar instâncias órfãs: ${deleteError.message}`);
      }

      toast.success(`${orphanedInstances.length} instância(s) órfã(s) removida(s) com sucesso`);
      onCleanupComplete();

    } catch (error: any) {
      console.error('Error cleaning up orphaned instances:', error);
      toast.error(`Erro na limpeza: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCleanup}
      disabled={isCleaningUp}
      className="text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      {isCleaningUp ? (
        <>
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
          Limpando...
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Limpar Órfãs
        </>
      )}
    </Button>
  );
}
