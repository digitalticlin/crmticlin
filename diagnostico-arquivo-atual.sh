#!/bin/bash

echo "🔍 DIAGNÓSTICO DO ARQUIVO ATUAL"
echo "==============================="

echo "📍 1. Verificando se socketStore está definido..."
grep -n "socketStore" server.js | head -10

echo ""
echo "📍 2. Procurando seção de importação de contatos..."
grep -n -A5 -B5 "Import History.*contatos" server.js

echo ""
echo "📍 3. Procurando padrão de extração atual..."
grep -n -A10 "EXTRAÇÃO.*CONTATOS" server.js

echo ""
echo "📍 4. Verificando linha 620 (onde ocorre o erro)..."
sed -n '615,625p' server.js

echo ""
echo "📍 5. Procurando todas as ocorrências de 'socketStore'..."
grep -n "socketStore" server.js

echo ""
echo "🎯 CONCLUSÃO: Vamos criar correção baseada no estado atual" 