// 🛡️ TESTE SEGURO DO MÓDULO DE RECUPERAÇÃO
// Este teste NÃO modifica nada na VPS, apenas analisa e reporta

const SafeRecoveryModule = require('./recovery-module-safe.js');

async function testSafeRecovery() {
  console.log('🛡️ === TESTE SEGURO DO MÓDULO DE RECUPERAÇÃO ===');
  
  const recovery = new SafeRecoveryModule({
    vpsUrl: 'http://31.97.163.57:3001',
    authToken: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1',
    supabaseUrl: 'https://rhjgagzstjzynvrakdyj.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM',
    enabled: true
  });

  console.log('\n🛡️ 1. Verificando status inicial...');
  console.log(recovery.getStatus());

  console.log('\n🛡️ 2. Executando análise segura (DRY RUN)...');
  const result = await recovery.executeSafeRecovery(true); // DRY RUN - não modifica nada

  if (result.success) {
    console.log('\n✅ ANÁLISE CONCLUÍDA COM SUCESSO:');
    console.log('📊 Análise:', result.report.analysis);
    
    if (result.report.wouldDelete?.length > 0) {
      console.log('\n🗑️ INSTÂNCIAS ÓRFÃS QUE SERIAM DELETADAS:');
      result.report.wouldDelete.forEach(id => console.log(`   • ${id}`));
    }
    
    if (result.report.wouldRecover?.length > 0) {
      console.log('\n🔧 INSTÂNCIAS QUE SERIAM RECUPERADAS:');
      result.report.wouldRecover.forEach(id => console.log(`   • ${id}`));
    }
    
    console.log('\n🛡️ NENHUMA MODIFICAÇÃO FOI FEITA - APENAS ANÁLISE');
  } else {
    console.log('\n❌ ERRO NA ANÁLISE:', result.error);
  }

  console.log('\n🛡️ 3. Status final...');
  console.log(recovery.getStatus());
}

// Executar teste apenas se chamado diretamente
if (require.main === module) {
  testSafeRecovery().catch(console.error);
}

module.exports = { testSafeRecovery }; 