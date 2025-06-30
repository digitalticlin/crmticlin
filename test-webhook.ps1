$body = @{
    event = "messages.upsert"
    instanceId = "usuario_1750643724731"
    data = @{
        messages = @(
            @{
                key = @{
                    remoteJid = "556299212484@s.whatsapp.net"
                    fromMe = $false
                    id = "TEST_CACHE_DEBUG_$(Get-Date -Format 'yyyyMMddHHmmss')"
                }
                message = @{
                    documentMessage = @{
                        caption = "Teste documento cache"
                        fileName = "teste-cache.pdf"
                        url = "https://mmg.whatsapp.net/v/t62.7119-24/40906404_1464318914740967_2467565755577780098_n.enc?ccb=11-4&oh=01_Q5Aa1wGsuMILDtIjXjyHuycEHXkvjGuuRBbCvskq79Sqx_vGYw&oe=68858E71&_nc_sid=5e03e0&mms3=true"
                    }
                }
                messageTimestamp = [int][double]::Parse((Get-Date -UFormat %s))
                pushName = "Debug Test"
            }
        )
    }
    phone = "556299212484"
}

try {
    $response = Invoke-RestMethod -Uri 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web' -Method POST -Headers @{
        'Content-Type' = 'application/json'
        'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w'
    } -Body ($body | ConvertTo-Json -Depth 10)
    
    Write-Host "SUCCESS:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Yellow
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
} 