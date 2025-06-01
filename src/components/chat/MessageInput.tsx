
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Paperclip, Send, Image, File, Mic, Camera } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { MediaUploadModal } from "./MediaUploadModal";
import { AudioRecorder } from "./AudioRecorder";
import { CameraCapture } from "./CameraCapture";
import { MessageTemplates } from "./MessageTemplates";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendMedia?: (mediaUrl: string, mediaType: string, fileName: string) => void;
  isSending?: boolean;
}

export const MessageInput = ({ 
  onSendMessage, 
  onSendMedia, 
  isSending = false 
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim() && !isSending) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  const handleSendMedia = async (mediaUrl: string, mediaType: string, fileName: string) => {
    if (onSendMedia) {
      await onSendMedia(mediaUrl, mediaType, fileName);
    }
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    // Aqui você implementaria o upload do áudio
    console.log('Audio blob:', audioBlob);
    setShowAudioRecorder(false);
    // TODO: Implementar upload de áudio
  };

  const handleCameraCapture = async (imageBlob: Blob) => {
    // Aqui você implementaria o upload da foto
    console.log('Image blob:', imageBlob);
    setShowCameraCapture(false);
    // TODO: Implementar upload de foto
  };

  const handleSelectTemplate = (templateContent: string) => {
    setNewMessage(templateContent);
  };

  if (showAudioRecorder) {
    return (
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <AudioRecorder
          onSendAudio={handleSendAudio}
          onCancel={() => setShowAudioRecorder(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="p-2 grid grid-cols-8 gap-2">
              {["😊", "😂", "👍", "❤️", "😍", "🙏", "👏", "🎉", "🤔", "😭", "🥳", "👋", "🔥", "💯", "⭐", "🚀"].map((emoji) => (
                <button
                  key={emoji}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  onClick={() => setNewMessage(prev => prev + emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowMediaModal(true)}
              >
                <Image className="h-4 w-4 mr-2" />
                Imagem/Vídeo
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowCameraCapture(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Tirar Foto
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowMediaModal(true)}
              >
                <File className="h-4 w-4 mr-2" />
                Documento
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowAudioRecorder(true)}
              >
                <Mic className="h-4 w-4 mr-2" />
                Gravar Áudio
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <MessageTemplates onSelectTemplate={handleSelectTemplate} />
        
        <Input
          className="flex-1"
          placeholder="Digite uma mensagem"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={isSending}
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-ticlin"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      <MediaUploadModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSendMedia={handleSendMedia}
      />

      <CameraCapture
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
};
