// 🔍 DEBUG INVESTIGATIVO COMPLETO - ESTRUTURA DE MENSAGENS
// Este script vai descobrir EXATAMENTE onde e como as mensagens estão armazenadas

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simulação do socketStore global (será substituído pelo real na VPS)
let socketStore = null;

// 🔍 FUNÇÃO INVESTIGATIVA PRINCIPAL
function investigarEstruturaMensagens(instanceName) {
    console.log('\n🔍 === DEBUG INVESTIGATIVO COMPLETO - MENSAGENS ===');
    
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

    try {
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
                        console.log(`\n📝 Analisando chave: ${chave}`);
                        console.log('Tipo do valor:', typeof valor);
                        console.log('É array?', Array.isArray(valor));
                        
                        if (Array.isArray(valor)) {
                            console.log('Tamanho do array:', valor.length);
                            if (valor.length > 0) {
                                console.log('Primeiro item do array:', JSON.stringify(valor[0], null, 2));
                                
                                // Analisar cada mensagem no array
                                valor.forEach((msg, index) => {
                                    if (index < 3) { // Apenas as primeiras 3 mensagens
                                        console.log(`\n  📨 Mensagem ${index + 1}:`);
                                        console.log('  Propriedades:', Object.keys(msg));
                                        
                                        // Verificar propriedades importantes
                                        if (msg.key) console.log('  📞 Key:', msg.key);
                                        if (msg.message) {
                                            console.log('  💬 Message type:', typeof msg.message);
                                            console.log('  💬 Message keys:', Object.keys(msg.message));
                                            
                                            // Detectar tipo de mensagem
                                            let tipoMsg = 'unknown';
                                            if (msg.message.conversation) tipoMsg = 'texto';
                                            if (msg.message.extendedTextMessage) tipoMsg = 'texto_extendido';
                                            if (msg.message.imageMessage) tipoMsg = 'imagem';
                                            if (msg.message.audioMessage) tipoMsg = 'audio';
                                            if (msg.message.videoMessage) tipoMsg = 'video';
                                            if (msg.message.documentMessage) tipoMsg = 'documento';
                                            if (msg.message.stickerMessage) tipoMsg = 'sticker';
                                            
                                            console.log('  🎯 Tipo detectado:', tipoMsg);
                                            
                                            // Contar tipos
                                            resultado.tipos_encontrados[tipoMsg] = (resultado.tipos_encontrados[tipoMsg] || 0) + 1;
                                            
                                            // Extrair conteúdo baseado no tipo
                                            let conteudo = '';
                                            if (msg.message.conversation) {
                                                conteudo = msg.message.conversation;
                                            } else if (msg.message.extendedTextMessage) {
                                                conteudo = msg.message.extendedTextMessage.text;
                                            } else if (msg.message.imageMessage) {
                                                conteudo = msg.message.imageMessage.caption || '[IMAGEM]';
                                            } else if (msg.message.audioMessage) {
                                                conteudo = '[ÁUDIO]';
                                            } else if (msg.message.videoMessage) {
                                                conteudo = msg.message.videoMessage.caption || '[VÍDEO]';
                                            }
                                            
                                            console.log('  📝 Conteúdo:', conteudo.substring(0, 100));
                                        }
                                        
                                        if (msg.messageTimestamp) {
                                            const data = new Date(msg.messageTimestamp * 1000);
                                            console.log('  ⏰ Timestamp:', data.toLocaleString());
                                        }
                                        
                                        // Salvar amostra completa
                                        if (contador_amostras < 5) {
                                            resultado.amostras_completas.push({
                                                chave: chave,
                                                index: index,
                                                mensagem_completa: msg
                                            });
                                            contador_amostras++;
                                        }
                                    }
                                });
                            }
                        } else if (typeof valor === 'object' && valor !== null) {
                            console.log('Propriedades do objeto:', Object.keys(valor));
                            console.log('Valor completo:', JSON.stringify(valor, null, 2));
                        } else {
                            console.log('Valor:', valor);
                        }
                    } catch (err) {
                        console.log(`❌ Erro ao analisar chave ${chave}:`, err.message);
                    }
                }
            }
            
            // Se for Map
            if (socketStore.messages instanceof Map) {
                console.log('Tamanho do Map:', socketStore.messages.size);
                const chaves = Array.from(socketStore.messages.keys());
                console.log('Primeiras chaves do Map:', chaves.slice(0, 5));
                
                resultado.mensagens_detalhadas = {
                    eh_map: true,
                    tamanho: socketStore.messages.size,
                    chaves_amostra: chaves.slice(0, 5)
                };
            }
            
            // Se for array
            if (Array.isArray(socketStore.messages)) {
                console.log('Tamanho do array:', socketStore.messages.length);
                if (socketStore.messages.length > 0) {
                    console.log('Primeiro item:', socketStore.messages[0]);
                }
            }
        }

        // 🔍 INVESTIGAÇÃO DOS CHATS (pode ter mensagens)
        console.log('\n🔍 === INVESTIGAÇÃO DOS CHATS ===');
        if (socketStore.chats && socketStore.chats.dict) {
            const chatsIds = Object.keys(socketStore.chats.dict);
            console.log('Total de chats:', chatsIds.length);
            
            // Analisar alguns chats para ver se tem mensagens
            for (const chatId of chatsIds.slice(0, 3)) {
                const chat = socketStore.chats.dict[chatId];
                console.log(`\n📱 Chat: ${chatId}`);
                console.log('Propriedades do chat:', Object.keys(chat));
                
                if (chat.messages && Array.isArray(chat.messages)) {
                    console.log('📨 Mensagens no chat:', chat.messages.length);
                    if (chat.messages.length > 0) {
                        console.log('Primeira mensagem do chat:', JSON.stringify(chat.messages[0], null, 2));
                    }
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

    } catch (error) {
        console.log('❌ Erro na investigação:', error);
        resultado.error = error.message;
    }

    return resultado;
}

// 🚀 ENDPOINT DE DEBUG
app.get('/debug-messages/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    
    console.log(`\n🔍 === INICIANDO DEBUG INVESTIGATIVO - ${instanceName} ===`);
    
    try {
        // Buscar a instância (simulação)
        const instance = instances?.get?.(instanceName) || instances?.[instanceName];
        
        if (!instance) {
            return res.json({
                success: false,
                error: 'Instância não encontrada',
                instanceName
            });
        }

        // Pegar o socketStore da instância
        socketStore = instance.socketStore || instance.store || instance;
        
        const resultado = investigarEstruturaMensagens(instanceName);
        
        res.json({
            success: true,
            instanceName,
            debug_completo: resultado
        });

    } catch (error) {
        console.log('❌ Erro geral no debug:', error);
        res.json({
            success: false,
            error: error.message,
            instanceName
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

        socketStore = instance.socketStore || instance.store || instance;
        
        if (!socketStore) {
            return res.json({ error: 'socketStore não encontrado' });
        }

        const quickInfo = {
            tem_messages: !!socketStore.messages,
            tipo_messages: typeof socketStore.messages,
            chaves_messages: socketStore.messages ? Object.keys(socketStore.messages).length : 0,
            eh_map: socketStore.messages instanceof Map,
            eh_array: Array.isArray(socketStore.messages),
            primeiras_3_chaves: socketStore.messages ? Object.keys(socketStore.messages).slice(0, 3) : []
        };

        console.log('🎯 Quick Debug:', quickInfo);
        
        res.json({
            success: true,
            instanceName,
            quick_info: quickInfo
        });

    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

console.log('🔍 Debug Messages Server iniciado');
console.log('Endpoints disponíveis:');
console.log('- GET /debug-messages/:instanceName - Debug investigativo completo');
console.log('- GET /quick-debug/:instanceName - Debug rápido da estrutura');

// Não iniciar servidor (será colado no server principal)
module.exports = app; 