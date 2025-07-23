import requests
import base64
import json
from datetime import datetime

def process_missing_media():
    print('🔄 Processando mídia específica...')
    
    # Dados da mídia
    message_id = '2740b624-049f-4cce-9687-398f83ae5af5'
    external_message_id = '3F0F27507AC2ABF9489F'
    media_url = 'https://mmg.whatsapp.net/o1/v/t24/f2/m239/AQPPxUStq17xgiROOZPOYVIfSl1kCUp_KInWAsXJ_NsPpNnsSn-FoX4yxPtntVo2_GdTnOzHdr2B8f1DiKOk7LsGxdBmaqXHhmABGvRXkw?ccb=9-4&oh=01_Q5Aa2AEPzQGzoykWNoUfzl9wBTBOOFugNlgp87tcnbe7GMCL-g&oe=68A85265&_nc_sid=e6ed6c&mms3=true'
    
    # Headers do Supabase
    supabase_url = 'https://rhjgagzstjzynvrakdyj.supabase.co'
    supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdnZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTQ4MTM1OSwiZXhwIjoyMDUxMDU3MzU5fQ.xvJDW0TBf8cEwZB_tOZYKnZWWCOsOGh0n6u6MKJLl8w'
    
    headers = {
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'apikey': supabase_key
    }
    
    try:
        # 1. Download da mídia
        print('📥 Fazendo download...')
        response = requests.get(media_url, timeout=30)
        response.raise_for_status()
        
        media_bytes = response.content
        file_size = len(media_bytes)
        
        print(f'📊 Mídia baixada: {file_size / 1024:.1f}KB')
        
        # 2. Converter para base64
        base64_data = base64.b64encode(media_bytes).decode('utf-8')
        print(f'🔄 Base64 gerado: {len(base64_data)} caracteres')
        
        # 3. Inserir no media_cache via REST API
        print('💾 Inserindo no media_cache...')
        
        cache_data = {
            'message_id': message_id,
            'external_message_id': external_message_id,
            'original_url': media_url,
            'base64_data': base64_data,
            'file_name': f'{external_message_id}_image',
            'file_size': file_size,
            'media_type': 'image'
        }
        
        response = requests.post(
            f'{supabase_url}/rest/v1/media_cache',
            headers=headers,
            json=cache_data
        )
        
        if response.status_code == 201:
            print('✅ Media cache inserido com sucesso!')
            print(f'📋 Message ID: {message_id}')
            print(f'📋 External ID: {external_message_id}')
            print(f'📋 Base64 length: {len(base64_data)}')
            print(f'📋 File size: {file_size} bytes')
            return True
        else:
            print(f'❌ Erro na inserção: {response.status_code}')
            print(f'Resposta: {response.text}')
            return False
            
    except Exception as error:
        print(f'❌ Erro: {str(error)}')
        return False

if __name__ == '__main__':
    process_missing_media() 