
import { PageLayout } from "@/components/layout/PageLayout";

export const FunnelLoadingState = () => {
  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ticlin"></div>
            <p className="text-lg font-medium text-gray-700">Carregando funis...</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
