# 🚀 Como Ativar o Novo Sistema DnD

## 🎯 **Ativação Simples**

### **Opção 1: Variável de Ambiente**
```bash
# No terminal, definir a variável
set REACT_APP_DND_KIT_ENABLED=true

# Ou no .env
REACT_APP_DND_KIT_ENABLED=true
```

### **Opção 2: Editar diretamente o código**
No arquivo `src/config/features.ts`:
```ts
export const FEATURE_FLAGS = {
  // Mudar esta linha:
  DND_KIT_ENABLED: true, // ← Forçar para true
  
  // Resto permanece igual...
}
```

### **Opção 3: Console do navegador**
```js
// No console do navegador, override temporário
localStorage.setItem('force_dnd_enabled', 'true');
location.reload();
```

## 🎨 **Como Verificar se Está Ativo**

1. **Indicador visual**: Aparece "🚀 DnD Kit Ativo" no canto superior direito
2. **Console**: Logs mostram "🆕 DnD Kit" ao invés de "📋 Legacy"
3. **Funcionamento**: Drag and drop funciona com auto-scroll

## 🔄 **Estados do Sistema**

| Estado | Descrição | Visual |
|--------|-----------|--------|
| **❌ Desabilitado** | Sistema legacy sem DnD | Sem drag, cards normais |
| **✅ Habilitado** | Novo sistema @dnd-kit | Badge verde, auto-scroll |

## 🛠️ **Teste Rápido**

1. Ativar com uma das opções acima
2. Recarregar a página
3. Ir para funil de vendas
4. Arrastar um card entre etapas
5. ✅ Deve funcionar com auto-scroll!

## 🐛 **Se Algo Der Errado**

Para voltar ao sistema antigo:
```ts
// features.ts
DND_KIT_ENABLED: false,
```

Ou no console:
```js
localStorage.removeItem('force_dnd_enabled');
location.reload();
```

---

**⚡ Sistema híbrido:** Funciona lado a lado sem quebrar nada!