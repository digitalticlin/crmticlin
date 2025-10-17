// ==========================
// 🔹 PEGAR DADOS DO INPUT
// ==========================
const input = $input.first().json;

// Dados fixos que vêm do node "Organiza para Agente"
const leadId = $('Organiza para Agente').item.json.lead.id;
const instanceId = $('Organiza para Agente').item.json.instance.supabaseId;
const createdByUserId = $('Organiza para Agente').item.json.instance.created_by_user_id;
const phone = $('Organiza para Agente').item.json.lead.phone;
const agentId = $('Organiza para Agente').item.json.agent.id;

console.log('📦 Organizando envio:', {
  type: input.type || 'text',
  hasImage: input.has_image || false,
  hasAudio: input.has_audio || false,
  leadId: leadId,
  phone: phone.substring(0, 4) + '****'
});

// ==========================
// 🔹 VERIFICAR TIPO DE MENSAGEM
// ==========================
let payload = {
  leadId: leadId,
  instanceId: instanceId,
  createdByUserId: createdByUserId,
  phone: phone,
  agentId: agentId
};

// Verificar se é IMAGEM (vem do "Converte imagem")
if (input.type === 'image' && input.has_image === true && input.base64) {
  console.log('🖼️ Preparando envio de IMAGEM:', {
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeKB: input.sizeKB
  });

  payload.message = null;                    // ✅ NULL para imagem
  payload.mediaType = "image";               // ✅ Type = image
  payload.mediaBase64 = input.base64;        // ✅ NOVO NOME!
  payload.audioMetadata = {
    mimeType: input.mimeType,
    filename: input.fileName,
    ptt: false
  };

}
// Verificar se é ÁUDIO (vem do "Converte áudio")
else if (input.type === 'audio' && input.has_audio === true && input.base64) {
  console.log('🎵 Preparando envio de ÁUDIO:', {
    fileName: input.fileName,
    mimeType: input.mimeType,
    isPTT: input.isPTT || false,
    duration: input.duration
  });

  payload.message = null;                    // ✅ NULL para áudio
  payload.mediaType = "audio";               // ✅ Type = audio
  payload.mediaBase64 = input.base64;        // ✅ NOVO NOME!
  payload.audioMetadata = {
    mimeType: input.mimeType,
    filename: input.fileName,
    ptt: input.isPTT || false,
    seconds: input.duration || null,
    waveform: input.waveform || null
  };

}
// É TEXTO (vem do Split direto)
else {
  const textMessage = input.message || input.output || input.text || '';

  console.log('📝 Preparando envio de TEXTO:', {
    messageLength: textMessage.length,
    preview: textMessage.substring(0, 50) + '...'
  });

  payload.message = textMessage;             // ✅ Texto aqui
  payload.mediaType = "text";                // ✅ Type = text
  payload.mediaBase64 = null;                // ✅ NULL para texto
}

console.log('✅ Payload organizado:', {
  mediaType: payload.mediaType,
  hasMediaBase64: !!payload.mediaBase64,
  messageLength: payload.message?.length || 0
});

// ==========================
// 🔹 RETORNAR PAYLOAD PRONTO
// ==========================
return payload;
