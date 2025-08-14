
import React, { useState } from 'react';
import { useWhatsAppInstances } from '@/hooks/whatsapp/useWhatsAppInstances';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';

export function MessageFlowTester() {
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const { instances } = useWhatsAppInstances();
  
  const { contacts } = useWhatsAppContacts({
    activeInstanceId: selectedInstance || null
  });

  return (
    <div>
      <h2>Message Flow Tester</h2>
      
      <div>
        <label htmlFor="instanceSelect">Select Instance:</label>
        <select
          id="instanceSelect"
          value={selectedInstance}
          onChange={(e) => setSelectedInstance(e.target.value)}
        >
          <option value="">Select an instance</option>
          {instances?.map((instance) => (
            <option key={instance.id} value={instance.id}>
              {instance.instance_name || instance.id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Contacts for Instance: {selectedInstance}</h3>
        {contacts ? (
          <ul>
            {contacts.map((contact) => (
              <li key={contact.id}>{contact.name}</li>
            ))}
          </ul>
        ) : (
          <p>No contacts available or instance not selected.</p>
        )}
      </div>
    </div>
  );
}
