
export async function handleQREvent(supabase: any, instanceId: string, data: any) {
  console.log('Handling QR event for instance:', instanceId);
  console.log('QR data:', data);
  
  try {
    const { data: updateResult, error } = await supabase
      .from('whatsapp_instances')
      .update({
        qr_code: data.qr,
        web_status: 'waiting_scan',
        connection_status: 'connecting'
      })
      .eq('vps_instance_id', instanceId)
      .select();

    if (error) {
      console.error('Error updating QR code:', error);
      throw error;
    }

    console.log('QR code updated successfully:', updateResult);
  } catch (error) {
    console.error('Failed to handle QR event:', error);
    throw error;
  }
}
