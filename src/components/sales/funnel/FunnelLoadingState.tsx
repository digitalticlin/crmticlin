
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const FunnelLoadingState = () => {
  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-glass-lg max-w-md w-full animate-fade-in">
          <div className="text-center">
            <div className="mb-6">
              <LoadingSpinner 
                size="lg" 
                showText={true}
                text="Carregando funil..."
                className="text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-gradient-to-r from-ticlin/30 to-ticlin/60 rounded-full animate-pulse"></div>
              <div className="h-2 bg-gradient-to-r from-ticlin/20 to-ticlin/40 rounded-full w-3/4 mx-auto animate-pulse delay-100"></div>
              <div className="h-2 bg-gradient-to-r from-ticlin/10 to-ticlin/30 rounded-full w-1/2 mx-auto animate-pulse delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
