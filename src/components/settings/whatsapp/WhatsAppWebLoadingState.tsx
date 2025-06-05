
import { ModernCard, ModernCardContent, ModernCardHeader } from "@/components/ui/modern-card";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const WhatsAppWebLoadingState = () => {
  return (
    <div className="space-y-4">
      <ModernCard className="bg-white/60">
        <ModernCardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100/70 rounded-xl">
              <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
            </div>
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48 bg-white/50" />
              <Skeleton className="h-3 w-32 bg-white/30" />
            </div>
          </div>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full bg-white/30" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 bg-white/30" />
              <Skeleton className="h-6 w-16 bg-white/30" />
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>

      <ModernCard className="bg-white/60">
        <ModernCardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground/80">
                Carregando suas instâncias...
              </p>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
};
