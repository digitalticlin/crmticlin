ACIDIONAR OS SEGUINTES BLOCOS
- Enviar LINK (espaço descrição, link formatado e mensagem)
- Enviar Midia (Foto ou Video) (Espço para descrição e mensagem)

---

## ✅ **1. APRESENTAÇÃO INICIAL** 👋 (NÃO TER INPUT NESTE NODE, APENAS OUTPUT)
**Status:** ✅ Implementado (precisa atualizar)

**Categoria:** Especial

**Função:** Primeira mensagem que a IA envia ao cliente

**Campos do Editor:**
1. **Nome do passo** (organizacional)
   - Input curto
   - Placeholder: "Ex: Boas-vindas, Cumprimento inicial..."
   - Dica: "💡 Nome interno para você se organizar, o cliente não verá"

2. **O que deve acontecer nesta etapa?** (NOVO!)
   - Textarea (3-4 linhas)
   - Label: "📋 O que deve acontecer nesta etapa?"
   - Placeholder: "Nesta etapa você irá se apresentar ao cliente e capturar o nome dele para personalizar a conversa."
   - Dica: "💡 A IA usará isso como contexto para executar melhor"

3. **Mensagem de apresentação**
   - Textarea grande
   - Dica visível: "Use {nome_agente} e {empresa} para personalizar"
   - Placeholder: "Oi! Sou {nome_agente} da {empresa}. Estou aqui para te ajudar!"

4. **Switch:** Perguntar o nome do cliente?
   - Se SIM: Adiciona "Qual o seu nome?" automaticamente ao final
   - Se NÃO: Apenas envia a apresentação
   - Padrão: SIM (recomendado)

5. **Preview da mensagem** (estilo WhatsApp)
6. **JSON técnico** (colapsado)

**Próximo Passo:**
- Sempre vai para o próximo bloco conectado

**Observações:**
- Bloco especial destacado na paleta
- Auto-adicionado ao criar novo fluxo
- Não tem bifurcações (saída única)
- {nome_agente} e {empresa} são substituídos por valores da configuração do agente

---

## ✅ **2. FAZER PERGUNTA** 💬
**Status:** ✅ Implementado (precisa atualizar)

**Categoria:** Comunicação

**Função:** Fazer uma pergunta ao cliente e ramificar baseado na resposta

**Campos do Editor:**
1. **Nome do passo**
   - Input curto
   - Placeholder: "Ex: Perguntar se tem documento, Confirmar interesse..."
   - Dica: "💡 Dê um nome que facilite identificar no fluxo"

2. **O que deve acontecer nesta etapa?** (NOVO!)
   - Textarea (3-4 linhas)
   - Label: "📋 O que deve acontecer nesta etapa?"
   - Placeholder: "Nesta etapa você irá perguntar se o cliente já possui o extrato bancário para decidir o próximo passo."
   - Dica: "💡 A IA usará isso como contexto para executar melhor"

3. **Pergunta principal**
   - Textarea
   - Label: "❓ O que você quer perguntar ao cliente?"
   - Placeholder: "Ex: Você já tem o extrato bancário dos últimos 3 meses?"
   - Dica: "💡 Seja claro e objetivo. O cliente vai receber exatamente essa mensagem."

4. **Switch:** Verificar se já perguntou antes?
   - Se SIM: Campo para informar qual variável verificar
     - Placeholder: "Ex: tem_extrato, respondeu_interesse"
     - Dica: "Se esta informação já existir, a IA pula esta pergunta automaticamente"

5. **Opções de Resposta** (lista dinâmica - adicionar/remover)
   - Botão: "+ Adicionar opção"
   - Para cada opção:
     - **SE o cliente responder:** (input)
       - Placeholder: 'Ex: "sim", "já tenho", "tenho sim"'
       - Dica: "💡 Palavras-chave que indicam esta resposta (separe com vírgulas)"
     - **ENTÃO ir para qual passo:** (será preenchido ao conectar)
       - Placeholder: "Conecte os blocos no canvas"
       - Dica: "📌 Você pode conectar manualmente no canvas depois"
     - **Guardar resposta em:** (opcional)
       - Placeholder: "Ex: tem_extrato, cpf_cliente, nome_produto"
       - Dica: "Use isso para salvar a resposta e reutilizar depois"

6. **Preview da mensagem** (estilo WhatsApp)
7. **JSON técnico** (colapsado)

**Próximo Passo:**
- Múltiplas saídas baseadas nas respostas

**Observações:**
- Mínimo 1 opção de resposta
- Cliente pode responder de forma livre, IA identifica palavras-chave
- Validação: não permite salvar sem pergunta e sem opções

---

## 📤 **3. SOLICITAR DOCUMENTO** 📄
**Status:** ⏳ Pendente

**Categoria:** Comunicação

**Função:** Pedir um arquivo/documento ao cliente e aguardar envio

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Pedir extrato, Solicitar RG..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá solicitar o envio do extrato bancário dos últimos 3 meses em PDF ou foto."

3. **Qual documento pedir?**
   - Input
   - Placeholder: "Ex: extrato bancário, RG, comprovante de residência"
   - Dica: "💡 Seja específico sobre o documento"

4. **Mensagem de solicitação**
   - Textarea
   - Placeholder: "Por favor, envie seu {documento}. Pode ser foto ou PDF."
   - Dica: "Use {documento} para inserir o nome do documento automaticamente"

5. **Switch:** Verificar se já enviou antes?
   - Se SIM: Campo para variável
     - Placeholder: "Ex: enviou_extrato, tem_documento_rg"

6. **Tempo máximo de espera**
   - Dropdown: 5 min, 30 min, 1 hora, 6 horas, 1 dia, Sem limite
   - Padrão: 30 minutos

7. **O que fazer SE:**
   - Cliente enviar o documento → ir para passo X
   - Cliente NÃO enviar (timeout) → ir para passo Y

8. **Guardar arquivo em:**
   - Input para nome da variável
   - Placeholder: "Ex: arquivo_extrato, documento_rg"

9. **Preview da mensagem**
10. **JSON técnico** (colapsado)

**Próximo Passo:**
- 2 saídas: documento recebido / timeout

**Observações:**
- Aceita qualquer tipo de arquivo por padrão
- Validação de tipo pode ser feita no próximo bloco (Validar Documento)

---

## 📤 **4. ENVIAR MENSAGEM** 📤
**Status:** ⏳ Pendente

**Categoria:** Comunicação

**Função:** Enviar uma mensagem informativa sem aguardar resposta específica

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Confirmar recebimento, Avisar processamento..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá confirmar o recebimento do documento e avisar que está processando."

3. **Mensagem a enviar**
   - Textarea grande
   - Placeholder: "Ex: Ótimo! Recebi seu documento. Vou analisar e já te retorno."
   - Dica: "💡 Esta é uma mensagem informativa"

5. **Após enviar, ir automaticamente para:**
   - Próximo passo conectado (saída única)

6. **Preview da mensagem**
7. **JSON técnico** (colapsado)

**Próximo Passo:**
- Saída única (não há bifurcação)

**Observações:**
- Use para confirmações, avisos, informações
- Não espera resposta específica (diferente de "Fazer Pergunta")
- Continua automaticamente após enviar

---

## 🎓 **5. ENSINAR/ORIENTAR** 🎓
**Status:** ⏳ Pendente

**Categoria:** Comunicação

**Função:** Dar instruções, tutorial ou orientações ao cliente

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Ensinar a tirar extrato, Orientar sobre documentos..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá ensinar o cliente como conseguir o extrato bancário pelo app do banco."

3. **Título da instrução**
   - Input
   - Placeholder: "Ex: Como conseguir seu extrato bancário"

4. **Tipo de instrução:**
   - Radio buttons:
     - [ ] Passo a passo (com numeração automática)
     - [ ] Dica/Sugestão (texto livre)
     - [ ] Lista de orientações

5. **Mensagem com as instruções**
   - Textarea grande (6-8 linhas)
   - Placeholder (se passo a passo):
     ```
     Abra o app do seu banco
     Vá em "Extratos"
     Selecione "Últimos 3 meses"
     Clique em "Baixar PDF"
     ```
   - Dica: "Se escolheu 'Passo a passo', escreva um item por linha (numeração automática)"


7. **Após enviar, ir para:**
   - Próximo passo conectado

8. **Preview da mensagem**
9. **JSON técnico** (colapsado)

**Próximo Passo:**
- Saída única

**Observações:**
- Bom para reduzir transferências para humanos
- Cliente pode consultar depois
- Formato passo a passo numera automaticamente

---

## 🔍 **6. VALIDAR DOCUMENTO** 🔍
**Status:** ⏳ Pendente

**Categoria:** Lógica

**Função:** Verificar se o documento enviado está correto/válido

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Validar extrato, Verificar RG..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá verificar se o arquivo enviado é um PDF válido e contém informações bancárias."

3. **Qual documento validar?**
   - Dropdown com variáveis de arquivos recebidos
   - Exemplo: {arquivo_extrato}, {documento_rg}

4. **O que verificar:**
   - Checkboxes (múltiplos):
     - [ ] Tipo de arquivo
       - Se marcado: Multi-select (PDF, JPG, PNG, DOC, etc)
     - [ ] Tamanho máximo
       - Se marcado: Campo numérico (MB)
       - Placeholder: "Ex: 10"
     - [ ] Conteúdo específico (OCR/IA - avançado)
       - Se marcado: Campo de texto
       - Placeholder: "Ex: verificar se contém CPF, verificar se é extrato bancário"

5. **O que fazer SE:**
   - Documento válido → ir para passo X
   - Documento inválido → ir para passo Y

6. **Mensagem de erro personalizada**
   - Textarea
   - Placeholder: "O documento enviado não é válido. Por favor, envie um PDF ou imagem do seu extrato bancário."

7. **Preview da lógica de validação**
8. **JSON técnico** (colapsado)

**Próximo Passo:**
- 2 saídas: válido / inválido

**Observações:**
- Validação de conteúdo (OCR) requer integração futura
- Por enquanto: tipo e tamanho funcionam
- Mensagem de erro é enviada automaticamente se inválido

---

## 🔀 **7. DECISÃO (SE/ENTÃO)** 🔀
**Status:** ⏳ Pendente

**Categoria:** Lógica

**Função:** Tomar decisão automática baseada em dados/variáveis (SEM perguntar ao cliente)

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Verificar cidade, Checar valor compra..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá decidir o caminho baseado no valor da compra do cliente (maior ou menor que R$ 1000)."

3. **Adicionar condições** (lista dinâmica - adicionar/remover)
   - Botão: "+ Adicionar condição"
   - Para cada condição:
     - **SE:** [Campo/Variável] [Operador] [Valor]
       - Campo 1: Input ou Dropdown de variáveis
         - Placeholder: "Ex: lead.cidade, valor_compra, interesse"
       - Campo 2: Dropdown de operadores:
         - igual a (==)
         - diferente de (!=)
         - contém
         - não contém
         - maior que (>)
         - menor que (<)
         - maior ou igual (>=)
         - menor ou igual (<=)
         - está vazio
         - não está vazio
       - Campo 3: Input de valor
         - Placeholder: "Ex: São Paulo, 1000, alto"
     - **ENTÃO:** ir para passo X (conectar no canvas)

4. **Fallback (se nenhuma condição for verdadeira):**
   - Obrigatório
   - Ir para passo: (conectar no canvas)
   - Dica: "⚠️ Sempre defina um caminho padrão"

5. **Preview da lógica** (diagrama visual em texto)
   - Exemplo:
     ```
     SE lead.cidade == "São Paulo" → PASSO B
     SE valor_compra > 1000 → PASSO C
     SENÃO → PASSO D (fallback)
     ```

6. **JSON técnico** (colapsado)

**Próximo Passo:**
- Múltiplas saídas (uma por condição + fallback)

**Observações:**
- NÃO faz perguntas, apenas decide
- Diferente de "Fazer Pergunta" que espera resposta do cliente
- Útil para segmentação automática
- Avaliação em ordem (primeira condição verdadeira ganha)

---

## 🔍 **8. VERIFICAR SE JÁ FEZ** 🔍
**Status:** ⏳ Pendente

**Categoria:** Lógica

**Função:** Evitar repetir ações já feitas (anti-loop inteligente)

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Verificar se enviou doc, Checar se respondeu..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá verificar se o cliente já enviou o documento anteriormente para não pedir novamente."

3. **O que verificar se já foi feito?**
   - Textarea (descrição em texto livre)
   - Placeholder: "Ex: verificar se já enviou documento, verificar se já respondeu sobre interesse"

4. **Campo/variável a verificar**
   - Input ou Dropdown de variáveis
   - Placeholder: "Ex: enviou_extrato, respondeu_pergunta_1"

5. **O que fazer SE:**
   - Já fez → ir para passo X (pular etapa)
   - Ainda não fez → ir para passo Y (executar normalmente)

6. **Preview da lógica**
7. **JSON técnico** (colapsado)

**Próximo Passo:**
- 2 saídas: já fez / não fez

**Observações:**
- Melhora experiência do usuário
- Evita perguntar 2 vezes a mesma coisa
- Diferente de validação no bloco "Fazer Pergunta"
- Útil em fluxos com loops

---

## 🔁 **9. REPETIR COM VARIAÇÃO** 🔁
**Status:** ⏳ Pendente

**Categoria:** Lógica

**Função:** Voltar para um passo anterior com mensagem diferente (mais insistente)

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Insistir no documento, Lembrar pergunta..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá pedir o documento novamente com uma mensagem mais insistente, pois ele não respondeu."

3. **Qual passo repetir?**
   - Dropdown com lista de passos anteriores no fluxo
   - Ou: Campo para nome/ID do passo

4. **Quantas tentativas permitir?**
   - Number input (1-5)
   - Padrão: 3
   - Dica: "Número máximo de vezes que tentará"

5. **Mensagens por tentativa**
   - Campo dinâmico baseado no número de tentativas
   - Para cada tentativa:
     - **Tentativa {N}:**
       - Textarea
       - Placeholder (varia por N):
         - Tentativa 2: "Ainda não recebi sua resposta. Você poderia confirmar?"
         - Tentativa 3: "Última tentativa! Preciso dessa informação para continuar."
   - Dica: "Primeira tentativa usa a mensagem original"

6. **Após esgotar tentativas:**
   - Obrigatório
   - Ir para passo: (conectar no canvas)
   - Dica: "Ex: Transferir para humano ou Finalizar"

7. **Preview das variações**
8. **JSON técnico** (colapsado)

**Próximo Passo:**
- 1 saída após esgotar tentativas

**Observações:**
- Cria um loop controlado
- Útil quando cliente não responde
- Evita loop infinito com limite de tentativas
- Mensagens ficam progressivamente mais insistentes

---

## 📝 **10. ATUALIZAR DADOS DO LEAD** 📝
**Status:** ⏳ Pendente

**Categoria:** CRM

**Função:** Salvar/atualizar informações do lead no CRM

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Salvar dados cliente, Atualizar interesse..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá salvar o nome, telefone e interesse do cliente no CRM."

3. **Quais dados atualizar?**
   - Lista dinâmica (adicionar/remover campos)
   - Botão: "+ Adicionar campo"
   - Para cada campo:
     - **Campo:** Dropdown com campos do CRM
       - Nome
       - Email
       - Telefone
       - Empresa
       - Cargo
       - Cidade
       - Estado
       - Interesse
       - Observações
       - Custom (campo livre)
     - **Valor:** De onde vem?
       - Radio buttons:
         - [ ] Resposta do cliente (selecionar variável)
           - Dropdown de variáveis capturadas
         - [ ] Valor fixo (campo de texto)
           - Input livre
         - [ ] Data/hora atual
   - Exemplo visual:
     ```
     Campo: Nome → Variável: {nome_capturado}
     Campo: Interesse → Valor fixo: "Alto"
     Campo: Data_contato → Data/hora atual
     ```

4. **Após atualizar:**
   - Ir para passo: (próximo conectado)

5. **Preview dos dados que serão salvos**
   - Tabela mostrando Campo → Valor
6. **JSON técnico** (colapsado)

**Próximo Passo:**
- Saída única

**Observações:**
- Integração com tabela leads do Supabase
- Pode atualizar múltiplos campos de uma vez
- Validação: não permite campo vazio
- Sobrescreve valores existentes

---

## 🎯 **11. MOVER LEAD NO FUNIL** 🎯
**Status:** ⏳ Pendente

**Categoria:** CRM

**Função:** Mudar o lead de etapa no funil de vendas

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Qualificar lead, Mover para negociação..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá mover o lead para a etapa 'Qualificação' do funil de vendas."

3. **Para qual etapa mover?**
   - Dropdown 1: Selecionar funil
     - Busca funis do usuário no banco
   - Dropdown 2: Selecionar etapa
     - Carrega etapas do funil selecionado
   - Exemplo: "Funil de Vendas > Qualificação"

4. **Condição para mover:**
   - Radio buttons:
     - [ ] Sempre mover (incondicional)
     - [ ] Mover SE [condição]
       - Campo de condição (similar ao bloco Decisão)
       - Exemplo: "SE interesse == 'alto'"
       - Operadores: ==, !=, contém, >, <

5. **Switch:** Notificar equipe?
   - Se SIM: Notificação enviada aos responsáveis da etapa
   - Padrão: SIM

6. **Após mover:**
   - Ir para passo: (próximo conectado)

7. **Preview da ação**
8. **JSON técnico** (colapsado)

**Próximo Passo:**
- Saída única

**Observações:**
- Integração com tabela sales_funnels do Supabase
- Automação de gestão de pipeline
- Pode criar automações condicionais
- Lead é movido mesmo se conversa continuar

---

## ⏳ **12. AGUARDAR AÇÃO** ⏳
**Status:** ⏳ Pendente

**Categoria:** Controle

**Função:** Pausar o fluxo e aguardar algo acontecer

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Aguardar resposta, Esperar arquivo..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá aguardar até 30 minutos pela resposta do cliente antes de enviar um lembrete."

3. **Aguardar o quê?**
   - Radio buttons:
     - [ ] Resposta do cliente (qualquer mensagem)
     - [ ] Arquivo/documento (qualquer arquivo)
     - [ ] Tempo específico (delay)
       - Se escolher tempo:
         - Campo numérico + Dropdown (minutos/horas/dias)
         - Placeholder: "Ex: Aguardar 1 hora"

4. **Tempo máximo de espera**
   - Campo numérico + Dropdown (min/hora/dia)
   - Placeholder: "Ex: 30 minutos, 2 horas, 1 dia"
   - Dica: "Após esse tempo, considera timeout"

5. **O que fazer SE:**
   - Cliente responder/agir → ir para passo X
   - Não responder (timeout) → ir para passo Y

6. **Switch:** Enviar lembrete?
   - Se SIM:
     - **Após quanto tempo?**
       - Campo numérico + Dropdown
       - Placeholder: "Ex: 15 minutos"
     - **Mensagem do lembrete**
       - Textarea
       - Placeholder: "Oi! Você ainda está aí? Estou aguardando sua resposta."
     - **Quantos lembretes?**
       - Number (1-3)
       - Padrão: 1

7. **Preview**
8. **JSON técnico** (colapsado)

**Próximo Passo:**
- 2 saídas: respondeu / timeout

**Observações:**
- Útil para dar tempo ao cliente
- Pode enviar múltiplos lembretes
- Não bloqueia outros leads
- Se escolher "tempo específico", aguarda e continua automaticamente

---

## 📞 **13. ENCAMINHAR PARA HUMANO** 📞
**Status:** ⏳ Pendente

**Categoria:** Controle

**Função:** Transferir a conversa para um atendente humano

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Transferir vendas, Encaminhar suporte..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá transferir o atendimento para um vendedor humano porque o cliente quer negociar valores."

3. **Motivo do encaminhamento** (interno)
   - Textarea
   - Placeholder: "Ex: Cliente quer negociar valores, Dúvida técnica avançada, Solicitação de cancelamento"
   - Dica: "Apenas para organização interna, cliente não vê"

4. **Mensagem para o cliente**
   - Textarea
   - Placeholder: "Vou te transferir para um dos nossos especialistas. Aguarde um momento!"
   - Dica: "O que a IA dirá antes de transferir"

5. **Para qual departamento/setor?**
   - Radio buttons:
     - [ ] Vendas
     - [ ] Suporte
     - [ ] Financeiro
     - [ ] Técnico
     - [ ] Qualquer atendente disponível
     - [ ] Específico (selecionar usuário)
       - Se escolher: Dropdown com usuários do sistema

6. **Switch:** Enviar resumo da conversa?
   - Se SIM: Atendente recebe histórico completo da conversa
   - Padrão: SIM (recomendado)

7. **Este é o passo final?**
   - Radio buttons:
     - [ ] Sim - Encerra fluxo da IA (recomendado)
     - [ ] Não - IA pode retomar depois (avançado)
   - Padrão: SIM

8. **Preview da mensagem**
9. **JSON técnico** (colapsado)

**Próximo Passo:**
- Geralmente é terminal (fim do fluxo)
- Pode ter saída opcional se configurado para retornar

**Observações:**
- Integração com sistema de atendentes
- Notifica atendente disponível
- Lead fica aguardando na fila
- Se ninguém disponível, pode enviar mensagem automática

---

## ✅ **14. FINALIZAR CONVERSA** ✅
**Status:** ⏳ Pendente

**Categoria:** Controle

**Função:** Encerrar o fluxo conversacional

**Campos do Editor:**
1. **Nome do passo**
   - Placeholder: "Ex: Despedida, Encerramento..."

2. **O que deve acontecer nesta etapa?**
   - Textarea (3-4 linhas)
   - Placeholder: "Nesta etapa você irá agradecer o atendimento e se despedir do cliente."

3. **Mensagem de despedida**
   - Textarea
   - Placeholder: "Foi um prazer te atender! Se precisar, estou sempre por aqui. Até logo! 👋"
   - Dica: "Última mensagem que o cliente verá"

4. **Motivo do encerramento** (interno)
   - Dropdown:
     - Sucesso (objetivo alcançado)
     - Abandono (cliente parou de responder)
     - Transferido para humano
     - Cliente solicitou encerramento
     - Outro (campo livre)

5. **Ações finais:**
   - Checkboxes (múltiplos):
     - [ ] Enviar pesquisa de satisfação?
       - Se SIM:
         - **Texto da pesquisa:**
           - Textarea
           - Placeholder: "Como você avalia nosso atendimento?"
         - **Tipo:**
           - Radio: Estrelas (1-5), Nota (0-10), Sim/Não
     - [ ] Marcar como concluído no CRM
       - Sempre executa
     - [ ] Agendar follow-up
       - Se SIM:
         - **Quando?**
           - Campo: número + dropdown (horas/dias)
           - Placeholder: "Ex: Enviar mensagem após 3 dias"
         - **Mensagem do follow-up:**
           - Textarea
           - Placeholder: "Oi! Como você está? Conseguiu resolver tudo?"

6. **Preview da mensagem**
7. **JSON técnico** (colapsado)

**Próximo Passo:**
- Nenhum (bloco terminal)

**Observações:**
- Sempre marca conversa como encerrada
- Pode reabrir se cliente enviar nova mensagem
- Estatísticas de conversão são calculadas aqui
- Follow-up cria novo fluxo automático depois

---

## 📋 **RESUMO GERAL**

### ✅ **Implementados (2/14):**
1. Apresentação Inicial (precisa atualizar)
2. Fazer Pergunta (precisa atualizar)

### ⏳ **Pendentes (12/14):**
3. Solicitar Documento
4. Enviar Mensagem
5. Ensinar/Orientar
6. Validar Documento
7. Decisão (SE/ENTÃO)
8. Verificar Se Já Fez
9. Repetir com Variação
10. Atualizar Dados do Lead
11. Mover Lead no Funil
12. Aguardar Ação
13. Encaminhar para Humano
14. Finalizar Conversa

---

## 🎨 **PADRÃO DE TODOS OS EDITORES:**

### **Estrutura Fixa:**
1. ✅ Header com ícone grande colorido + título + descrição
2. ✅ **Nome do passo** (organizacional) - sempre primeiro campo
3. ✅ **"📋 O que deve acontecer nesta etapa?"** (contexto para IA) - sempre segundo campo
4. ✅ Campos específicos do tipo (com emojis e linguagem simples)
5. ✅ Decisões/próximos passos quando aplicável
6. ✅ Preview visual (como cliente vê) - estilo WhatsApp
7. ✅ JSON técnico (colapsado, para debug)
8. ✅ Botões: "❌ Cancelar" e "✅ Salvar [Nome do Bloco]"

### **Cores por Categoria:**
- 🟡 **Especial:** Gradiente amarelo-laranja (Apresentação)
- 🔵 **Comunicação:** Azul/Índigo
- 🟣 **Lógica:** Roxo/Amarelo
- 🟢 **CRM:** Verde/Ciano
- 🟠 **Controle:** Laranja/Cinza

---

## 📝 **INSTRUÇÕES PARA IMPLEMENTAÇÃO:**

**O que já temos:**
- ✅ Estrutura base dos editores (PresentationEditor, AskQuestionEditor)
- ✅ Sistema de preview estilo WhatsApp
- ✅ JSON colapsável
- ✅ Validações básicas

**O que falta fazer:**
- ⏳ Adicionar campo "Descrição" nos 2 editores existentes
- ⏳ Criar os 12 editores restantes
- ⏳ Integrar todos no FlowBuilderTest.tsx
- ⏳ Estilizar handles coloridos por tipo de saída

**Prioridade de implementação sugerida:**
1. Atualizar Apresentação Inicial e Fazer Pergunta (adicionar descrição)
2. Enviar Mensagem (mais simples)
3. Solicitar Documento
4. Decisão (SE/ENTÃO)
5. Aguardar Ação
6. Finalizar Conversa
7. Encaminhar para Humano
8. Ensinar/Orientar
9. Validar Documento
10. Atualizar Dados do Lead
11. Mover Lead no Funil
12. Verificar Se Já Fez
13. Repetir com Variação

---

**Estrutura pronta para implementação! 🚀**
