import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, XCircle, FileText, Users } from 'lucide-react';
import { SpreadsheetParser } from '@/utils/spreadsheetParser';
import { LeadValidator } from '@/utils/leadValidator';
import { SpreadsheetRow, ValidationError } from '@/types/spreadsheet';

interface SpreadsheetPreviewProps {
  file: File;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SpreadsheetPreview = ({ file, onConfirm, onCancel }: SpreadsheetPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        setParseError(null);
        
        // Parse file
        const parsedRows = await SpreadsheetParser.parseFile(file);
        setRows(parsedRows);

        // Validate
        const { errors } = LeadValidator.validateAndProcess(parsedRows);
        setValidationErrors(errors);

      } catch (error) {
        setParseError(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Processando planilha...</p>
        </div>
      </div>
    );
  }

  if (parseError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-900">Erro ao processar arquivo</h3>
        </div>
        <p className="text-red-700 mb-4">{parseError}</p>
        <Button onClick={onCancel} variant="outline">
          Escolher outro arquivo
        </Button>
      </div>
    );
  }

  const validRows = rows.length - validationErrors.filter(e => e.field === 'nome' || e.field === 'telefone').length;
  const hasErrors = validationErrors.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Arquivo</p>
              <p className="text-xs text-blue-700">{file.name}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Registros Válidos</p>
              <p className="text-lg font-bold text-green-800">{validRows}</p>
            </div>
          </div>
        </div>

        <div className={`border rounded-lg p-4 ${hasErrors ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-gray-600" />
            )}
            <div>
              <p className={`text-sm font-medium ${hasErrors ? 'text-yellow-900' : 'text-gray-900'}`}>
                Erros
              </p>
              <p className={`text-lg font-bold ${hasErrors ? 'text-yellow-800' : 'text-gray-800'}`}>
                {validationErrors.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-900 mb-3">
            Erros de Validação ({validationErrors.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {validationErrors.slice(0, 10).map((error, index) => (
              <div key={index} className="text-sm text-yellow-800">
                <span className="font-medium">Linha {error.row}:</span> {error.message}
                {error.value && <span className="text-yellow-600"> (valor: "{error.value}")</span>}
              </div>
            ))}
            {validationErrors.length > 10 && (
              <p className="text-sm text-yellow-700 font-medium">
                + {validationErrors.length - 10} erros adicionais...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Data Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="text-sm font-medium text-gray-900">
            Preview dos Dados (primeiras 5 linhas)
          </h3>
        </div>
        <div className="overflow-x-auto max-h-64">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 5).map((row, index) => {
                const rowErrors = validationErrors.filter(e => e.row === index + 2);
                const hasRowErrors = rowErrors.length > 0;
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{index + 2}</TableCell>
                    <TableCell className={hasRowErrors && rowErrors.some(e => e.field === 'nome') ? 'bg-red-50' : ''}>
                      {row.nome || '-'}
                    </TableCell>
                    <TableCell className={hasRowErrors && rowErrors.some(e => e.field === 'telefone') ? 'bg-red-50' : ''}>
                      {row.telefone || '-'}
                    </TableCell>
                    <TableCell>{row.email || '-'}</TableCell>
                    <TableCell>{row.empresa || '-'}</TableCell>
                    <TableCell>
                      {row.tags && (
                        <div className="flex flex-wrap gap-1">
                          {row.tags.split(',').slice(0, 2).map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                          {row.tags.split(',').length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{row.tags.split(',').length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasRowErrors ? (
                        <Badge variant="destructive" className="text-xs">
                          Erro
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Válido
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="flex gap-3">
          {validRows > 0 && (
            <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
              Importar {validRows} {validRows === 1 ? 'Cliente' : 'Clientes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};