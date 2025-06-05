
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanyData } from "./useCompanyData";
import { cleanPhoneNumber, validatePhone } from "@/utils/phoneFormatter";

export interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  purchase_value?: number;
  created_at: string;
  updated_at: string;
  company_id: string;
}

export interface ClientFormData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  company?: string;
  notes?: string;
  purchase_value?: number;
}

export function useRealClientManagement() {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { companyId } = useCompanyData();
  const queryClient = useQueryClient();

  // Buscar primeira instância WhatsApp da empresa para usar como padrão
  const { data: defaultWhatsAppInstance } = useQuery({
    queryKey: ["default-whatsapp", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("company_id", companyId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar instância WhatsApp:", error);
        return null;
      }

      return data;
    },
    enabled: !!companyId,
  });

  // Buscar clientes do banco de dados
  const clientsQuery = useQuery({
    queryKey: ["clients", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        throw error;
      }

      // Mapear os dados da tabela leads para nossa interface ClientData
      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || "Nome não informado",
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        company: lead.company,
        notes: lead.notes,
        purchase_value: lead.purchase_value,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        company_id: lead.company_id,
      }));
    },
    enabled: !!companyId,
  });

  // Criar cliente
  const createClientMutation = useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      if (!companyId) {
        throw new Error("Company ID não encontrado");
      }

      if (!defaultWhatsAppInstance?.id) {
        throw new Error("Nenhuma instância WhatsApp encontrada. Configure uma instância WhatsApp primeiro.");
      }

      // Limpar e validar telefone
      const cleanPhone = cleanPhoneNumber(clientData.phone);
      if (!validatePhone(cleanPhone)) {
        throw new Error("Telefone inválido");
      }

      // Verificar se já existe um cliente com este telefone
      const { data: existingClient } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", cleanPhone)
        .eq("company_id", companyId)
        .maybeSingle();

      if (existingClient) {
        throw new Error("Já existe um cliente com este telefone");
      }

      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: clientData.name,
          phone: cleanPhone,
          email: clientData.email,
          address: clientData.address,
          company: clientData.company,
          notes: clientData.notes,
          purchase_value: clientData.purchase_value,
          company_id: companyId,
          whatsapp_number_id: defaultWhatsAppInstance.id, // Campo obrigatório
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });

  // Atualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const updateData: any = { ...data };
      
      // Se estiver atualizando o telefone, limpar e validar
      if (data.phone) {
        const cleanPhone = cleanPhoneNumber(data.phone);
        if (!validatePhone(cleanPhone)) {
          throw new Error("Telefone inválido");
        }
        updateData.phone = cleanPhone;
      }

      const { data: updatedData, error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    },
    onSuccess: (updatedClient) => {
      toast.success("Cliente atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      setSelectedClient(updatedClient);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  // Deletar cliente
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      setIsDetailsOpen(false);
      setSelectedClient(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao deletar cliente");
    },
  });

  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: ClientData) => {
    setSelectedClient(client);
    setIsEditing(true);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: ClientFormData) => {
    if (isEditing && selectedClient) {
      updateClientMutation.mutate({ id: selectedClient.id, data });
    } else {
      createClientMutation.mutate(data);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClientMutation.mutate(clientId);
  };

  const handleUpdateNotes = (notes: string) => {
    if (!selectedClient) return;
    updateClientMutation.mutate({ 
      id: selectedClient.id, 
      data: { notes } 
    });
  };

  const handleUpdatePurchaseValue = (purchase_value: number | undefined) => {
    if (!selectedClient) return;
    updateClientMutation.mutate({ 
      id: selectedClient.id, 
      data: { purchase_value } 
    });
  };

  return {
    clients: clientsQuery.data || [],
    selectedClient,
    isDetailsOpen,
    isFormOpen,
    isEditing,
    isLoading: clientsQuery.isLoading || createClientMutation.isPending || updateClientMutation.isPending,
    setIsDetailsOpen,
    setIsFormOpen,
    handleSelectClient,
    handleAddClient,
    handleEditClient,
    handleFormSubmit,
    handleDeleteClient,
    handleUpdateNotes,
    handleUpdatePurchaseValue,
    refetch: clientsQuery.refetch,
  };
}
