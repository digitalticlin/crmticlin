import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { SpreadsheetRow } from '@/types/spreadsheet';

export class SpreadsheetParser {
  static async parseFile(file: File): Promise<SpreadsheetRow[]> {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (fileType === 'csv') {
      return this.parseCSV(file);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      return this.parseExcel(file);
    } else {
      throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX.');
    }
  }

  private static parseCSV(file: File): Promise<SpreadsheetRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => this.normalizeHeader(header),
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Erro ao processar CSV: ${results.errors[0].message}`));
            return;
          }
          
          const rows = results.data as SpreadsheetRow[];
          resolve(rows.filter(row => row.nome && row.telefone));
        },
        error: (error) => {
          reject(new Error(`Erro ao ler arquivo CSV: ${error.message}`));
        }
      });
    });
  }

  private static async parseExcel(file: File): Promise<SpreadsheetRow[]> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Planilha vazia ou sem abas.');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      }) as any[][];
      
      if (jsonData.length < 2) {
        throw new Error('Planilha deve ter pelo menos cabeçalho e uma linha de dados.');
      }
      
      const headers = jsonData[0].map((h: any) => this.normalizeHeader(String(h)));
      const rows: SpreadsheetRow[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i];
        const row: any = {};
        
        headers.forEach((header, index) => {
          const value = rowData[index];
          row[header] = value ? String(value).trim() : undefined;
        });
        
        if (row.nome && row.telefone) {
          rows.push(row as SpreadsheetRow);
        }
      }
      
      return rows;
    } catch (error) {
      throw new Error(`Erro ao processar Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private static normalizeHeader(header: string): string {
    const headerMap: Record<string, string> = {
      'nome': 'nome',
      'name': 'nome',
      'telefone': 'telefone',
      'phone': 'telefone',
      'celular': 'telefone',
      'email': 'email',
      'e-mail': 'email',
      'empresa': 'empresa',
      'company': 'empresa',
      'documento': 'documento',
      'cpf': 'documento',
      'cnpj': 'documento',
      'endereco': 'endereco',
      'endereço': 'endereco',
      'address': 'endereco',
      'bairro': 'bairro',
      'neighborhood': 'bairro',
      'cidade': 'cidade',
      'city': 'cidade',
      'estado': 'estado',
      'state': 'estado',
      'uf': 'estado',
      'cep': 'cep',
      'zipcode': 'cep',
      'zip': 'cep',
      'pais': 'pais',
      'país': 'pais',
      'country': 'pais',
      'observacoes': 'observacoes',
      'observações': 'observacoes',
      'notes': 'observacoes',
      'notas': 'observacoes',
      'tags': 'tags',
      'tag': 'tags',
      'etiquetas': 'tags'
    };

    const normalized = header.toLowerCase().trim().replace(/[^\w\s]/g, '');
    return headerMap[normalized] || normalized;
  }

  static generateTemplate(): string {
    const headers = [
      'Nome',
      'Telefone', 
      'Email',
      'Empresa',
      'Documento',
      'Endereço',
      'Bairro',
      'Cidade',
      'Estado',
      'CEP',
      'País',
      'Observações',
      'Tags'
    ];

    const exampleRows = [
      [
        'João Silva',
        '11999999999',
        'joao@email.com',
        'Tech Corp',
        '12345678901',
        'Rua das Flores, 123',
        'Centro',
        'São Paulo',
        'SP',
        '01234-567',
        'Brasil',
        'Cliente VIP',
        'VIP,Corporativo,Ativo'
      ],
      [
        'Maria Santos',
        '21888888888',
        'maria@startup.com',
        'StartupX',
        '',
        'Av. Copacabana, 456',
        'Copacabana',
        'Rio de Janeiro',
        'RJ',
        '22000-000',
        'Brasil',
        'Lead qualificado',
        'Lead,Startup'
      ],
      [
        'Pedro Costa',
        '11777777777',
        'pedro@email.com',
        '',
        '',
        'Av. Paulista, 789',
        'Bela Vista',
        'São Paulo',
        'SP',
        '01310-100',
        'Brasil',
        '',
        'Pessoa Física'
      ]
    ];

    const csvContent = [headers, ...exampleRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}