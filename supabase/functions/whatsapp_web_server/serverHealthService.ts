
import { corsHeaders } from './config.ts';
import { makeVPSRequest } from './vpsRequestService.ts';
import { VPS_CONFIG, getVPSHeaders } from './config.ts';

export async function checkServerHealth() {
  try {
    console.log('[Health] Checking WhatsApp Web.js server health...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: getVPSHeaders()
    }, 2);

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            status: data.status || 'online',
            server: data.server,
            version: data.version,
            permanent_mode: data.permanent_mode || false,
            health_check_enabled: data.health_check_enabled || false,
            auto_reconnect_enabled: data.auto_reconnect_enabled || false,
            active_instances: data.active_instances || 0,
            timestamp: data.timestamp || new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Server health check failed: ${response.status}`);
    }

  } catch (error) {
    console.error('[Health] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getServerInfo() {
  try {
    console.log('[Server Info] Getting server information...');
    
    const response = await makeVPSRequest(`${VPS_CONFIG.baseUrl}/status`, {
      method: 'GET',
      headers: getVPSHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            ...data,
            permanent_mode: data.permanent_mode || false,
            auto_reconnect: data.auto_reconnect || false
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Server info request failed: ${response.status}`);
    }

  } catch (error) {
    console.error('[Server Info] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
