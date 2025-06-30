$body = @{
    event = "messages.upsert"
    instanceId = "usuario_1750643724731"
    data = @{
        messages = @(
            @{
                key = @{
                    remoteJid = "556299212484@s.whatsapp.net"
                    fromMe = $false
                    id = "SIMPLE_TEST_$(Get-Date -Format 'HHmmss')"
                }
                message = @{
                    conversation = "TESTE SIMPLES SEM MIDIA"
                }
                messageTimestamp = [int][double]::Parse((Get-Date -UFormat %s))
                pushName = "Teste Simples"
            }
        )
    }
    phone = "556299212484"
}

try {
    Write-Host "=== TESTE SIMPLES (SEM MÍDIA) ==="
    $response = Invoke-RestMethod -Uri 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web' -Method POST -Headers @{
        'Content-Type' = 'application/json'
        'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w'
    } -Body ($body | ConvertTo-Json -Depth 10)
    
    Write-Host "SUCESSO:"
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "ERRO:"
    $_.Exception.Message
} 