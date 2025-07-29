
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vpsToken = Deno.env.get("VPS_API_TOKEN")!;

// Input validation helper
function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  // Add specific validation based on action
  if (data.action === 'create_instance' && (!data.instanceName || data.instanceName.length > 50)) {
    return { valid: false, error: 'Invalid instance name' };
  }
  
  if (data.phone && !/^\+?[1-9]\d{1,14}$/.test(data.phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  return { valid: true };
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const clientIP = req.headers.get("x-forwarded-for") || "unknown";
  
  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Rate limit exceeded" 
    }), {
      status: 429,
      headers: corsHeaders
    });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Authentication required" 
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid authentication" 
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const requestData = await req.json();
    const validation = validateInput(requestData);
    
    if (!validation.valid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: validation.error 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const { action, ...params } = requestData;
    
    // Security: Verify user has permission to perform this action
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Insufficient permissions" 
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Handle different actions securely
    let result;
    switch (action) {
      case 'create_instance':
        result = await createWhatsAppInstance(params, user.id);
        break;
      case 'get_qr_code':
        result = await getQRCode(params, user.id);
        break;
      case 'send_message':
        result = await sendMessage(params, user.id);
        break;
      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Invalid action" 
        }), {
          status: 400,
          headers: corsHeaders
        });
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Secure WhatsApp Service Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Internal server error" 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

async function createWhatsAppInstance(params: any, userId: string) {
  try {
    const response = await fetch(`http://31.97.163.57:3001/instances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
      },
      body: JSON.stringify({
        instanceName: params.instanceName,
        webhookUrl: `https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web`,
        userId: userId
      })
    });

    if (!response.ok) {
      throw new Error(`VPS error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Create instance error:', error);
    return { success: false, error: 'Failed to create instance' };
  }
}

async function getQRCode(params: any, userId: string) {
  try {
    const response = await fetch(`http://31.97.163.57:3001/instance/${params.instanceId}/qr`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vpsToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`VPS error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Get QR code error:', error);
    return { success: false, error: 'Failed to get QR code' };
  }
}

async function sendMessage(params: any, userId: string) {
  try {
    // Additional validation for message sending
    if (!params.phone || !params.message) {
      return { success: false, error: 'Phone and message are required' };
    }

    const response = await fetch(`http://31.97.163.57:3001/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${vpsToken}`,
      },
      body: JSON.stringify({
        instanceId: params.instanceId,
        phone: params.phone,
        message: params.message,
        userId: userId
      })
    });

    if (!response.ok) {
      throw new Error(`VPS error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: 'Failed to send message' };
  }
}
