# Verificação da Configuração VPS usando MCP do Supabase

## O que é MCP (Model Context Protocol)?

O MCP (Model Context Protocol) é um protocolo padrão que permite que Large Language Models (LLMs) se conectem a plataformas como o Supabase. Isso permite que assistentes de IA interajam e consultem seus projetos Supabase em seu nome.

## Configuração do MCP no Cursor

### 1. Criar Personal Access Token

1. Acesse as configurações do Supabase
2. Crie um Personal Access Token
3. Dê um nome descritivo como "Cursor MCP Server"

### 2. Configurar o MCP no Cursor

Crie um arquivo `.cursor/mcp.json` no root do projeto:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=kigyebrhfoljnydfipcr"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "seu_token_aqui"
      }
    }
  }
}
```

### 3. Verificar Configuração da VPS

Com o MCP configurado, você pode fazer perguntas como:

#### Verificar Edge Function whatsapp_instance_manager

```
"Verifique se a Edge Function whatsapp_instance_manager está usando a VPS correta (31.97.163.57:3001) e o token de autenticação correto"
```

#### Verificar Tabela whatsapp_instances

```
"Mostre a estrutura da tabela whatsapp_instances e as últimas 5 instâncias criadas"
```

#### Verificar Configuração de Webhooks

```
"Verifique se há registros na tabela whatsapp_instances com qr_code null há mais de 5 minutos"
```

## Comandos Úteis via MCP

### 1. Verificar Status das Instâncias

```sql
SELECT 
  id,
  instance_name,
  connection_status,
  qr_code IS NOT NULL as has_qr_code,
  created_at,
  updated_at
FROM whatsapp_instances 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Verificar Edge Functions

```
"Liste todas as Edge Functions do projeto e mostre quando foram atualizadas pela última vez"
```

### 3. Verificar Logs

```
"Mostre os logs mais recentes da Edge Function whatsapp_instance_manager"
```

## Exemplo de Uso Prático

### Verificação Completa da VPS

Você pode pedir ao assistente:

```
"Faça uma verificação completa da configuração VPS:
1. Verifique se a Edge Function whatsapp_instance_manager está usando 31.97.163.57:3001
2. Mostre as últimas instâncias criadas
3. Verifique se há instâncias sem QR Code há mais de 5 minutos
4. Mostre os logs recentes de erros"
```

### Diagnóstico de Problemas

```
"Diagnostique por que o QR Code não está aparecendo:
1. Verifique a configuração da VPS na Edge Function
2. Mostre instâncias criadas nos últimos 10 minutos
3. Verifique se há erros nos logs
4. Confirme se o webhook está configurado corretamente"
```

## Benefícios do MCP

1. **Acesso Direto**: Consulte dados do Supabase diretamente no Cursor
2. **Debugging**: Identifique problemas rapidamente
3. **Monitoramento**: Verifique status em tempo real
4. **Automação**: Execute verificações automatizadas

## Segurança

- Use sempre o modo `--read-only` para evitar alterações acidentais
- Mantenha o token seguro e não o compartilhe
- Use `--project-ref` para limitar acesso a um projeto específico

## Limitações

- Apenas modo leitura recomendado para segurança
- Não substitui o monitoramento adequado em produção
- Cuidado com prompt injection em dados sensíveis 