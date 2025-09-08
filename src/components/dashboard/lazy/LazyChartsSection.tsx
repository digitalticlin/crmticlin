import { lazy, Suspense } from 'react';

const CustomizableChartsSection = lazy(() => import('../CustomizableChartsSection'));

const LazyChartsSection = () => {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 h-96">
              <div className="h-4 bg-gray-300 rounded mb-4 w-40"></div>
              <div className="h-3 bg-gray-300 rounded mb-6 w-60"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="h-8 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    }>
      <CustomizableChartsSection />
    </Suspense>
  );
};

export default LazyChartsSection;