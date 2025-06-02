
import { VPS_CONFIG, corsHeaders } from './config.ts';
import { ServiceResponse, QRCodeResponse } from './types.ts';

export async function getInstanceStatus(instanceId: string) {
  try {
    console.log('Getting WhatsApp Web.js instance status:', instanceId);

    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId: instanceId
      })
    });

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        status: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting instance status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function getQRCode(instanceId: string) {
  try {
    console.log('Getting QR Code for WhatsApp Web.js instance:', instanceId);

    const response = await fetch(`${VPS_CONFIG.baseUrl}/instance/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      },
      body: JSON.stringify({
        instanceId: instanceId
      })
    });

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        qrCode: result.qrCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting QR code:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function checkServerHealth() {
  try {
    console.log('Checking WhatsApp Web.js server health');

    const response = await fetch(`${VPS_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VPS_CONFIG.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`VPS HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking server health:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
