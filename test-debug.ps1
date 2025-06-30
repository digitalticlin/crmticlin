$body = @{
    event = "messages.upsert"
    instanceId = "usuario_1750643724731"
    data = @{
        messages = @(
            @{
                key = @{
                    remoteJid = "556299212484@s.whatsapp.net"
                    fromMe = $false
                    id = "DEBUG_CACHE_$(Get-Date -Format 'yyyyMMddHHmmss')"
                }
                message = @{
                    imageMessage = @{
                        caption = "TESTE CACHE DETALHADO"
                        url = "https://httpbin.org/image/jpeg"
                    }
                }
                messageTimestamp = [int][double]::Parse((Get-Date -UFormat %s))
                pushName = "Cache Debug"
            }
        )
    }
    phone = "556299212484"
}

try {
    Write-Host "Enviando teste para edge function..."
    $response = Invoke-RestMethod -Uri 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web' -Method POST -Headers @{
        'Content-Type' = 'application/json'
        'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w'
    } -Body ($body | ConvertTo-Json -Depth 10)
    
    Write-Host "SUCESSO:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "ERRO:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
} 