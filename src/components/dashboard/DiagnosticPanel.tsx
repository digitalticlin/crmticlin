
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, AlertCircle, Clock, RefreshCw, Activity } from "lucide-react";
import { useDiagnosticSystem, type DiagnosticCheck } from "@/hooks/dashboard/useDiagnosticSystem";

const getStatusIcon = (status: DiagnosticCheck['status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-gray-400" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
};

const getStatusColor = (status: DiagnosticCheck['status']) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getOverallStatusColor = (overall: string) => {
  switch (overall) {
    case 'healthy':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

interface DiagnosticIndicatorProps {
  trigger?: React.ReactNode;
}

export const DiagnosticIndicator = ({ trigger }: DiagnosticIndicatorProps) => {
  const { report } = useDiagnosticSystem();

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Activity className={`h-4 w-4 ${getOverallStatusColor(report.overall)}`} />
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DiagnosticPanel />
      </DialogContent>
    </Dialog>
  );
};

export const DiagnosticPanel = () => {
  const { report, isRunning, runDiagnostic } = useDiagnosticSystem();

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Activity className={`h-5 w-5 ${getOverallStatusColor(report.overall)}`} />
          Diagnóstico do Sistema
        </DialogTitle>
      </DialogHeader>

      {/* Status Geral */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Status Geral</CardTitle>
              <CardDescription>
                Última verificação: {report.lastRun.toLocaleTimeString()}
              </CardDescription>
            </div>
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning} 
              size="sm"
              variant="outline"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reexecutar
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {getStatusIcon(report.overall as any)}
            <div>
              <p className={`font-medium ${getOverallStatusColor(report.overall)}`}>
                {report.overall === 'healthy' && 'Sistema Saudável'}
                {report.overall === 'warning' && 'Atenção Necessária'}
                {report.overall === 'critical' && 'Problemas Críticos'}
              </p>
              <p className="text-sm text-gray-600">{report.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verificações Detalhadas */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Verificações Detalhadas</h3>
        
        {report.checks.map((check) => (
          <Card key={check.id} className="border-l-4 border-l-transparent">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                {getStatusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{check.name}</h4>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(check.status)}
                    >
                      {check.status === 'success' && 'OK'}
                      {check.status === 'warning' && 'Atenção'}
                      {check.status === 'error' && 'Erro'}
                      {check.status === 'pending' && 'Pendente'}
                    </Badge>
                    {check.duration && (
                      <span className="text-xs text-gray-500">
                        {check.duration}ms
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{check.message}</p>
                  
                  {check.suggestion && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Sugestão:</strong> {check.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações Adicionais */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <h4 className="font-medium text-gray-900 mb-2">Informações do Sistema</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Checks executados:</span>
              <span className="ml-2 font-medium">{report.checks.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${getOverallStatusColor(report.overall)}`}>
                {report.overall}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticPanel;
