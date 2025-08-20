import { supabase } from '@/integrations/supabase/client';
import { ProcessedLead, ImportResult, ImportProgress } from '@/types/spreadsheet';

export class LeadImporter {
  private userId: string;
  private onProgress?: (progress: ImportProgress) => void;

  constructor(userId: string, onProgress?: (progress: ImportProgress) => void) {
    this.userId = userId;
    this.onProgress = onProgress;
  }

  async importLeads(leads: ProcessedLead[]): Promise<ImportResult> {
    try {
      this.updateProgress('processing', 0, 'Preparando importação...');

      // Buscar configurações do usuário
      const config = await this.getUserConfig();
      
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      const errors: any[] = [];
      const duplicates: any[] = [];

      // Processar em lotes de 10 para melhor performance
      const batchSize = 10;
      const batches = this.createBatches(leads, batchSize);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const progress = ((batchIndex + 1) / batches.length) * 90; // 90% para processamento
        
        this.updateProgress('processing', progress, `Processando lote ${batchIndex + 1} de ${batches.length}...`);

        for (const lead of batch) {
          try {
            // Verificar duplicata por telefone
            const existingLead = await this.checkExistingLead(lead.phone);
            
            if (existingLead) {
              duplicates.push({
                row: lead.rowIndex,
                phone: lead.phone,
                existingLeadName: existingLead.name
              });
              skippedCount++;
              continue;
            }

            // Criar lead
            const createdLead = await this.createLead(lead, config);
            
            // Processar tags se houver
            if (lead.tags.length > 0) {
              await this.processTags(createdLead.id, lead.tags);
            }

            successCount++;
          } catch (error) {
            errorCount++;
            errors.push({
              row: lead.rowIndex,
              field: 'geral',
              message: error instanceof Error ? error.message : 'Erro desconhecido',
              value: lead.name
            });
          }
        }

        // Pequena pausa entre lotes para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.updateProgress('completed', 100, 'Importação concluída!');

      return {
        success: true,
        totalRows: leads.length,
        successCount,
        errorCount,
        errors,
        skippedCount,
        duplicates
      };

    } catch (error) {
      this.updateProgress('error', 0, `Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      return {
        success: false,
        totalRows: leads.length,
        successCount: 0,
        errorCount: leads.length,
        errors: [{
          row: 0,
          field: 'geral',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        }],
        skippedCount: 0,
        duplicates: []
      };
    }
  }

  private async getUserConfig() {
    // Buscar instância WhatsApp
    const { data: whatsappInstance } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("created_by_user_id", this.userId)
      .eq("connection_status", "connected")
      .limit(1)
      .maybeSingle();

    let whatsappNumberId = whatsappInstance?.id;
    if (!whatsappNumberId) {
      const { data: anyInstance } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("created_by_user_id", this.userId)
        .limit(1)
        .maybeSingle();
      
      whatsappNumberId = anyInstance?.id;
    }

    // Buscar funil padrão
    const { data: defaultFunnel } = await supabase
      .from("funnels")
      .select("id")
      .eq("created_by_user_id", this.userId)
      .limit(1)
      .maybeSingle();

    if (!defaultFunnel) {
      throw new Error("Nenhum funil encontrado para este usuário");
    }

    // Buscar estágio padrão
    const { data: defaultStage } = await supabase
      .from("kanban_stages")
      .select("id")
      .eq("funnel_id", defaultFunnel.id)
      .order("order_position")
      .limit(1)
      .maybeSingle();

    return {
      whatsappNumberId,
      funnelId: defaultFunnel.id,
      stageId: defaultStage?.id
    };
  }

  private async checkExistingLead(phone: string) {
    const { data } = await supabase
      .from("leads")
      .select("id, name")
      .eq("phone", phone)
      .eq("created_by_user_id", this.userId)
      .maybeSingle();

    return data;
  }

  private async createLead(lead: ProcessedLead, config: any) {
    // Buscar próxima posição
    let nextOrderPosition = 0;
    if (config.stageId) {
      const { data: maxPositionData } = await supabase
        .from("leads")
        .select("order_position")
        .eq("kanban_stage_id", config.stageId)
        .order("order_position", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      nextOrderPosition = (maxPositionData?.order_position || 0) + 1;
    }

    const leadData = {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      company: lead.company,
      document_id: lead.document_id,
      address: lead.address,
      bairro: lead.bairro,
      cidade: lead.cidade,
      estado: lead.estado,
      cep: lead.cep,
      pais: lead.pais,
      notes: lead.notes,
      created_by_user_id: this.userId,
      whatsapp_number_id: config.whatsappNumberId,
      funnel_id: config.funnelId,
      kanban_stage_id: config.stageId,
      order_position: nextOrderPosition,
      import_source: 'spreadsheet_import'
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async processTags(leadId: string, tagNames: string[]) {
    for (const tagName of tagNames) {
      // Buscar ou criar tag
      let { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", tagName)
        .eq("created_by_user_id", this.userId)
        .maybeSingle();

      if (!tag) {
        // Criar nova tag
        const { data: newTag, error: tagError } = await supabase
          .from("tags")
          .insert({
            name: tagName,
            color: '#3b82f6', // Cor padrão azul
            created_by_user_id: this.userId
          })
          .select()
          .single();

        if (tagError) throw tagError;
        tag = newTag;
      }

      // Associar tag ao lead
      const { error: linkError } = await supabase
        .from("lead_tags")
        .insert({
          lead_id: leadId,
          tag_id: tag.id,
          created_by_user_id: this.userId
        });

      if (linkError && !linkError.message.includes('duplicate')) {
        throw linkError;
      }
    }
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private updateProgress(stage: ImportProgress['stage'], progress: number, message: string) {
    if (this.onProgress) {
      this.onProgress({ stage, progress, message });
    }
  }
}