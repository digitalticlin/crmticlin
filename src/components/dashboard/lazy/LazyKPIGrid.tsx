import { lazy, Suspense } from 'react';

const CustomizableKPIGrid = lazy(() => 
  import('../CustomizableKPIGrid').then(module => ({ 
    default: module.CustomizableKPIGrid 
  }))
);

const LazyKPIGrid = () => {
  return (
    <Suspense fallback={
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 h-32">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    }>
      <CustomizableKPIGrid />
    </Suspense>
  );
};

export default LazyKPIGrid;