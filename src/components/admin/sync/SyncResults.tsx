
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, CheckCircle, XCircle } from "lucide-react";
import { SyncResult } from "./types";

interface SyncResultsProps {
  result: SyncResult;
}

export const SyncResults = ({ result }: SyncResultsProps) => {
  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-green-500" />
          Resultado da Sincronização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="flex items-center justify-between p-4 bg-white/20 rounded-lg">
          <span className="font-medium">Status da Sincronização</span>
          <Badge variant={result.success ? "default" : "destructive"} className="gap-1">
            {result.success ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {result.success ? "Sucesso" : "Falha"}
          </Badge>
        </div>

        {result.success && result.data && (
          <>
            <Separator />

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.data.createdCount}
                </div>
                <div className="text-sm text-green-700">Criadas</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {result.data.updatedCount}
                </div>
                <div className="text-sm text-blue-700">Atualizadas</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {result.data.vpsInstancesCount}
                </div>
                <div className="text-sm text-purple-700">Total VPS</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {result.data.supabaseInstancesCount}
                </div>
                <div className="text-sm text-orange-700">Total Supabase</div>
              </div>
            </div>

            {/* Mostrar erros se houver */}
            {result.data.errorCount && result.data.errorCount > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  ⚠️ {result.data.errorCount} erro(s) encontrado(s) durante a sincronização
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Verifique os logs para mais detalhes
                </p>
              </div>
            )}

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ {result.data.message}
              </p>
              {result.data.createdCount > 0 && (
                <p className="text-green-700 text-sm mt-1">
                  {result.data.createdCount} instâncias órfãs foram adicionadas ao Supabase e agora podem ser vinculadas a usuários.
                </p>
              )}
              {result.data.syncId && (
                <p className="text-green-600 text-xs mt-2">
                  ID da Sincronização: {result.data.syncId}
                </p>
              )}
            </div>
          </>
        )}

        {!result.success && result.error && (
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-red-800 font-medium">
              ❌ Erro na sincronização
            </p>
            <p className="text-red-700 text-sm mt-1">
              {result.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
