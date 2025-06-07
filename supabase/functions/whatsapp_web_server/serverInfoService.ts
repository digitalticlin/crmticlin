
import { makeVPSRequest } from './vpsRequest.ts';

export async function getServerInfo(supabase: any) {
  try {
    const vpsResponse = await makeVPSRequest('/info', 'GET');
    
    return {
      success: vpsResponse.success,
      server_info: vpsResponse.data,
      error: vpsResponse.error
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
