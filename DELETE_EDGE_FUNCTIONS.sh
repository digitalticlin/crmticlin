#!/bin/bash
# ====================================================================
# SCRIPT PARA DELETAR EDGE FUNCTIONS DE BROADCAST DO SUPABASE
# ====================================================================
# Execute este arquivo no terminal: bash DELETE_EDGE_FUNCTIONS.sh
# Ou copie e cole os comandos um por um
# ====================================================================

echo "===================================================="
echo "REMOVENDO EDGE FUNCTIONS DE BROADCAST DO SUPABASE"
echo "===================================================="

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI não encontrado!"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

echo "✓ Supabase CLI encontrado"
echo ""

# Fazer login (se necessário)
echo "Verificando autenticação..."
supabase login

echo ""
echo "===================================================="
echo "DELETANDO FUNÇÕES..."
echo "===================================================="

# Deletar cada edge function
echo "1/4 - Deletando broadcast_campaign_manager..."
supabase functions delete broadcast_campaign_manager --project-ref rhjgagzstjzynvrakdyj

echo ""
echo "2/4 - Deletando broadcast_messaging_service..."
supabase functions delete broadcast_messaging_service --project-ref rhjgagzstjzynvrakdyj

echo ""
echo "3/4 - Deletando broadcast_scheduler..."
supabase functions delete broadcast_scheduler --project-ref rhjgagzstjzynvrakdyj

echo ""
echo "4/4 - Deletando broadcast_sender..."
supabase functions delete broadcast_sender --project-ref rhjgagzstjzynvrakdyj

echo ""
echo "===================================================="
echo "VERIFICANDO FUNÇÕES RESTANTES..."
echo "===================================================="

# Listar funções restantes
supabase functions list --project-ref rhjgagzstjzynvrakdyj

echo ""
echo "===================================================="
echo "CONCLUÍDO!"
echo "===================================================="
echo "Se ainda aparecerem funções de broadcast acima,"
echo "delete-as manualmente no Dashboard do Supabase."
echo "===================================================="
