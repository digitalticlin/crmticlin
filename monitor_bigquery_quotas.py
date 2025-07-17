#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para monitorar o uso de quotas no BigQuery
Este script ajuda a monitorar e alertar sobre o uso de quotas no BigQuery
"""

import os
import datetime
import time
import argparse
from google.cloud import bigquery
from google.cloud import monitoring_v3

# Configuração de argumentos
parser = argparse.ArgumentParser(description='Monitor BigQuery quotas')
parser.add_argument('--project_id', required=True, help='ID do projeto Google Cloud')
parser.add_argument('--region', default='us', help='Região do BigQuery (default: us)')
parser.add_argument('--threshold', type=int, default=800, help='Limite de alerta para consultas pendentes (default: 800)')
parser.add_argument('--interval', type=int, default=300, help='Intervalo de verificação em segundos (default: 300)')
args = parser.parse_args()

def get_pending_queries_count(client, project_id, region):
    """
    Obtém o número de consultas pendentes no BigQuery
    """
    query = f"""
    SELECT COUNT(*) as pending_count 
    FROM `{region}`.INFORMATION_SCHEMA.JOBS_BY_PROJECT 
    WHERE state = 'PENDING'
    """
    
    try:
        query_job = client.query(query)
        results = query_job.result()
        for row in results:
            return row.pending_count
    except Exception as e:
        print(f"Erro ao obter contagem de consultas pendentes: {e}")
        return None

def create_metric_client(project_id):
    """
    Cria um cliente para a API de métricas do Cloud Monitoring
    """
    return monitoring_v3.MetricServiceClient()

def write_custom_metric(client, project_id, value):
    """
    Escreve uma métrica personalizada no Cloud Monitoring
    """
    project_name = f"projects/{project_id}"
    
    # Define o descritor da métrica
    descriptor = monitoring_v3.MetricDescriptor()
    descriptor.type = "custom.googleapis.com/bigquery/pending_queries"
    descriptor.metric_kind = monitoring_v3.MetricDescriptor.MetricKind.GAUGE
    descriptor.value_type = monitoring_v3.MetricDescriptor.ValueType.INT64
    descriptor.description = "Número de consultas pendentes no BigQuery"
    
    try:
        # Cria o descritor da métrica se não existir
        try:
            client.create_metric_descriptor(
                name=project_name, 
                metric_descriptor=descriptor
            )
        except Exception:
            # Provavelmente o descritor já existe
            pass
        
        # Define o ponto de série temporal
        series = monitoring_v3.TimeSeries()
        series.metric.type = "custom.googleapis.com/bigquery/pending_queries"
        
        # Adiciona o valor
        point = monitoring_v3.Point()
        point.value.int64_value = value
        point.interval.end_time.seconds = int(time.time())
        series.points = [point]
        
        # Escreve a série temporal
        client.create_time_series(
            name=project_name,
            time_series=[series]
        )
        
        print(f"Métrica escrita com sucesso: {value} consultas pendentes")
    except Exception as e:
        print(f"Erro ao escrever métrica: {e}")

def check_and_alert(bq_client, metric_client, project_id, region, threshold):
    """
    Verifica o número de consultas pendentes e alerta se necessário
    """
    pending_count = get_pending_queries_count(bq_client, project_id, region)
    
    if pending_count is None:
        print("Não foi possível obter a contagem de consultas pendentes")
        return
    
    print(f"[{datetime.datetime.now()}] Consultas pendentes: {pending_count}")
    
    # Escreve a métrica no Cloud Monitoring
    write_custom_metric(metric_client, project_id, pending_count)
    
    # Verifica se está próximo do limite
    if pending_count > threshold:
        print(f"ALERTA: O número de consultas pendentes ({pending_count}) está acima do limite ({threshold})!")
        # Aqui você pode implementar um sistema de notificação (e-mail, Slack, etc.)

def main():
    """
    Função principal
    """
    project_id = args.project_id
    region = args.region
    threshold = args.threshold
    interval = args.interval
    
    print(f"Iniciando monitoramento de quotas do BigQuery para o projeto {project_id}")
    print(f"Região: {region}")
    print(f"Limite de alerta: {threshold} consultas pendentes")
    print(f"Intervalo de verificação: {interval} segundos")
    
    # Inicializa os clientes
    bq_client = bigquery.Client(project=project_id)
    metric_client = create_metric_client(project_id)
    
    # Loop principal
    try:
        while True:
            check_and_alert(bq_client, metric_client, project_id, region, threshold)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nMonitoramento interrompido pelo usuário")
    except Exception as e:
        print(f"Erro no monitoramento: {e}")

if __name__ == "__main__":
    main() 