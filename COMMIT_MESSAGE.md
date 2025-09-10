Fix(whatsapp): conserta problemas críticos na exibição do QR code

- Corrige bug de closure no hook useQRCodeModal que impedia a atualização correta do estado
- Implementa diagnóstico avançado no componente QRCodeModal para depuração
- Melhora o tratamento de diferentes formatos de QR code no banco de dados
- Adiciona métodos alternativos de renderização para maior compatibilidade
- Implementa verificações de segurança para evitar chamadas com ID inválido
- Melhora o feedback visual com informações técnicas para o usuário

Não esqueça de fazer commit! 