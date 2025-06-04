
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
  "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
  "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐",
  "🖖", "👋", "🤏", "✊", "👊", "🤛", "🤜", "💪"
];

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-white/20 rounded-full"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-80 p-4 bg-white/90 backdrop-blur-md border-white/30 shadow-xl">
        <ScrollArea className="h-48">
          <div className="grid grid-cols-8 gap-2">
            {EMOJIS.map((emoji, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => onEmojiSelect(emoji)}
                className="h-10 w-10 p-0 hover:bg-white/50 text-lg rounded-lg"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
