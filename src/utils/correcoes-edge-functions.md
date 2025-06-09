
# Correções Edge Functions - Problema 4 (RLS)

## Problema Identificado
O webhook estava retornando erro 500: "JSON object requested, multiple (or no) rows returned"

## Correção 4: whatsapp_qr_service.ts

### Problema
```typescript
// ❌ ERRO: .single() falha quando não há registros
const { data: instance, error } = await supabase
  .from('whatsapp_instances')
  .select('*')
  .eq('vps_instance_id', vps_instance_id)
  .single();
```

### Correção
```typescript
// ✅ CORRIGIDO: .maybeSingle() permite zero registros
const { data: instance, error } = await supabase
  .from('whatsapp_instances')
  .select('*')
  .eq('vps_instance_id', vps_instance_id)
  .maybeSingle();

if (!instance) {
  console.log(`[QR Service] ⚠️ Instância não encontrada: ${vps_instance_id}`);
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Instância não encontrada'
    }),
    { headers: corsHeaders }
  );
}
```

## Correção 4: webhook_whatsapp_web/index.ts

### Problema
```typescript
// ❌ ERRO: Busca instância com .single()
const { data: instance, error: instanceError } = await supabase
  .from('whatsapp_instances')
  .select('*')
  .eq('instance_name', instanceName)
  .single();
```

### Correção
```typescript
// ✅ CORRIGIDO: Usar .maybeSingle() e verificar existência
const { data: instance, error: instanceError } = await supabase
  .from('whatsapp_instances')
  .select('*')
  .eq('instance_name', instanceName)
  .maybeSingle();

if (instanceError) {
  console.error('[Webhook] ❌ Erro na consulta:', instanceError);
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Erro na consulta da instância'
    }),
    { headers: corsHeaders }
  );
}

if (!instance) {
  console.error('[Webhook] ❌ Instância não encontrada:', instanceName);
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Instância não encontrada'
    }),
    { headers: corsHeaders }
  );
}
```

## Próximos Passos

1. **Aplicar na VPS primeiro:**
   ```bash
   ./deploy-correcoes-criticas.sh
   ```

2. **Testar VPS:**
   ```bash
   ./teste-pos-correcoes.sh
   ```

3. **Corrigir Edge Functions:**
   - Aplicar correções acima no código das Edge Functions
   - Usar .maybeSingle() em vez de .single()
   - Adicionar verificações de existência

4. **Testar fluxo completo:**
   - VPS → Edge Functions
   - Edge Functions → Database
   - Webhook → Processing

## Resumo das 4 Correções

1. ✅ **Autenticação**: Service Role Key na VPS
2. ✅ **Webhook Payload**: Padronização da estrutura
3. ✅ **Endpoints**: Adicionados /contacts e /messages
4. ⏳ **RLS/Database**: Usar .maybeSingle() nas Edge Functions
