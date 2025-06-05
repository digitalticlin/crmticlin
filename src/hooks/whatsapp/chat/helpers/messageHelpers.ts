
// Helper functions for message processing
export const normalizeStatus = (status: string | null): "sent" | "delivered" | "read" => {
  if (status === 'delivered') return 'delivered';
  if (status === 'read') return 'read';
  return 'sent'; // default
};

export const normalizeMediaType = (mediaType: string | null): "text" | "image" | "video" | "audio" | "document" => {
  if (mediaType === 'image') return 'image';
  if (mediaType === 'video') return 'video';
  if (mediaType === 'audio') return 'audio';
  if (mediaType === 'document') return 'document';
  return 'text'; // default
};

export const mapDbMessageToMessage = (msg: any) => {
  const isFromMe = msg.from_me === true;
  
  return {
    id: msg.id,
    text: msg.text || '',
    fromMe: isFromMe,
    timestamp: msg.timestamp,
    status: normalizeStatus(msg.status),
    mediaType: normalizeMediaType(msg.media_type),
    mediaUrl: msg.media_url,
    // Compatibility fields for UI
    sender: isFromMe ? 'user' : 'contact',
    time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    isIncoming: !isFromMe
  };
};
