# 🗑️ SISTEMA DE EXCLUSÃO AUTOMÁTICA DE INSTÂNCIAS

## 🎯 OBJETIVO
Quando uma instância for deletada no frontend ou backend, remover automaticamente:
- Instância da memória do servidor
- Arquivos de sessão da pasta `auth_info/`
- Prevenir restarts desnecessários

---

## 🔧 IMPLEMENTAÇÃO NO BACKEND

### 1️⃣ Endpoint de Exclusão no server.js

```javascript
// ENDPOINT PARA DELETAR INSTÂNCIA COMPLETAMENTE
app.delete('/delete-instance/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    
    console.log(`🗑️ Iniciando exclusão da instância: ${instanceId}`);
    
    // 1. Verificar se instância existe
    if (!global.instances[instanceId]) {
      return res.status(404).json({ 
        success: false, 
        error: 'Instância não encontrada' 
      });
    }
    
    // 2. Desconectar instância do WhatsApp
    const instance = global.instances[instanceId];
    if (instance.sock) {
      try {
        await instance.sock.logout();
        console.log(`✅ Logout da instância ${instanceId}`);
      } catch (error) {
        console.log(`⚠️ Erro no logout de ${instanceId}: ${error.message}`);
      }
    }
    
    // 3. Remover da memória
    delete global.instances[instanceId];
    console.log(`✅ Instância ${instanceId} removida da memória`);
    
    // 4. Remover arquivos de sessão da pasta auth_info
    const fs = require('fs').promises;
    const path = require('path');
    const authPath = path.join(__dirname, 'auth_info', instanceId);
    
    try {
      const stats = await fs.stat(authPath);
      if (stats.isDirectory()) {
        await fs.rmdir(authPath, { recursive: true });
        console.log(`✅ Pasta de sessão removida: ${authPath}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`❌ Erro ao remover pasta: ${error.message}`);
      }
    }
    
    res.json({
      success: true,
      message: `Instância ${instanceId} excluída completamente`,
      actions: {
        memory: 'removed',
        session: 'deleted',
        whatsapp: 'disconnected'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

### 2️⃣ Função Auxiliar para Limpeza Completa

```javascript
// FUNÇÃO AUXILIAR PARA EXCLUSÃO COMPLETA
async function deleteInstanceCompletely(instanceId) {
  try {
    console.log(`🗑️ Exclusão completa iniciada: ${instanceId}`);
    
    // 1. Logout do WhatsApp
    if (global.instances[instanceId]?.sock) {
      try {
        await global.instances[instanceId].sock.logout();
      } catch (error) {
        console.log(`⚠️ Logout falhou para ${instanceId}`);
      }
    }
    
    // 2. Remover da memória
    delete global.instances[instanceId];
    
    // 3. Remover pasta auth_info
    const fs = require('fs').promises;
    const path = require('path');
    const authPath = path.join(__dirname, 'auth_info', instanceId);
    
    try {
      await fs.rmdir(authPath, { recursive: true });
      console.log(`✅ Sessão removida: ${instanceId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`❌ Erro ao remover ${authPath}: ${error.message}`);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Erro na exclusão de ${instanceId}:`, error.message);
    return { success: false, error: error.message };
  }
}
```

---

## 🎨 IMPLEMENTAÇÃO NO FRONTEND

### 3️⃣ Função JavaScript para Deletar Instância

```javascript
// FUNÇÃO PARA DELETAR INSTÂNCIA NO FRONTEND
async function deleteInstance(instanceId) {
  try {
    // Confirmação do usuário
    const confirmed = confirm(`Tem certeza que deseja excluir a instância "${instanceId}"? Esta ação é irreversível!`);
    
    if (!confirmed) {
      return { success: false, message: 'Operação cancelada pelo usuário' };
    }
    
    // Mostrar loading
    showLoading(`Excluindo instância ${instanceId}...`);
    
    // Fazer requisição DELETE para o backend
    const response = await fetch(`/delete-instance/${instanceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}` // Se usar autenticação
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Sucesso - atualizar interface
      showSuccess(`Instância ${instanceId} excluída com sucesso!`);
      
      // Remover da lista visual
      removeInstanceFromUI(instanceId);
      
      // Atualizar contador de instâncias
      updateInstanceCounter();
      
      return { success: true, message: result.message };
      
    } else {
      showError(`Erro ao excluir instância: ${result.error}`);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('Erro ao deletar instância:', error);
    showError('Erro de conexão ao deletar instância');
    return { success: false, error: error.message };
    
  } finally {
    hideLoading();
  }
}

// FUNÇÃO PARA REMOVER DA INTERFACE
function removeInstanceFromUI(instanceId) {
  // Remover card da instância
  const instanceCard = document.getElementById(`instance-${instanceId}`);
  if (instanceCard) {
    instanceCard.remove();
  }
  
  // Remover da dropdown/select
  const instanceSelect = document.getElementById('instanceSelect');
  if (instanceSelect) {
    const option = instanceSelect.querySelector(`option[value="${instanceId}"]`);
    if (option) {
      option.remove();
    }
  }
  
  // Atualizar tabela se existir
  const tableRow = document.getElementById(`row-${instanceId}`);
  if (tableRow) {
    tableRow.remove();
  }
}

// FUNÇÕES DE UI (implementar conforme seu sistema)
function showLoading(message) {
  // Mostrar spinner/loading com mensagem
}

function hideLoading() {
  // Esconder spinner/loading
}

function showSuccess(message) {
  // Mostrar notificação de sucesso
}

function showError(message) {
  // Mostrar notificação de erro
}
```

### 4️⃣ Integração com Botões da Interface

```html
<!-- EXEMPLO DE BOTÃO DE EXCLUSÃO -->
<div class="instance-card" id="instance-digitalticlin">
  <h3>Digital Ticlin</h3>
  <p>Status: Conectada</p>
  
  <div class="action-buttons">
    <button onclick="viewQRCode('digitalticlin')" class="btn btn-info">
      QR Code
    </button>
    
    <button onclick="deleteInstance('digitalticlin')" class="btn btn-danger">
      🗑️ Excluir
    </button>
  </div>
</div>
```

---

## 📊 IMPLEMENTAÇÃO EM SISTEMAS EXISTENTES

### 5️⃣ Se Usar React/Vue/Angular

```javascript
// REACT EXAMPLE
const InstanceCard = ({ instance }) => {
  const [deleting, setDeleting] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm(`Excluir instância ${instance.id}?`)) return;
    
    setDeleting(true);
    try {
      const result = await deleteInstance(instance.id);
      if (result.success) {
        // Atualizar estado/context
        dispatch({ type: 'REMOVE_INSTANCE', payload: instance.id });
        toast.success('Instância excluída com sucesso!');
      }
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <div className="instance-card">
      <h3>{instance.name}</h3>
      <button 
        onClick={handleDelete}
        disabled={deleting}
        className="btn btn-danger"
      >
        {deleting ? 'Excluindo...' : '🗑️ Excluir'}
      </button>
    </div>
  );
};
```

### 6️⃣ Integração com API REST Existente

```javascript
// INTEGRAÇÃO COM API EXISTENTE
class InstanceAPI {
  static async delete(instanceId) {
    const response = await fetch(`/api/instances/${instanceId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    return response.json();
  }
}
```

---

## 🔄 FLUXO COMPLETO DE EXCLUSÃO

```
1. Usuário clica em "Excluir" no frontend
   ↓
2. Confirmação de exclusão
   ↓
3. Requisição DELETE para /delete-instance/:id
   ↓
4. Backend executa:
   - Logout do WhatsApp
   - Remove da memória (global.instances)
   - Remove pasta auth_info/instanceId/
   ↓
5. Retorna sucesso para frontend
   ↓
6. Frontend atualiza interface:
   - Remove card/linha da instância
   - Atualiza contador
   - Mostra mensagem de sucesso
```

---

## ✅ BENEFÍCIOS DA IMPLEMENTAÇÃO

- 🗑️ **Exclusão completa:** Remove instância de todos os lugares
- 🚀 **Sem restarts:** Não causa reinicializações desnecessárias  
- 💾 **Otimização:** Libera memória e espaço em disco
- 🔄 **Sincronização:** Frontend e backend sempre sincronizados
- 🛡️ **Segurança:** Confirmação antes de excluir
- 📊 **Feedback:** Usuário sabe exatamente o que aconteceu

Este sistema garante que quando uma instância for deletada, ela seja **completamente removida** do sistema, evitando conflitos e restarts desnecessários!