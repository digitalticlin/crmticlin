import { SpreadsheetRow, ProcessedLead, ValidationError } from '@/types/spreadsheet';

export class LeadValidator {
  static validateAndProcess(rows: SpreadsheetRow[]): {
    validLeads: ProcessedLead[];
    errors: ValidationError[];
  } {
    const validLeads: ProcessedLead[] = [];
    const errors: ValidationError[] = [];

    rows.forEach((row, index) => {
      const rowIndex = index + 2; // +2 porque começamos do índice 0 e há cabeçalho
      const rowErrors = this.validateRow(row, rowIndex);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        const processedLead = this.processRow(row, rowIndex);
        validLeads.push(processedLead);
      }
    });

    return { validLeads, errors };
  }

  private static validateRow(row: SpreadsheetRow, rowIndex: number): ValidationError[] {
    const errors: ValidationError[] = [];

    // Nome obrigatório
    if (!row.nome || row.nome.trim().length === 0) {
      errors.push({
        row: rowIndex,
        field: 'nome',
        message: 'Nome é obrigatório',
        value: row.nome
      });
    }

    // Telefone obrigatório
    if (!row.telefone || row.telefone.trim().length === 0) {
      errors.push({
        row: rowIndex,
        field: 'telefone',
        message: 'Telefone é obrigatório',
        value: row.telefone
      });
    } else {
      // Validar formato do telefone
      const phoneClean = row.telefone.replace(/\D/g, '');
      if (phoneClean.length < 10 || phoneClean.length > 13) {
        errors.push({
          row: rowIndex,
          field: 'telefone',
          message: 'Telefone deve ter entre 10 e 13 dígitos',
          value: row.telefone
        });
      }
    }

    // Email válido (se preenchido)
    if (row.email && row.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email.trim())) {
        errors.push({
          row: rowIndex,
          field: 'email',
          message: 'Email inválido',
          value: row.email
        });
      }
    }

    // Validar CEP (se preenchido)
    if (row.cep && row.cep.trim().length > 0) {
      const cepClean = row.cep.replace(/\D/g, '');
      if (cepClean.length !== 8) {
        errors.push({
          row: rowIndex,
          field: 'cep',
          message: 'CEP deve ter 8 dígitos',
          value: row.cep
        });
      }
    }

    return errors;
  }

  private static processRow(row: SpreadsheetRow, rowIndex: number): ProcessedLead {
    return {
      name: row.nome.trim(),
      phone: this.formatPhone(row.telefone),
      email: this.processOptionalField(row.email),
      company: this.processOptionalField(row.empresa),
      document_id: this.processOptionalField(row.documento),
      address: this.processOptionalField(row.endereco),
      bairro: this.processOptionalField(row.bairro),
      cidade: this.processOptionalField(row.cidade),
      estado: this.processOptionalField(row.estado),
      cep: this.formatCEP(row.cep),
      pais: this.processOptionalField(row.pais) || 'Brasil',
      notes: this.processOptionalField(row.observacoes),
      tags: this.processTags(row.tags),
      rowIndex
    };
  }

  private static processOptionalField(value?: string): string | null {
    if (!value || value.trim().length === 0) {
      return null;
    }
    return value.trim();
  }

  private static formatPhone(phone: string): string {
    const phoneClean = phone.replace(/\D/g, '');
    
    // Adicionar código do país se necessário
    if (phoneClean.length === 10 || phoneClean.length === 11) {
      return `55${phoneClean}`;
    }
    
    return phoneClean;
  }

  private static formatCEP(cep?: string): string | null {
    if (!cep || cep.trim().length === 0) {
      return null;
    }
    
    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length === 8) {
      return `${cepClean.slice(0, 5)}-${cepClean.slice(5)}`;
    }
    
    return cep.trim();
  }

  private static processTags(tags?: string): string[] {
    if (!tags || tags.trim().length === 0) {
      return [];
    }
    
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.toLowerCase());
  }

  static checkDuplicatePhones(leads: ProcessedLead[]): Map<string, number[]> {
    const phoneMap = new Map<string, number[]>();
    
    leads.forEach((lead, index) => {
      const phone = lead.phone;
      if (!phoneMap.has(phone)) {
        phoneMap.set(phone, []);
      }
      phoneMap.get(phone)!.push(index);
    });
    
    // Retornar apenas telefones duplicados
    const duplicates = new Map<string, number[]>();
    phoneMap.forEach((indices, phone) => {
      if (indices.length > 1) {
        duplicates.set(phone, indices);
      }
    });
    
    return duplicates;
  }
}