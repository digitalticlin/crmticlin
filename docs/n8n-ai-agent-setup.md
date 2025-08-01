
# Configuração do N8N para AI Agent Messaging

## HTTP Request Node Configuration

### URL
```
https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/ai_messaging_service
```

### Method
```
POST
```

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body (JSON)
```json
{
  "apiKey": "{{ $secrets.AI_AGENT_API_KEY }}",
  "instanceId": "{{ $node['Lead Data'].json.whatsapp_number_id }}",
  "leadId": "{{ $node['Lead Data'].json.id }}",
  "createdByUserId": "{{ $node['Lead Data'].json.created_by_user_id }}",
  "phone": "{{ $node['Lead Data'].json.phone }}",
  "message": "{{ $node['AI Response'].json.response }}",
  "mediaType": "text",
  "mediaUrl": null,
  "agentId": "{{ $node['AI Agent'].json.id }}"
}
```

## Exemplo de Payload Completo
```json
{
  "apiKey": "your-secret-api-key-here",
  "instanceId": "550e8400-e29b-41d4-a716-446655440001",
  "leadId": "550e8400-e29b-41d4-a716-446655440002",
  "createdByUserId": "550e8400-e29b-41d4-a716-446655440003",
  "phone": "556299212484",
  "message": "Olá! Esta é uma resposta automática do nosso assistente de IA.",
  "mediaType": "text",
  "mediaUrl": null,
  "agentId": "550e8400-e29b-41d4-a716-446655440004"
}
```

## Campos Obrigatórios
- `apiKey`: Chave de API para autenticação
- `instanceId`: UUID da instância WhatsApp
- `leadId`: UUID do lead
- `createdByUserId`: UUID do usuário proprietário
- `phone`: Número do telefone (com código do país)
- `message`: Texto da mensagem a ser enviada

## Campos Opcionais
- `mediaType`: Tipo da mídia (padrão: "text")
- `mediaUrl`: URL da mídia (se aplicável)
- `agentId`: UUID do agente de IA (para auditoria)

## Resposta de Sucesso
```json
{
  "success": true,
  "message": "Mensagem do AI Agent enviada com sucesso",
  "data": {
    "messageId": "vps_generated_message_id",
    "instanceId": "instance_uuid",
    "vpsInstanceId": "vps_instance_name",
    "leadId": "lead_uuid",
    "phone": "556299212484",
    "mediaType": "text",
    "timestamp": "2025-01-08T15:30:00Z",
    "agentId": "agent_uuid",
    "source": "ai_agent"
  }
}
```

## Resposta de Erro
```json
{
  "success": false,
  "error": "Descrição do erro"
}
```

## Códigos de Status
- `200`: Mensagem enviada com sucesso
- `400`: Parâmetros inválidos ou instância desconectada
- `401`: API Key inválida
- `404`: Instância ou lead não encontrado
- `500`: Erro interno do servidor
- `502`: Erro na comunicação com VPS

## Secret Necessário no Supabase
Adicionar no painel do Supabase > Settings > Functions:
- Nome: `AI_AGENT_API_KEY`
- Valor: Uma chave secreta forte (recomendado: 32+ caracteres)

## Validações de Segurança
1. **API Key**: Validação obrigatória
2. **Ownership**: Instância e lead devem pertencer ao usuário
3. **Connection Status**: Instância deve estar conectada
4. **Phone Match**: Telefone deve corresponder ao lead (opcional)

## Logs e Debug
Todos os logs são prefixados com `[AI Messaging Service]` e incluem:
- ✅ Sucessos
- ❌ Erros
- 🤖 Ações específicas do AI Agent
- 📡 Comunicação com VPS
- 💾 Salvamento no banco
