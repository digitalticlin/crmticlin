
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap, AlertCircle } from 'lucide-react';
import { windowEventManager } from '@/utils/eventManager';

export const PerformanceMonitor = () => {
  const [activeSubscriptions, setActiveSubscriptions] = useState<Record<string, number>>({});
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  const refreshSubscriptions = () => {
    const subscriptions = windowEventManager.getActiveSubscriptions();
    setActiveSubscriptions(subscriptions);
  };

  useEffect(() => {
    refreshSubscriptions();
    const interval = setInterval(refreshSubscriptions, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalSubscriptions = Object.values(activeSubscriptions).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Renders:</span>
          <Badge variant="outline">{renderCount}</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Event Listeners:</span>
          <Badge variant={totalSubscriptions > 10 ? "destructive" : "default"}>
            {totalSubscriptions}
          </Badge>
        </div>

        {Object.entries(activeSubscriptions).map(([eventType, count]) => (
          <div key={eventType} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{eventType}:</span>
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          </div>
        ))}

        <Button size="sm" onClick={refreshSubscriptions} className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          Refresh
        </Button>

        {totalSubscriptions > 15 && (
          <div className="flex items-center gap-2 text-amber-600 text-xs">
            <AlertCircle className="h-4 w-4" />
            <span>Alto número de listeners</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
