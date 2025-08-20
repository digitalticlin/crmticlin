export interface SpreadsheetRow {
  nome: string;
  telefone: string;
  email?: string;
  empresa?: string;
  documento?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
  observacoes?: string;
  tags?: string;
}

export interface ProcessedLead {
  name: string;
  phone: string;
  email?: string | null;
  company?: string | null;
  document_id?: string | null;
  address?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string | null;
  notes?: string | null;
  tags: string[];
  rowIndex: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ValidationError[];
  skippedCount: number;
  duplicates: Array<{
    row: number;
    phone: string;
    existingLeadName: string;
  }>;
}

export interface ImportProgress {
  stage: 'parsing' | 'validating' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  currentRow?: number;
  totalRows?: number;
}