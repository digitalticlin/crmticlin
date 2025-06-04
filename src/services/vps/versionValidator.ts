
export class VersionValidator {
  // CORREÇÃO: Função de validação de versão atualizada para aceitar 3.5.0
  static isValidVersion(versionString: string): boolean {
    if (!versionString) return false;
    
    // Lista de versões válidas atualizada
    const validVersions = [
      '3.5.0', // CORREÇÃO: Versão atual da VPS - VÁLIDA
      '3.4.0',
      '3.3.0',
      '3.2.0',
      '3.1.0',
      '3.0.0'
    ];
    
    // Verificar se é uma versão exata conhecida
    if (validVersions.includes(versionString)) {
      return true;
    }

    // Verificar padrão semver e aceitar todas as versões 3.x
    const semverPattern = /^(\d+)\.(\d+)\.(\d+)$/;
    const match = versionString.match(semverPattern);
    
    if (!match) return false;
    
    const [, major] = match;
    const majorNum = parseInt(major);
    
    // CORREÇÃO: Aceitar todas as versões 3.x como válidas
    return majorNum >= 3;
  }
}
