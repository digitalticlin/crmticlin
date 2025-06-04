
import { corsHeaders } from './config.ts';

// Função para corrigir vinculação de instância específica
export async function correctInstanceBinding(supabase: any, phoneFilter: string, targetCompanyName: string) {
  const correctionId = `correction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[Instance Correction] 🔧 INICIANDO correção [${correctionId}] para telefone: ${phoneFilter} -> empresa: ${targetCompanyName}`);
    
    // 1. Buscar a empresa alvo pelo nome
    const { data: targetCompany, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', `%${targetCompanyName}%`)
      .single();

    if (companyError || !targetCompany) {
      throw new Error(`Empresa '${targetCompanyName}' não encontrada: ${companyError?.message}`);
    }

    console.log(`[Instance Correction] 🏢 Empresa encontrada: ${targetCompany.name} (${targetCompany.id})`);

    // 2. Buscar a instância pelo filtro de telefone
    const { data: instances, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select(`
        id,
        instance_name,
        phone,
        company_id,
        vps_instance_id,
        profiles:company_id (
          full_name,
          companies:company_id (
            name
          )
        )
      `)
      .ilike('phone', `%${phoneFilter}%`)
      .eq('connection_type', 'web');

    if (instanceError) {
      throw new Error(`Erro ao buscar instâncias: ${instanceError.message}`);
    }

    if (!instances || instances.length === 0) {
      throw new Error(`Nenhuma instância encontrada com telefone contendo '${phoneFilter}'`);
    }

    console.log(`[Instance Correction] 📱 ${instances.length} instância(s) encontrada(s) com telefone '${phoneFilter}'`);

    const corrections = [];

    // 3. Corrigir cada instância encontrada
    for (const instance of instances) {
      try {
        const currentCompanyName = instance.profiles?.companies?.name || 'Desconhecida';
        
        console.log(`[Instance Correction] 📝 Processando instância: ${instance.instance_name}`);
        console.log(`[Instance Correction] 📊 Estado atual: Empresa '${currentCompanyName}' -> Nova empresa '${targetCompany.name}'`);

        if (instance.company_id === targetCompany.id) {
          console.log(`[Instance Correction] ✅ Instância ${instance.instance_name} já está vinculada à empresa correta`);
          corrections.push({
            action: 'already_correct',
            instanceId: instance.id,
            instance_name: instance.instance_name,
            phone: instance.phone,
            current_company: currentCompanyName,
            target_company: targetCompany.name
          });
          continue;
        }

        // Atualizar a vinculação da instância
        const { data: updatedInstance, error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            company_id: targetCompany.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id)
          .select()
          .single();

        if (updateError) {
          console.error(`[Instance Correction] ❌ Erro ao atualizar instância ${instance.instance_name}:`, updateError);
          corrections.push({
            action: 'correction_failed',
            instanceId: instance.id,
            instance_name: instance.instance_name,
            phone: instance.phone,
            error: updateError.message
          });
          continue;
        }

        console.log(`[Instance Correction] ✅ Instância ${instance.instance_name} corrigida com sucesso`);
        corrections.push({
          action: 'corrected',
          instanceId: instance.id,
          instance_name: instance.instance_name,
          phone: instance.phone,
          old_company: currentCompanyName,
          new_company: targetCompany.name,
          old_company_id: instance.company_id,
          new_company_id: targetCompany.id
        });

      } catch (instanceError) {
        console.error(`[Instance Correction] ❌ Erro ao processar instância ${instance.id}:`, instanceError);
        corrections.push({
          action: 'processing_error',
          instanceId: instance.id,
          instance_name: instance.instance_name,
          phone: instance.phone,
          error: instanceError.message
        });
      }
    }

    const successCount = corrections.filter(c => c.action === 'corrected').length;
    console.log(`[Instance Correction] 🏁 Finalizado [${correctionId}]: ${successCount} correções realizadas`);

    return new Response(
      JSON.stringify({
        success: true,
        correctionId,
        corrected: successCount,
        alreadyCorrect: corrections.filter(c => c.action === 'already_correct').length,
        failed: corrections.filter(c => c.action === 'correction_failed').length,
        errors: corrections.filter(c => c.action === 'processing_error').length,
        corrections,
        targetCompany: {
          id: targetCompany.id,
          name: targetCompany.name
        },
        message: `Correção concluída: ${successCount} instâncias corrigidas para '${targetCompany.name}'`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[Instance Correction] ❌ ERRO GERAL [${correctionId}]:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        correctionId,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Função para listar vinculações incorretas
export async function auditInstanceBindings(supabase: any) {
  try {
    console.log('[Instance Audit] 🔍 Iniciando auditoria de vinculações...');
    
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select(`
        id,
        instance_name,
        phone,
        company_id,
        vps_instance_id,
        connection_status,
        profiles:company_id (
          id,
          full_name,
          companies:company_id (
            id,
            name
          )
        )
      `)
      .eq('connection_type', 'web')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro na auditoria: ${error.message}`);
    }

    const audit = {
      total: instances?.length || 0,
      withValidCompany: 0,
      withoutCompany: 0,
      orphaned: 0,
      details: []
    };

    for (const instance of instances || []) {
      const hasValidCompany = instance.profiles?.companies?.name;
      const companyName = hasValidCompany ? instance.profiles.companies.name : 'Empresa não encontrada';
      
      if (hasValidCompany) {
        audit.withValidCompany++;
      } else {
        audit.withoutCompany++;
      }

      if (!instance.company_id) {
        audit.orphaned++;
      }

      audit.details.push({
        instanceId: instance.id,
        instance_name: instance.instance_name,
        phone: instance.phone,
        vps_instance_id: instance.vps_instance_id,
        company_id: instance.company_id,
        company_name: companyName,
        connection_status: instance.connection_status,
        has_valid_company: hasValidCompany,
        is_orphaned: !instance.company_id
      });
    }

    console.log(`[Instance Audit] ✅ Auditoria concluída: ${audit.total} instâncias, ${audit.withValidCompany} válidas, ${audit.withoutCompany} com problemas`);

    return new Response(
      JSON.stringify({
        success: true,
        audit,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Instance Audit] ❌ Erro na auditoria:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
