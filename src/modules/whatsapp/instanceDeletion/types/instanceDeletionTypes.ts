
export interface DeleteInstanceParams {
  instanceId: string;
}

export interface DeleteInstanceResult {
  success: boolean;
  error?: string;
  details?: any;
}
