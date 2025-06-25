
import { cleanPhoneNumber } from './phoneService.ts';

export async function processContacts(supabase: any, contacts: any[], instance: any) {
  let contactsImported = 0;
  
  if (!contacts || !Array.isArray(contacts)) {
    console.log(`[Contact Service] ℹ️ No contacts to process`);
    return contactsImported;
  }

  console.log(`[Contact Service] 👥 Processing ${contacts.length} contacts`);
  
  for (const contact of contacts) {
    try {
      const cleanPhone = cleanPhoneNumber(contact.id || contact.phone || '');
      if (!cleanPhone) {
        console.warn(`[Contact Service] ⚠️ Contact without valid phone:`, contact);
        continue;
      }

      // Check if contact already exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', cleanPhone)
        .eq('whatsapp_number_id', instance.id)
        .single();

      if (!existingLead) {
        const { error } = await supabase
          .from('leads')
          .insert({
            phone: cleanPhone,
            name: contact.name || contact.pushname || `Contact-${cleanPhone.substring(cleanPhone.length - 4)}`,
            whatsapp_number_id: instance.id,
            company_id: instance.company_id,
            last_message: 'Imported contact',
            last_message_time: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (!error) {
          contactsImported++;
          console.log(`[Contact Service] ✅ Contact saved: ${cleanPhone}`);
        } else {
          console.error(`[Contact Service] ❌ Error saving contact ${cleanPhone}:`, error);
        }
      } else {
        console.log(`[Contact Service] ℹ️ Contact already exists: ${cleanPhone}`);
      }
    } catch (error: any) {
      console.warn(`[Contact Service] ⚠️ Error processing contact:`, error.message);
    }
  }

  return contactsImported;
}
