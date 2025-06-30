$body = @{
    event = "messages.upsert"
    instanceId = "teste-bilateral"
    data = @{
        messages = @(
            @{
                key = @{
                    remoteJid = "556299212484@s.whatsapp.net"
                    fromMe = $false
                    id = "CURL_DEBUG_$(Get-Date -Format 'HHmmss')"
                }
                message = @{
                    imageMessage = @{
                        caption = "TESTE CURL DEBUG LOGS"
                        url = "https://httpbin.org/image/jpeg"
                    }
                }
                messageTimestamp = [int][double]::Parse((Get-Date -UFormat %s))
                pushName = "Curl Test"
            }
        )
    }
    phone = "556299212484"
}

try {
    Write-Host "=== TESTE CURL COM LOGS DEBUG ==="
    $jsonBody = $body | ConvertTo-Json -Depth 10
    Write-Host "Body enviado: $($jsonBody.Substring(0, 200))..."
    
    $response = Invoke-RestMethod -Uri 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web' -Method POST -Headers @{
        'Content-Type' = 'application/json'
        'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTMxMDAsImV4cCI6MjA2NjA4OTEwMH0._trCzQxDz5wCHs6NlrXRPAJNqfCRQM4s8NhkX5xEn4w'
    } -Body $jsonBody
    
    Write-Host "SUCESSO:"
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "ERRO:"
    $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseText = $reader.ReadToEnd()
        Write-Host "Response: $responseText"
    }
} 