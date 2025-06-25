
// DIAGNOSTICS MANAGER - ANÁLISE DETALHADA DE ESTRUTURA DE DADOS BAILEYS
class DiagnosticsManager {
  constructor(instances) {
    this.instances = instances;
    console.log('🔍 DiagnosticsManager inicializado');
  }

  // Diagnóstico completo da estrutura de dados de uma instância
  async getInstanceDataStructure(instanceId) {
    const logPrefix = `[DiagnosticsManager ${instanceId}]`;
    const instance = this.instances[instanceId];

    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    if (!instance.connected || !instance.socket) {
      throw new Error(`Instância não está conectada. Status: ${instance.status}`);
    }

    console.log(`${logPrefix} 🔍 Iniciando diagnóstico detalhado...`);

    const diagnostics = {
      instanceId,
      timestamp: new Date().toISOString(),
      connection: {
        status: instance.status,
        connected: instance.connected,
        phone: instance.phone,
        profileName: instance.profileName
      },
      socket: {
        exists: !!instance.socket,
        user: instance.socket.user || null,
        authState: instance.socket.authState ? 'present' : 'missing'
      },
      store: {
        exists: !!instance.socket.store,
        structure: {},
        methods: {}
      },
      availableMethods: [],
      dataAccess: {
        contacts: { method: null, available: false, count: 0, sample: null },
        chats: { method: null, available: false, count: 0, sample: null },
        messages: { method: null, available: false, count: 0, sample: null }
      }
    };

    const socket = instance.socket;

    try {
      // Analisar estrutura do store
      if (socket.store) {
        console.log(`${logPrefix} 📊 Analisando socket.store...`);
        
        const storeKeys = Object.keys(socket.store);
        diagnostics.store.structure = {
          keys: storeKeys,
          contacts: socket.store.contacts ? Object.keys(socket.store.contacts).length : 0,
          chats: socket.store.chats ? Object.keys(socket.store.chats).length : 0,
          messages: socket.store.messages ? Object.keys(socket.store.messages).length : 0
        };

        // Amostra de dados do store
        if (socket.store.contacts && Object.keys(socket.store.contacts).length > 0) {
          const firstContactId = Object.keys(socket.store.contacts)[0];
          diagnostics.dataAccess.contacts.sample = {
            id: firstContactId,
            data: socket.store.contacts[firstContactId]
          };
        }

        if (socket.store.chats && Object.keys(socket.store.chats).length > 0) {
          const firstChatId = Object.keys(socket.store.chats)[0];
          diagnostics.dataAccess.chats.sample = {
            id: firstChatId,
            data: socket.store.chats[firstChatId]
          };
        }
      }

      // Testar métodos disponíveis
      console.log(`${logPrefix} 🔧 Testando métodos disponíveis...`);
      
      const methodsToTest = [
        'getContacts',
        'getChats',
        'getChatMessages',
        'loadMessages',
        'fetchAllChats',
        'getAllChats',
        'getAllContacts'
      ];

      for (const method of methodsToTest) {
        if (typeof socket[method] === 'function') {
          diagnostics.availableMethods.push(method);
          diagnostics.store.methods[method] = 'available';
        } else {
          diagnostics.store.methods[method] = 'not_available';
        }
      }

      // Testar acesso aos contatos
      console.log(`${logPrefix} 👥 Testando acesso aos contatos...`);
      
      try {
        if (typeof socket.getContacts === 'function') {
          const contacts = await socket.getContacts();
          diagnostics.dataAccess.contacts = {
            method: 'getContacts',
            available: true,
            count: contacts ? contacts.length : 0,
            sample: contacts && contacts.length > 0 ? contacts[0] : null
          };
        } else if (socket.store && socket.store.contacts) {
          const contactIds = Object.keys(socket.store.contacts);
          diagnostics.dataAccess.contacts = {
            method: 'store.contacts',
            available: contactIds.length > 0,
            count: contactIds.length,
            sample: contactIds.length > 0 ? socket.store.contacts[contactIds[0]] : null
          };
        }
      } catch (error) {
        diagnostics.dataAccess.contacts.error = error.message;
      }

      // Testar acesso aos chats
      console.log(`${logPrefix} 💬 Testando acesso aos chats...`);
      
      try {
        if (typeof socket.getChats === 'function') {
          const chats = await socket.getChats();
          diagnostics.dataAccess.chats = {
            method: 'getChats',
            available: true,
            count: chats ? chats.length : 0,
            sample: chats && chats.length > 0 ? chats[0] : null
          };
        } else if (socket.store && socket.store.chats) {
          const chatIds = Object.keys(socket.store.chats);
          diagnostics.dataAccess.chats = {
            method: 'store.chats',
            available: chatIds.length > 0,
            count: chatIds.length,
            sample: chatIds.length > 0 ? socket.store.chats[chatIds[0]] : null
          };
        }
      } catch (error) {
        diagnostics.dataAccess.chats.error = error.message;
      }

      // Testar acesso às mensagens
      console.log(`${logPrefix} 📨 Testando acesso às mensagens...`);
      
      try {
        if (typeof socket.getChatMessages === 'function' && diagnostics.dataAccess.chats.sample) {
          const chatId = diagnostics.dataAccess.chats.sample.id || 
                         (diagnostics.dataAccess.chats.sample.key && diagnostics.dataAccess.chats.sample.key.remoteJid);
          
          if (chatId) {
            const messages = await socket.getChatMessages(chatId, 5);
            diagnostics.dataAccess.messages = {
              method: 'getChatMessages',
              available: true,
              count: messages ? messages.length : 0,
              sample: messages && messages.length > 0 ? messages[0] : null,
              testedChatId: chatId
            };
          }
        } else if (socket.store && socket.store.messages) {
          const messageKeys = Object.keys(socket.store.messages);
          diagnostics.dataAccess.messages = {
            method: 'store.messages',
            available: messageKeys.length > 0,
            count: messageKeys.length,
            sample: messageKeys.length > 0 ? socket.store.messages[messageKeys[0]] : null
          };
        }
      } catch (error) {
        diagnostics.dataAccess.messages.error = error.message;
      }

      console.log(`${logPrefix} ✅ Diagnóstico completo`);
      return diagnostics;

    } catch (error) {
      console.error(`${logPrefix} ❌ Erro no diagnóstico:`, error);
      diagnostics.error = error.message;
      return diagnostics;
    }
  }

  // Análise de compatibilidade de métodos
  getCompatibilityReport(diagnostics) {
    const report = {
      status: 'unknown',
      recommendations: [],
      dataAccessStrategy: 'fallback',
      issues: []
    };

    // Verificar disponibilidade de dados
    const hasContacts = diagnostics.dataAccess.contacts.available;
    const hasChats = diagnostics.dataAccess.chats.available;
    const hasMessages = diagnostics.dataAccess.messages.available;

    if (hasContacts && hasChats) {
      report.status = 'good';
      report.dataAccessStrategy = 'primary';
    } else if (hasContacts || hasChats) {
      report.status = 'partial';
      report.dataAccessStrategy = 'mixed';
    } else {
      report.status = 'poor';
      report.dataAccessStrategy = 'fallback';
      report.issues.push('Nenhum dado acessível através dos métodos testados');
    }

    // Recomendações baseadas nos métodos disponíveis
    if (diagnostics.availableMethods.includes('getContacts')) {
      report.recommendations.push('Usar getContacts() para obter contatos');
    } else if (diagnostics.store.structure.contacts > 0) {
      report.recommendations.push('Usar socket.store.contacts para obter contatos');
    }

    if (diagnostics.availableMethods.includes('getChats')) {
      report.recommendations.push('Usar getChats() para obter chats');
    } else if (diagnostics.store.structure.chats > 0) {
      report.recommendations.push('Usar socket.store.chats para obter chats');
    }

    if (diagnostics.availableMethods.includes('getChatMessages')) {
      report.recommendations.push('Usar getChatMessages() para obter mensagens');
    }

    return report;
  }
}

module.exports = DiagnosticsManager;
