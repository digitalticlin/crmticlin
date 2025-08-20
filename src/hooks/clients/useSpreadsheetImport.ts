import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { SpreadsheetParser } from '@/utils/spreadsheetParser';
import { LeadValidator } from '@/utils/leadValidator';
import { LeadImporter } from '@/utils/leadImporter';
import { ImportResult, ImportProgress, ProcessedLead } from '@/types/spreadsheet';
import { toast } from 'sonner';

export const useSpreadsheetImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleImport = useCallback(async (file: File) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsImporting(true);
    setProgress({ stage: 'parsing', progress: 0, message: 'Lendo arquivo...' });
    setResult(null);

    try {
      // 1. Parse do arquivo
      setProgress({ stage: 'parsing', progress: 20, message: 'Processando planilha...' });
      const rows = await SpreadsheetParser.parseFile(file);
      
      if (rows.length === 0) {
        throw new Error('Nenhum registro válido encontrado na planilha');
      }

      if (rows.length > 1000) {
        throw new Error('Máximo de 1000 registros por importação');
      }

      // 2. Validação
      setProgress({ stage: 'validating', progress: 40, message: 'Validando dados...' });
      const { validLeads, errors } = LeadValidator.validateAndProcess(rows);

      if (validLeads.length === 0) {
        throw new Error('Nenhum registro válido para importar');
      }

      // 3. Verificar duplicatas internas
      const duplicatePhones = LeadValidator.checkDuplicatePhones(validLeads);
      if (duplicatePhones.size > 0) {
        const duplicateMessages: string[] = [];
        duplicatePhones.forEach((indices, phone) => {
          const rows = indices.map(i => validLeads[i].rowIndex).join(', ');
          duplicateMessages.push(`Telefone ${phone} duplicado nas linhas: ${rows}`);
        });
        
        toast.warning('Telefones duplicados encontrados na planilha', {
          description: `${duplicateMessages.length} telefones duplicados serão ignorados`
        });
      }

      // Remover duplicatas internas (manter apenas a primeira ocorrência)
      const uniqueLeads: ProcessedLead[] = [];
      const seenPhones = new Set<string>();
      
      validLeads.forEach(lead => {
        if (!seenPhones.has(lead.phone)) {
          seenPhones.add(lead.phone);
          uniqueLeads.push(lead);
        }
      });

      // 4. Importação
      const importer = new LeadImporter(user.id, setProgress);
      const importResult = await importer.importLeads(uniqueLeads);

      // Adicionar erros de validação ao resultado
      importResult.errors = [...importResult.errors, ...errors];

      setResult(importResult);

      // 5. Invalidar cache para atualizar lista
      queryClient.invalidateQueries({ queryKey: ["clients", user.id] });

      // 6. Mostrar resultado
      if (importResult.success) {
        toast.success('Importação concluída!', {
          description: `${importResult.successCount} clientes importados com sucesso`
        });

        if (importResult.duplicates.length > 0) {
          toast.info(`${importResult.duplicates.length} registros ignorados por já existirem`);
        }

        if (importResult.errorCount > 0) {
          toast.warning(`${importResult.errorCount} registros com erro`);
        }
      } else {
        toast.error('Erro na importação');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setProgress({ stage: 'error', progress: 0, message: errorMessage });
      
      setResult({
        success: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'geral', message: errorMessage }],
        skippedCount: 0,
        duplicates: []
      });

      toast.error('Erro na importação', {
        description: errorMessage
      });
    } finally {
      setIsImporting(false);
    }
  }, [user?.id, queryClient]);

  const downloadTemplate = useCallback(() => {
    const csvContent = SpreadsheetParser.generateTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-importacao-clientes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template baixado com sucesso!');
  }, []);

  const resetImport = useCallback(() => {
    setProgress(null);
    setResult(null);
    setIsImporting(false);
  }, []);

  return {
    isImporting,
    progress,
    result,
    handleImport,
    downloadTemplate,
    resetImport
  };
};