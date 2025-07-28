export const normalizeStatus = (status: string | null): "sent" | "delivered" | "read" => {
  if (status === 'delivered') return 'delivered';
  if (status === 'read') return 'read';
  return 'sent';
};

export const normalizeMediaType = (mediaType: string | null): "text" | "image" | "video" | "audio" | "document" => {
  if (mediaType === 'image') return 'image';
  if (mediaType === 'video') return 'video';
  if (mediaType === 'audio') return 'audio';
  if (mediaType === 'document') return 'document';
  return 'text';
}; 