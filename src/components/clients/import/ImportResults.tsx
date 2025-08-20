import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, XCircle, Users, Upload, X } from 'lucide-react';
import { ImportResult } from '@/types/spreadsheet';

interface ImportResultsProps {
  result: ImportResult;
  onNewImport: () => void;
  onClose: () => void;
}

export const ImportResults = ({ result, onNewImport, onClose }: ImportResultsProps) => {
  const successRate = result.totalRows > 0 ? (result.successCount / result.totalRows) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Total</p>
              <p className="text-lg font-bold text-blue-800">{result.totalRows}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Importados</p>
              <p className="text-lg font-bold text-green-800">{result.successCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Ignorados</p>
              <p className="text-lg font-bold text-yellow-800">{result.skippedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">Erros</p>
              <p className="text-lg font-bold text-red-800">{result.errorCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className={`border rounded-lg p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? 'Importação Concluída' : 'Importação com Problemas'}
              </h3>
              <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                Taxa de sucesso: {successRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicates */}
      {result.duplicates.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-900">
              Registros Ignorados - Telefones Já Existentes ({result.duplicates.length})
            </h3>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cliente Existente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.duplicates.slice(0, 10).map((duplicate, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{duplicate.row}</TableCell>
                    <TableCell>{duplicate.phone}</TableCell>
                    <TableCell>{duplicate.existingLeadName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {result.duplicates.length > 10 && (
              <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                + {result.duplicates.length - 10} registros adicionais...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-3 border-b border-red-200">
            <h3 className="text-sm font-medium text-red-900">
              Erros de Validação ({result.errors.length})
            </h3>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.errors.slice(0, 10).map((error, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{error.row}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {error.field}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{error.message}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-32 truncate">
                      {error.value || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {result.errors.length > 10 && (
              <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                + {result.errors.length - 10} erros adicionais...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
        <Button onClick={onNewImport} className="bg-blue-600 hover:bg-blue-700">
          <Upload className="h-4 w-4 mr-2" />
          Nova Importação
        </Button>
      </div>
    </div>
  );
};