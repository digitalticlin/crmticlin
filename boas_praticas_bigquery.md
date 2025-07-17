# Boas Práticas para o BigQuery

## Evitando Problemas de Quota Excedida

### Problema Identificado
Recentemente, enfrentamos o seguinte erro no BigQuery:

```
{
  "code": 403,
  "errors": [
    {
      "domain": "usageLimits",
      "message": "Quota exceeded: Your project_and_region exceeded quota for max number of jobs that can be queued per project.",
      "reason": "quotaExceeded"
    }
  ],
  "message": "Quota exceeded: Your project_and_region exceeded quota for max number of jobs that can be queued per project.",
  "status": "PERMISSION_DENIED"
}
```

Este erro ocorre quando um projeto tenta enfileirar mais consultas interativas ou em lote do que o limite de fila permite. O BigQuery tem limites específicos:
- 1.000 consultas interativas por projeto por região
- 20.000 consultas em lote por projeto por região

### Recomendações para Evitar o Problema

#### 1. Gerenciamento de Consultas
- **Priorize consultas em lote**: Use `priority: BATCH` para consultas que não precisam de resultados imediatos
- **Distribua consultas ao longo do tempo**: Evite iniciar muitas consultas simultaneamente
- **Implemente um sistema de filas na aplicação**: Controle o número de consultas enviadas ao BigQuery

#### 2. Otimização de Consultas
- **Simplifique consultas complexas**: Divida consultas grandes em partes menores
- **Use tabelas materializadas**: Para consultas frequentes, materialize os resultados
- **Evite junções desnecessárias**: Use colunas aninhadas e repetidas quando apropriado
- **Limite o uso de CTEs recursivas**: Prefira tabelas temporárias para cálculos intermediários

#### 3. Arquitetura de Dados
- **Particione tabelas apropriadamente**: Reduza a quantidade de dados escaneados
- **Use clustering**: Melhore a eficiência das consultas com colunas frequentemente filtradas
- **Considere o uso de BigQuery BI Engine**: Para dashboards e relatórios interativos

#### 4. Monitoramento e Alertas
- **Monitore o uso de quotas**: Use o Cloud Monitoring para acompanhar o número de consultas
- **Configure alertas**: Seja notificado quando estiver se aproximando dos limites
- **Analise padrões de uso**: Identifique picos de uso e otimize conforme necessário

#### 5. Estratégias Organizacionais
- **Distribua cargas entre projetos**: Use múltiplos projetos para cargas de trabalho distintas
- **Considere reservas de slots**: Para cargas de trabalho previsíveis e consistentes
- **Implemente políticas de uso**: Estabeleça diretrizes para equipes sobre uso eficiente

### Implementação Prática

1. **Auditoria de Consultas**
   - Identifique consultas frequentes que podem ser otimizadas
   - Analise padrões de uso para identificar picos

2. **Modificações de Código**
   - Adicione lógica de retry com backoff exponencial
   - Implemente controle de concorrência para limitar consultas simultâneas

3. **Educação da Equipe**
   - Compartilhe estas boas práticas com todos os desenvolvedores
   - Realize revisões de código focadas em eficiência de consultas

### Recursos Adicionais
- [Documentação de Quotas e Limites do BigQuery](https://cloud.google.com/bigquery/quotas)
- [Troubleshooting de Erros de Quota](https://cloud.google.com/bigquery/docs/troubleshoot-quotas)
- [Otimização de Consultas no BigQuery](https://cloud.google.com/bigquery/docs/best-practices-performance-overview) 