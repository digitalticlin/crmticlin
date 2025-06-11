
#!/bin/bash

# INSTALADOR MANUAL SIMPLIFICADO
echo "📋 INSTALADOR MANUAL VPS - COMANDOS PARA COPIAR"
echo "=============================================="

echo ""
echo "🔧 EXECUTE ESTES COMANDOS NA SUA VPS:"
echo "====================================="

echo ""
echo "# 1. Criar diretório e navegar"
echo "mkdir -p /root/forensic-scripts"
echo "cd /root/forensic-scripts"

echo ""
echo "# 2. Criar script de análise forense"
cat > create-forensic.sh << 'SCRIPT_EOF'
cat > vps-forensic-analysis.sh << 'EOF'
$(cat src/utils/vps-forensic-analysis.sh)
EOF
chmod +x vps-forensic-analysis.sh
SCRIPT_EOF

echo ""
echo "# 3. Criar script de limpeza radical"
cat > create-cleanup.sh << 'SCRIPT_EOF'
cat > vps-radical-cleanup.sh << 'EOF'
$(cat src/utils/vps-radical-cleanup.sh)
EOF
chmod +x vps-radical-cleanup.sh
SCRIPT_EOF

echo ""
echo "# 4. Criar script de instalação controlada"
cat > create-installation.sh << 'SCRIPT_EOF'
cat > vps-controlled-installation.sh << 'EOF'
$(cat src/utils/vps-controlled-installation.sh)
EOF
chmod +x vps-controlled-installation.sh
SCRIPT_EOF

echo ""
echo "# 5. Criar script de servidor otimizado"
cat > create-server.sh << 'SCRIPT_EOF'
cat > vps-optimized-server.sh << 'EOF'
$(cat src/utils/vps-optimized-server.sh)
EOF
chmod +x vps-optimized-server.sh
SCRIPT_EOF

echo ""
echo "# 6. Criar script de teste abrangente"
cat > create-test.sh << 'SCRIPT_EOF'
cat > vps-comprehensive-test.sh << 'EOF'
$(cat src/utils/vps-comprehensive-test.sh)
EOF
chmod +x vps-comprehensive-test.sh
SCRIPT_EOF

echo ""
echo "# 7. Executar criação de todos os scripts"
echo "bash create-forensic.sh"
echo "bash create-cleanup.sh"
echo "bash create-installation.sh"
echo "bash create-server.sh"
echo "bash create-test.sh"

echo ""
echo "# 8. EXECUTAR A SEQUÊNCIA DE CORREÇÃO:"
echo "bash vps-forensic-analysis.sh"
echo "bash vps-radical-cleanup.sh"
echo "bash vps-controlled-installation.sh"
echo "bash vps-optimized-server.sh"
echo "bash vps-comprehensive-test.sh"

echo ""
echo "🎯 ORDEM DE EXECUÇÃO RECOMENDADA:"
echo "1. Análise Forense (vps-forensic-analysis.sh)"
echo "2. Limpeza Radical (vps-radical-cleanup.sh)"
echo "3. Instalação Controlada (vps-controlled-installation.sh)"
echo "4. Servidor Otimizado (vps-optimized-server.sh)"
echo "5. Teste Abrangente (vps-comprehensive-test.sh)"

echo ""
echo "⚠️ IMPORTANTE:"
echo "- Execute um script por vez"
echo "- Aguarde cada script finalizar antes do próximo"
echo "- Revise o output de cada fase"
echo "- O script de limpeza é IRREVERSÍVEL"
