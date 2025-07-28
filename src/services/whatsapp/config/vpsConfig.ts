
// Updated VPS Configuration using secure config
import { getSecureVpsConfig, getEndpointUrl, getRequestHeaders, formatInstanceEndpoint } from './secureVpsConfig';

// Re-export secure configuration
export const VPS_CONFIG = getSecureVpsConfig();
export { getEndpointUrl, getRequestHeaders, formatInstanceEndpoint };
