
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";

interface MessagesListProps {
  messages: Message[];
}

export const MessagesList = ({ messages }: MessagesListProps) => {
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-3 min-h-full flex flex-col justify-end">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[80%] rounded-lg p-3",
              message.isIncoming 
                ? "bg-white dark:bg-gray-800 self-start rounded-tl-none" 
                : "bg-ticlin/90 text-black self-end rounded-tr-none"
            )}
          >
            <p>{message.text}</p>
            <div className={cn(
              "text-right text-xs mt-1",
              message.isIncoming ? "text-muted-foreground" : "text-black/70"
            )}>
              {message.time}
              {!message.isIncoming && message.status && (
                <span className="ml-1">
                  {message.status === "sent" && "✓"}
                  {message.status === "delivered" && "✓✓"}
                  {message.status === "read" && "✓✓"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
