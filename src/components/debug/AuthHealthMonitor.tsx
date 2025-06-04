
import { useState, useEffect } from 'react';
import { useAuthMonitoring } from '@/hooks/useAuthMonitoring';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export function AuthHealthMonitor() {
  const { metrics, triggerEmergencyRecovery } = useAuthMonitoring();
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showMonitor, setShowMonitor] = useState(false);

  // Mostrar monitor automaticamente se detectar problemas
  useEffect(() => {
    if (metrics.errors.length > 0 || metrics.redirectCount > 3) {
      setShowMonitor(true);
    }
  }, [metrics]);

  // Esconder em produção por padrão
  useEffect(() => {
    const showDebug = localStorage.getItem('showAuthDebug') === 'true';
    setShowMonitor(showDebug);
  }, []);

  if (!showMonitor) {
    return (
      <button
        onClick={() => setShowMonitor(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs opacity-50 hover:opacity-100"
        style={{ zIndex: 9999 }}
      >
        Auth Debug
      </button>
    );
  }

  const hasErrors = metrics.errors.length > 0;
  const isUnhealthy = metrics.redirectCount > 3 || metrics.authStateChanges > 8;

  return (
    <div 
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-xs max-w-sm ${
        hasErrors ? 'bg-red-100 border-red-500' : 
        isUnhealthy ? 'bg-yellow-100 border-yellow-500' : 
        'bg-green-100 border-green-500'
      } border`}
      style={{ zIndex: 9999 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Auth Health Monitor</h3>
        <button
          onClick={() => setShowMonitor(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div>Status: {loading ? '🔄 Loading' : user ? '✅ Authenticated' : '❌ Not authenticated'}</div>
        <div>Path: {location.pathname}</div>
        <div>Redirects: {metrics.redirectCount}</div>
        <div>Auth Changes: {metrics.authStateChanges}</div>
        
        {metrics.errors.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold text-red-600">Errors:</div>
            {metrics.errors.map((error, index) => (
              <div key={index} className="text-red-600">• {error}</div>
            ))}
          </div>
        )}
        
        {isUnhealthy && (
          <button
            onClick={triggerEmergencyRecovery}
            className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Emergency Recovery
          </button>
        )}
        
        <div className="mt-2 pt-2 border-t border-gray-300">
          <button
            onClick={() => {
              localStorage.setItem('showAuthDebug', 'false');
              setShowMonitor(false);
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Disable Debug Mode
          </button>
        </div>
      </div>
    </div>
  );
}
