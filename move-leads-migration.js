import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jqwpgfsujibkrkkjgrsq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxd3BnZnN1amloa3Jra2pncnNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUwMDE2MzAsImV4cCI6MjA0MDU3NzYzMH0.rB65fUKEAfa0oyG_rEsfRHR-WBFqHBPUmAzCNpFT4J4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function moveLeadsAndAddTag() {
  console.log('================================================');
  console.log('📊 INICIANDO MIGRAÇÃO DE LEADS');
  console.log('================================================');

  const createdByUserId = '9936ae64-b78c-48fe-97e8-bf67623349c6';
  const oldStageId = '6b4a81cf-cf58-42d2-a856-e313a3e13943';
  const newStageId = '614be6b1-cc3d-4ea5-b436-98d16b686eb9';
  const tagId = 'e6a2d0d0-8a9b-4c24-9fa7-e3d6e3cd8175';

  try {
    // 1️⃣ Buscar leads que serão movidos
    console.log('\n1️⃣ Buscando leads para mover...');
    const { data: leadsToMove, error: fetchError } = await supabase
      .from('leads')
      .select('id, name, phone, email')
      .eq('created_by_user_id', createdByUserId)
      .eq('kanban_stage_id', oldStageId);

    if (fetchError) {
      throw new Error(`Erro ao buscar leads: ${fetchError.message}`);
    }

    console.log(`✅ Encontrados ${leadsToMove?.length || 0} leads para mover`);

    if (!leadsToMove || leadsToMove.length === 0) {
      console.log('⚠️ Nenhum lead encontrado com os critérios especificados');
      return;
    }

    // Listar os leads que serão movidos
    console.log('\n📋 Leads que serão movidos:');
    leadsToMove.forEach(lead => {
      console.log(`   - ${lead.name} (${lead.phone || lead.email || 'sem contato'})`);
    });

    // 2️⃣ Mover leads para nova etapa
    console.log('\n2️⃣ Movendo leads para nova etapa...');
    const leadIds = leadsToMove.map(l => l.id);

    const { data: movedLeads, error: moveError } = await supabase
      .from('leads')
      .update({
        kanban_stage_id: newStageId,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds)
      .select();

    if (moveError) {
      throw new Error(`Erro ao mover leads: ${moveError.message}`);
    }

    console.log(`✅ ${movedLeads?.length || 0} leads movidos com sucesso`);

    // 3️⃣ Adicionar tag aos leads
    console.log('\n3️⃣ Adicionando tag aos leads...');

    // Primeiro, verificar quais leads já têm a tag
    const { data: existingTags, error: checkError } = await supabase
      .from('lead_tags')
      .select('lead_id')
      .in('lead_id', leadIds)
      .eq('tag_id', tagId);

    if (checkError) {
      console.log(`⚠️ Erro ao verificar tags existentes: ${checkError.message}`);
    }

    const leadsWithTag = existingTags?.map(t => t.lead_id) || [];
    const leadsWithoutTag = leadIds.filter(id => !leadsWithTag.includes(id));

    if (leadsWithoutTag.length > 0) {
      // Criar array de inserções
      const tagInsertions = leadsWithoutTag.map(leadId => ({
        lead_id: leadId,
        tag_id: tagId
      }));

      const { data: insertedTags, error: tagError } = await supabase
        .from('lead_tags')
        .insert(tagInsertions)
        .select();

      if (tagError) {
        console.log(`⚠️ Erro ao adicionar tags: ${tagError.message}`);
      } else {
        console.log(`✅ Tag adicionada a ${insertedTags?.length || 0} leads`);
      }
    } else {
      console.log('ℹ️ Todos os leads já possuem a tag');
    }

    // 4️⃣ Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');

    const { data: finalLeads, error: finalError } = await supabase
      .from('leads')
      .select(`
        id,
        name,
        phone,
        email,
        kanban_stages!inner(title),
        lead_tags(
          tags(name)
        )
      `)
      .eq('created_by_user_id', createdByUserId)
      .eq('kanban_stage_id', newStageId)
      .in('id', leadIds);

    if (finalError) {
      console.log(`⚠️ Erro ao verificar resultado: ${finalError.message}`);
    } else {
      console.log('\n================================================');
      console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('================================================');
      console.log(`📊 Total de leads processados: ${finalLeads?.length || 0}`);

      // Mostrar alguns exemplos
      if (finalLeads && finalLeads.length > 0) {
        console.log('\n📋 Primeiros 5 leads migrados:');
        finalLeads.slice(0, 5).forEach(lead => {
          const tags = lead.lead_tags?.map(lt => lt.tags?.name).filter(Boolean).join(', ') || 'sem tags';
          console.log(`   - ${lead.name}`);
          console.log(`     Etapa: ${lead.kanban_stages?.title || 'N/A'}`);
          console.log(`     Tags: ${tags}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO DURANTE A MIGRAÇÃO:', error.message);
    process.exit(1);
  }
}

// Executar a migração
moveLeadsAndAddTag()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });