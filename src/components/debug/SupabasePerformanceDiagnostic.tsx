
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  duration: number;
  success: boolean;
  error?: string;
}

interface DiagnosticResults {
  timestamp: string;
  user: string;
  tests: TestResult[];
  totalDuration: number;
}

export const SupabasePerformanceDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResults | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    const tests: TestResult[] = [];

    try {
      // Test 1: Simple select
      const test1Start = Date.now();
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        tests.push({
          name: 'Simple Profile Select',
          duration: Date.now() - test1Start,
          success: !error,
          error: error?.message
        });
      } catch (err) {
        tests.push({
          name: 'Simple Profile Select',
          duration: Date.now() - test1Start,
          success: false,
          error: (err as Error).message
        });
      }

      // Test 2: Auth check
      const test2Start = Date.now();
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        tests.push({
          name: 'Auth User Check',
          duration: Date.now() - test2Start,
          success: !error,
          error: error?.message
        });
      } catch (err) {
        tests.push({
          name: 'Auth User Check',
          duration: Date.now() - test2Start,
          success: false,
          error: (err as Error).message
        });
      }

      // Test 3: Leads query
      const test3Start = Date.now();
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, name')
          .limit(5);
        
        tests.push({
          name: 'Leads Query',
          duration: Date.now() - test3Start,
          success: !error,
          error: error?.message
        });
      } catch (err) {
        tests.push({
          name: 'Leads Query',
          duration: Date.now() - test3Start,
          success: false,
          error: (err as Error).message
        });
      }

      // Test 4: Complex join
      const test4Start = Date.now();
      try {
        const { data, error } = await supabase
          .from('leads')
          .select(`
            id,
            name,
            kanban_stages(title)
          `)
          .limit(3);
        
        tests.push({
          name: 'Complex Join Query',
          duration: Date.now() - test4Start,
          success: !error,
          error: error?.message
        });
      } catch (err) {
        tests.push({
          name: 'Complex Join Query',
          duration: Date.now() - test4Start,
          success: false,
          error: (err as Error).message
        });
      }

      const totalDuration = Date.now() - startTime;
      const { data: { user } } = await supabase.auth.getUser();

      setResults({
        timestamp: new Date().toISOString(),
        user: user?.email || 'Anonymous',
        tests,
        totalDuration
      });

    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Performance Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostic...
            </>
          ) : (
            'Run Performance Test'
          )}
        </Button>

        {results && (
          <div className="space-y-3 mt-6">
            <div className="text-sm text-gray-600">
              <p>Test completed at: {new Date(results.timestamp).toLocaleString()}</p>
              <p>User: {results.user}</p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Total Duration: {results.totalDuration}ms
              </p>
            </div>
            
            <div className="space-y-2">
              {results.tests.map((test, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    test.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {test.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{test.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">{test.duration}ms</span>
                  </div>
                  {test.error && (
                    <p className="text-sm text-red-600 mt-1">{test.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
