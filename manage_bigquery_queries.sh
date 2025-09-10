#!/bin/bash

# Script para monitorar e gerenciar consultas no BigQuery
# Este script ajuda a evitar problemas de quota excedida no BigQuery

# Configurações
PROJECT_ID="seu-projeto-id"
REGION="us"  # Ajuste conforme sua região

# Função para contar consultas pendentes
count_pending_queries() {
  echo "Contando consultas pendentes no projeto $PROJECT_ID na região $REGION..."
  
  # Substitua este comando pelo comando real do BigQuery CLI
  # bq query --project_id=$PROJECT_ID --location=$REGION --format=json \
  #   "SELECT COUNT(*) as pending_count FROM \`$REGION\`.INFORMATION_SCHEMA.JOBS_BY_PROJECT WHERE state = 'PENDING'"
  
  # Por enquanto, apenas simulamos o resultado
  echo "Consultas pendentes: [simulação] 500"
}

# Função para cancelar consultas antigas pendentes se necessário
cancel_old_pending_queries() {
  echo "Cancelando consultas antigas pendentes..."
  
  # Substitua este comando pelo comando real do BigQuery CLI
  # bq query --project_id=$PROJECT_ID --location=$REGION --format=json \
  #   "SELECT job_id FROM \`$REGION\`.INFORMATION_SCHEMA.JOBS_BY_PROJECT 
  #    WHERE state = 'PENDING' AND creation_time < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE)
  #    ORDER BY creation_time ASC LIMIT 50" | jq -r '.[] | .job_id' | while read -r job_id; do
  #     echo "Cancelando job: $job_id"
  #     bq cancel --project_id=$PROJECT_ID --location=$REGION "$job_id"
  # done
  
  echo "Consultas antigas canceladas."
}

# Função para converter consultas para modo batch
convert_to_batch() {
  echo "Convertendo consultas futuras para modo batch..."
  echo "Nota: Isso requer alterações no código que submete as consultas."
  echo "Adicione 'priority: BATCH' nas configurações de consulta."
}

# Função para mostrar recomendações
show_recommendations() {
  echo "Recomendações para evitar problemas de quota no BigQuery:"
  echo "1. Use consultas em lote (batch) em vez de interativas quando possível"
  echo "2. Distribua consultas entre diferentes projetos"
  echo "3. Evite iniciar muitas consultas simultaneamente"
  echo "4. Otimize suas consultas para reduzir o tempo de execução"
  echo "5. Considere usar tabelas materializadas para consultas frequentes"
  echo "6. Implemente um sistema de filas em sua aplicação"
}

# Menu principal
echo "===== Gerenciador de Consultas BigQuery ====="
echo "1. Contar consultas pendentes"
echo "2. Cancelar consultas antigas pendentes"
echo "3. Converter consultas para modo batch"
echo "4. Mostrar recomendações"
echo "5. Sair"

read -p "Escolha uma opção: " option

case $option in
  1) count_pending_queries ;;
  2) cancel_old_pending_queries ;;
  3) convert_to_batch ;;
  4) show_recommendations ;;
  5) echo "Saindo..."; exit 0 ;;
  *) echo "Opção inválida!" ;;
esac 