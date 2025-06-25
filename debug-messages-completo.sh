#!/bin/bash

# 🔍 DEBUG INVESTIGATIVO COMPLETO - ESTRUTURA DE MENSAGENS
# Script para descobrir exatamente onde e como as mensagens estão armazenadas

echo "🔍 === DEBUG INVESTIGATIVO COMPLETO - MENSAGENS ==="
echo "📅 $(date)"
echo ""

# 1. Verificar se o servidor está rodando
echo "📊 === VERIFICANDO SERVIDOR ==="
pm2 status whatsapp-server
echo ""

# 2. Backup do server atual
echo "💾 === FAZENDO BACKUP DO SERVER ATUAL ==="
cp server.js server-backup-$(date +%Y%m%d_%H%M%S).js
echo "✅ Backup criado"
echo ""

# 3. Criar script de debug investigativo
echo "🔧 === CRIANDO SCRIPT DE DEBUG ==="
cat > debug-messages-temp.js << 'EOF'
// 🔍 ENDPOINT DE DEBUG INVESTIGATIVO - ADICIONAR AO SERVER EXISTENTE

// Função para investigar estrutura das mensagens
function investigarEstruturaMensagens(instanceName) {
    console.log('\n🔍 === DEBUG INVESTIGATIVO COMPLETO - MENSAGENS ===');
    
    try {
        // Buscar a instância
        const instance = instances?.get?.(instanceName) || instances?.[instanceName];
        
        if (!instance) {
            console.log('❌ Instância não encontrada:', instanceName);
            return { error: 'Instância não encontrada' };
        }

        // Pegar o socketStore
        const socketStore = instance.socketStore || instance.store || instance;
        
        if (!socketStore) {
            console.log('❌ socketStore não disponível');
            return { error: 'socketStore não disponível' };
        }

        const resultado = {
            estrutura_geral: {},
            mensagens_detalhadas: {},
            tipos_encontrados: {},
            amostras_completas: [],
            estatisticas: {}
        };

        // 📊 ANÁLISE DA ESTRUTURA GERAL
        console.log('\n📊 === ESTRUTURA GERAL DO SOCKETSTORE ===');
        console.log('Propriedades principais:', Object.keys(socketStore));
        
        resultado.estrutura_geral = {
            propriedades_principais: Object.keys(socketStore),
            tem_messages: !!socketStore.messages,
            tipo_messages: typeof socketStore.messages,
            tem_chats: !!socketStore.chats,
            tipo_chats: typeof socketStore.chats
        };

        // 🔍 INVESTIGAÇÃO PROFUNDA DAS MENSAGENS
        console.log('\n🔍 === INVESTIGAÇÃO PROFUNDA - socketStore.messages ===');
        
        if (socketStore.messages) {
            console.log('Tipo de socketStore.messages:', typeof socketStore.messages);
            console.log('É array?', Array.isArray(socketStore.messages));
            console.log('É Map?', socketStore.messages instanceof Map);
            console.log('Construtor:', socketStore.messages.constructor.name);
            
            // Se for objeto, mostrar chaves
            if (typeof socketStore.messages === 'object' && !Array.isArray(socketStore.messages)) {
                const chaves = Object.keys(socketStore.messages);
                console.log('Número de chaves:', chaves.length);
                console.log('Primeiras 5 chaves:', chaves.slice(0, 5));
                console.log('Últimas 5 chaves:', chaves.slice(-5));
                
                resultado.mensagens_detalhadas = {
                    total_chaves: chaves.length,
                    primeiras_chaves: chaves.slice(0, 5),
                    ultimas_chaves: chaves.slice(-5),
                    exemplo_estrutura_chave: chaves.length > 0 ? chaves[0] : null
                };

                // 📝 ANÁLISE DETALHADA DE CADA CHAVE
                let contador_amostras = 0;
                for (const chave of chaves.slice(0, 10)) { // Analisar apenas as primeiras 10
                    try {
                        const valor = socketStore.messages[chave];
                        console.log(`\n📝 === ANALISANDO CHAVE: ${chave} ===`);
                        console.log('Tipo do valor:', typeof valor);
                        console.log('É array?', Array.isArray(valor));
                        
                        if (Array.isArray(valor)) {
                            console.log('📊 Tamanho do array:', valor.length);
                            if (valor.length > 0) {
                                console.log('🔍 Estrutura do primeiro item:');
                                console.log('Propriedades:', Object.keys(valor[0]));
                                
                                // Analisar cada mensagem no array
                                valor.forEach((msg, index) => {
                                    if (index < 2) { // Apenas as primeiras 2 mensagens
                                        console.log(`\n  📨 === MENSAGEM ${index + 1} ===`);
                                        console.log('  Propriedades:', Object.keys(msg));
                                        
                                        // Verificar propriedades importantes
                                        if (msg.key) {
                                            console.log('  📞 Key ID:', msg.key.id);
                                            console.log('  📞 Key remoteJid:', msg.key.remoteJid);
                                            console.log('  📞 Key fromMe:', msg.key.fromMe);
                                        }
                                        
                                        if (msg.message) {
                                            console.log('  💬 Message keys:', Object.keys(msg.message));
                                            
                                            // Detectar tipo de mensagem
                                            let tipoMsg = 'unknown';
                                            let conteudo = '';
                                            
                                            if (msg.message.conversation) {
                                                tipoMsg = 'texto';
                                                conteudo = msg.message.conversation;
                                            } else if (msg.message.extendedTextMessage) {
                                                tipoMsg = 'texto_extendido';
                                                conteudo = msg.message.extendedTextMessage.text;
                                            } else if (msg.message.imageMessage) {
                                                tipoMsg = 'imagem';
                                                conteudo = msg.message.imageMessage.caption || '[IMAGEM SEM LEGENDA]';
                                            } else if (msg.message.audioMessage) {
                                                tipoMsg = 'audio';
                                                conteudo = '[ÁUDIO]';
                                            } else if (msg.message.videoMessage) {
                                                tipoMsg = 'video';
                                                conteudo = msg.message.videoMessage.caption || '[VÍDEO SEM LEGENDA]';
                                            } else if (msg.message.documentMessage) {
                                                tipoMsg = 'documento';
                                                conteudo = `[DOC: ${msg.message.documentMessage.fileName || 'sem nome'}]`;
                                            } else if (msg.message.stickerMessage) {
                                                tipoMsg = 'sticker';
                                                conteudo = '[STICKER]';
                                            }
                                            
                                            console.log('  🎯 Tipo detectado:', tipoMsg);
                                            console.log('  📝 Conteúdo:', conteudo.substring(0, 100));
                                            
                                            // Contar tipos
                                            resultado.tipos_encontrados[tipoMsg] = (resultado.tipos_encontrados[tipoMsg] || 0) + 1;
                                        }
                                        
                                        if (msg.messageTimestamp) {
                                            const data = new Date(msg.messageTimestamp * 1000);
                                            console.log('  ⏰ Timestamp:', data.toLocaleString('pt-BR'));
                                        }
                                        
                                        if (msg.pushName) {
                                            console.log('  👤 Nome do remetente:', msg.pushName);
                                        }
                                        
                                        // Salvar amostra completa
                                        if (contador_amostras < 5) {
                                            resultado.amostras_completas.push({
                                                chave: chave,
                                                index: index,
                                                tipo: tipoMsg,
                                                conteudo: conteudo,
                                                timestamp: msg.messageTimestamp,
                                                remetente: msg.pushName || 'Desconhecido',
                                                mensagem_completa: msg
                                            });
                                            contador_amostras++;
                                        }
                                    }
                                });
                            }
                        } else if (typeof valor === 'object' && valor !== null) {
                            console.log('📦 Propriedades do objeto:', Object.keys(valor));
                            if (Object.keys(valor).length < 10) {
                                console.log('📦 Valor completo:', JSON.stringify(valor, null, 2));
                            }
                        } else {
                            console.log('📄 Valor:', valor);
                        }
                    } catch (err) {
                        console.log(`❌ Erro ao analisar chave ${chave}:`, err.message);
                    }
                }
            }
            
            // Se for Map
            if (socketStore.messages instanceof Map) {
                console.log('🗺️  É um Map! Tamanho:', socketStore.messages.size);
                const chaves = Array.from(socketStore.messages.keys());
                console.log('🗺️  Primeiras chaves do Map:', chaves.slice(0, 5));
                
                // Analisar algumas entradas do Map
                let contador = 0;
                for (const [chave, valor] of socketStore.messages) {
                    if (contador < 3) {
                        console.log(`\n🗺️  Map Entry ${contador + 1}: ${chave}`);
                        console.log('Tipo do valor:', typeof valor);
                        if (Array.isArray(valor)) {
                            console.log('Array com', valor.length, 'itens');
                        }
                        contador++;
                    }
                }
            }
            
            // Se for array
            if (Array.isArray(socketStore.messages)) {
                console.log('📋 É um Array! Tamanho:', socketStore.messages.length);
                if (socketStore.messages.length > 0) {
                    console.log('📋 Primeiro item:', JSON.stringify(socketStore.messages[0], null, 2));
                }
            }
        }

        // 📊 ESTATÍSTICAS FINAIS
        resultado.estatisticas = {
            total_tipos_mensagem: Object.keys(resultado.tipos_encontrados).length,
            distribuicao_tipos: resultado.tipos_encontrados,
            total_amostras_coletadas: resultado.amostras_completas.length
        };

        console.log('\n📊 === ESTATÍSTICAS FINAIS ===');
        console.log('Tipos de mensagem encontrados:', resultado.tipos_encontrados);
        console.log('Total de amostras coletadas:', resultado.amostras_completas.length);
        console.log('');

        return resultado;

    } catch (error) {
        console.log('❌ Erro na investigação:', error);
        return { error: error.message };
    }
}

// 🚀 ENDPOINT DE DEBUG
app.get('/debug-messages/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    
    console.log(`\n🔍 === INICIANDO DEBUG INVESTIGATIVO - ${instanceName} ===`);
    
    try {
        const resultado = investigarEstruturaMensagens(instanceName);
        
        res.json({
            success: !resultado.error,
            instanceName,
            debug_completo: resultado,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.log('❌ Erro geral no debug:', error);
        res.json({
            success: false,
            error: error.message,
            instanceName,
            timestamp: new Date().toISOString()
        });
    }
});

// 🎯 ENDPOINT SIMPLES PARA TESTAR ESTRUTURA
app.get('/quick-debug/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    
    try {
        const instance = instances?.get?.(instanceName) || instances?.[instanceName];
        
        if (!instance) {
            return res.json({ error: 'Instância não encontrada' });
        }

        const socketStore = instance.socketStore || instance.store || instance;
        
        if (!socketStore) {
            return res.json({ error: 'socketStore não encontrado' });
        }

        const quickInfo = {
            tem_messages: !!socketStore.messages,
            tipo_messages: typeof socketStore.messages,
            chaves_messages: socketStore.messages ? Object.keys(socketStore.messages).length : 0,
            eh_map: socketStore.messages instanceof Map,
            eh_array: Array.isArray(socketStore.messages),
            primeiras_3_chaves: socketStore.messages ? Object.keys(socketStore.messages).slice(0, 3) : [],
            construtor: socketStore.messages ? socketStore.messages.constructor.name : 'N/A'
        };

        console.log('🎯 Quick Debug:', quickInfo);
        
        res.json({
            success: true,
            instanceName,
            quick_info: quickInfo,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

console.log('🔍 Endpoints de debug adicionados ao servidor');
EOF

echo "✅ Script de debug criado"
echo ""

# 4. Adicionar endpoints de debug ao servidor atual
echo "🔧 === ADICIONANDO ENDPOINTS DE DEBUG AO SERVIDOR ==="

# Adicionar o código de debug ao final do server.js (antes da última linha)
sed -i '$i\
\
// 🔍 === ENDPOINTS DE DEBUG INVESTIGATIVO ===' server.js

cat debug-messages-temp.js >> temp-debug-content.txt
sed -i '$r temp-debug-content.txt' server.js

echo "✅ Endpoints de debug adicionados ao servidor"
echo ""

# 5. Reiniciar servidor
echo "🚀 === REINICIANDO SERVIDOR ==="
pm2 restart whatsapp-server
sleep 3
pm2 status whatsapp-server
echo ""

# 6. Testar endpoints de debug
echo "🧪 === TESTANDO ENDPOINTS DE DEBUG ==="
echo "Aguardando servidor inicializar..."
sleep 5

echo ""
echo "📋 Testando endpoint quick-debug..."
curl -s http://localhost:3002/quick-debug/contatoluizantoniooliveira | jq '.' 2>/dev/null || echo "Erro ao processar JSON"

echo ""
echo "🔍 Testando endpoint debug-messages (aguarde, pode demorar)..."
curl -s http://localhost:3002/debug-messages/contatoluizantoniooliveira | jq '.debug_completo.estatisticas' 2>/dev/null || echo "Erro ao processar JSON"

echo ""
echo "📊 === VERIFICANDO LOGS DO SERVIDOR ==="
pm2 logs whatsapp-server --lines 50 --nostream | grep -E "(🔍|📊|💬|📝|📨|🎯|❌)"

echo ""
echo "🎉 === DEBUG INVESTIGATIVO CONCLUÍDO ==="
echo "📋 Endpoints disponíveis:"
echo "   - GET /quick-debug/INSTANCE_NAME"
echo "   - GET /debug-messages/INSTANCE_NAME"
echo ""
echo "🔍 Para testar manualmente:"
echo "   curl http://31.97.24.222:3002/quick-debug/contatoluizantoniooliveira"
echo "   curl http://31.97.24.222:3002/debug-messages/contatoluizantoniooliveira"

# 7. Limpeza
rm -f debug-messages-temp.js temp-debug-content.txt

echo ""
echo "✅ Script concluído em $(date)" 