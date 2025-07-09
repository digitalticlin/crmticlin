
import { supabase } from '@/integrations/supabase/client';

export class MediaService {
  // Fazer upload de mídia para o Supabase Storage
  static async uploadMedia(file: File, messageId: string): Promise<string | null> {
    try {
      const fileExtension = file.name.split('.').pop() || 'bin';
      const fileName = `${messageId}.${fileExtension}`;
      
      const { data, error } = await supabase.storage
        .from('whatsapp-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erro ao fazer upload:', error);
        return null;
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Erro no upload de mídia:', error);
      return null;
    }
  }

  // Salvar cache de mídia no banco
  static async saveMediaCache(
    messageId: string, 
    originalUrl: string, 
    cachedUrl: string | null, 
    base64Data: string | null,
    mediaType: string,
    fileName?: string
  ) {
    try {
      const { error } = await supabase
        .from('media_cache')
        .upsert({
          message_id: messageId,
          original_url: originalUrl,
          cached_url: cachedUrl,
          base64_data: base64Data,
          media_type: mediaType as any,
          file_name: fileName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar cache:', error);
      }
    } catch (error) {
      console.error('Erro ao salvar cache de mídia:', error);
    }
  }

  // Buscar mídia do cache
  static async getMediaFromCache(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('media_cache')
        .select('*')
        .eq('message_id', messageId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar cache:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar cache de mídia:', error);
      return null;
    }
  }

  // Converter base64 para blob e fazer upload
  static async uploadBase64ToStorage(
    base64Data: string,
    messageId: string,
    mediaType: string
  ): Promise<string | null> {
    try {
      // Converter base64 para blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const mimeType = this.getMimeType(mediaType);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const fileExtension = this.getFileExtension(mediaType);
      const fileName = `${messageId}.${fileExtension}`;
      
      const { data, error } = await supabase.storage
        .from('whatsapp-media')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erro ao fazer upload do base64:', error);
        return null;
      }

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Erro ao processar base64:', error);
      return null;
    }
  }

  private static getMimeType(mediaType: string): string {
    switch (mediaType) {
      case 'image': return 'image/jpeg';
      case 'video': return 'video/mp4';
      case 'audio': return 'audio/ogg';
      case 'document': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }

  private static getFileExtension(mediaType: string): string {
    switch (mediaType) {
      case 'image': return 'jpg';
      case 'video': return 'mp4';
      case 'audio': return 'ogg';
      case 'document': return 'pdf';
      default: return 'bin';
    }
  }
}
