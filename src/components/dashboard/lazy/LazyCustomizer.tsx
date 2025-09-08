import { lazy, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const DashboardCustomizer = lazy(() => import('../customizer/DashboardCustomizer'));

const LazyCustomizer = () => {
  return (
    <Suspense fallback={
      <Button
        variant="outline"
        className="bg-white/10 border border-[#D3D800]/30 text-[#D3D800] hover:bg-[#D3D800]/20 hover:border-[#D3D800]/50 backdrop-blur-lg rounded-2xl font-medium transition-all duration-300 px-4 py-2 opacity-50 cursor-not-allowed"
        disabled
      >
        <Settings className="w-4 h-4 mr-2 animate-spin" />
        CARREGANDO...
      </Button>
    }>
      <DashboardCustomizer />
    </Suspense>
  );
};

export default LazyCustomizer;