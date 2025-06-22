Fix(whatsapp): corrige exibição do QR code no modal de conexão

- Simplificou a validação de QR codes para aceitar diferentes formatos
- Melhorou o processamento e sanitização dos dados base64 do QR code
- Corrigiu a condição para exibir o botão de QR code com base no web_status
- Adicionou logs de diagnóstico para facilitar depurações futuras
- Garantiu compatibilidade com status 'waiting_qr' do web_status
- Corrigiu a renderização de imagens fallback quando o formato primário falhar

Não esqueça de fazer commit! 