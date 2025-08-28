# ====================================================================
# TESTAR DELEÇÃO DE INSTÂNCIA WHATSAPP - VERSÃO CORRIGIDA
# ====================================================================
# PowerShell script para testar a edge function de deleção corrigida

Write-Host "🗑️ TESTANDO DELEÇÃO DE INSTÂNCIA WHATSAPP" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

# Configurações
$SUPABASE_URL = "https://rhjgagzstjzynvrakdyj.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w"

# ID da instância para testar (substitua pelo ID real)
$INSTANCE_ID = "d4752160-37c3-4243-887a-5419465d0cd3"  # contatoluizantoniooliveira
$USER_TOKEN = "SEU_TOKEN_DE_USUARIO_AQUI"  # Substitua pelo token real do usuário

Write-Host "🎯 Testando deleção da instância: $INSTANCE_ID" -ForegroundColor Cyan
Write-Host ""

# Headers para a requisição
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $USER_TOKEN"
    "apikey" = $SUPABASE_ANON_KEY
    "x-client-info" = "PowerShell-Test-Script"
}

# Body da requisição
$body = @{
    instanceId = $INSTANCE_ID
} | ConvertTo-Json

# URL da edge function
$deleteUrl = "$SUPABASE_URL/functions/v1/whatsapp_instance_delete"

Write-Host "📡 Enviando requisição para: $deleteUrl" -ForegroundColor Green
Write-Host "📦 Body: $body" -ForegroundColor Gray
Write-Host ""

try {
    # Fazer a requisição
    $response = Invoke-RestMethod -Uri $deleteUrl -Method POST -Headers $headers -Body $body -TimeoutSec 60
    
    Write-Host "✅ RESPOSTA RECEBIDA:" -ForegroundColor Green
    Write-Host "=====================" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    
    if ($response.success -eq $true) {
        Write-Host ""
        Write-Host "🎉 DELEÇÃO BEM-SUCEDIDA!" -ForegroundColor Green
        Write-Host "  - Instância deletada do banco: $($response.details.databaseDeleted)" -ForegroundColor White
        Write-Host "  - Instância deletada da VPS: $($response.details.vpsDeleted)" -ForegroundColor White
        Write-Host "  - Nome da instância: $($response.details.instanceName)" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ DELEÇÃO FALHOU:" -ForegroundColor Red
        Write-Host "  - Erro: $($response.error)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ ERRO DURANTE A REQUISIÇÃO:" -ForegroundColor Red
    Write-Host "=============================" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor White
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor White
    
    if ($_.Exception.Response) {
        try {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorBody = $reader.ReadToEnd()
            Write-Host "Response Body: $errorBody" -ForegroundColor White
        } catch {
            Write-Host "Não foi possível ler o body da resposta de erro" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "🔧 INSTRUÇÕES PARA OBTER O TOKEN DE USUÁRIO:" -ForegroundColor Yellow
Write-Host "1. Abra o DevTools (F12) no seu navegador" -ForegroundColor White
Write-Host "2. Faça login no sistema" -ForegroundColor White
Write-Host "3. Vá para Application > Local Storage > sua_url" -ForegroundColor White
Write-Host "4. Procure por 'sb-*-auth-token'" -ForegroundColor White
Write-Host "5. Copie o valor do 'access_token'" -ForegroundColor White
Write-Host "6. Substitua 'SEU_TOKEN_DE_USUARIO_AQUI' neste script" -ForegroundColor White
Write-Host ""