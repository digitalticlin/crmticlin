import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
    }

    console.log(`Starting complete account deletion for user: ${userId}`)

    // Get all data related to this user before deletion
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    const createdByUserId = userProfile.created_by_user_id || userId

    // Start deletion process from bottom to top (respecting foreign key constraints)
    // Ordem: Folhas da árvore de dependências primeiro, depois subindo

    // === LEVEL 1: Tabelas sem dependentes (folhas) ===

    // 1. Delete lead tags (depende de leads)
    const { error: leadTagsError } = await supabaseClient
      .from('lead_tags')
      .delete()
      .or(`lead_id.in.(SELECT id FROM leads WHERE created_by_user_id = '${createdByUserId}')`)

    if (leadTagsError) {
      console.error('Error deleting lead tags:', leadTagsError)
    }

    // 2. Delete lead activities (depende de leads)
    const { error: leadActivitiesError } = await supabaseClient
      .from('lead_activities')
      .delete()
      .or(`lead_id.in.(SELECT id FROM leads WHERE created_by_user_id = '${createdByUserId}')`)

    if (leadActivitiesError) {
      console.error('Error deleting lead activities:', leadActivitiesError)
    }

    // 3. Delete messages (depende de leads via sender)
    const { error: messagesError } = await supabaseClient
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},created_by_user_id.eq.${createdByUserId}`)

    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
    }

    // 4. Delete chat sessions
    const { error: chatSessionsError } = await supabaseClient
      .from('chat_sessions')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (chatSessionsError) {
      console.error('Error deleting chat sessions:', chatSessionsError)
    }

    // === LEVEL 2: Tabelas que dependem das do Level 1 ===

    // 5. Delete leads (depois que mensagens e atividades foram deletadas)
    const { error: leadsError } = await supabaseClient
      .from('leads')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (leadsError) {
      console.error('Error deleting leads:', leadsError)
    }

    // === LEVEL 3: Tabelas de configuração do funil ===

    // 6. Delete funnel stages (depois que leads foram deletados)
    const { error: stagesError } = await supabaseClient
      .from('funnel_stages')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (stagesError) {
      console.error('Error deleting funnel stages:', stagesError)
    }

    // 10. Delete sales funnels (depois que stages foram deletados)
    const { error: funnelsError } = await supabaseClient
      .from('sales_funnels')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (funnelsError) {
      console.error('Error deleting sales funnels:', funnelsError)
    }

    // === LEVEL 4: WhatsApp instances (com cleanup da VPS) ===
    // First, get all WhatsApp instances to delete them from VPS
    const { data: whatsappInstances } = await supabaseClient
      .from('whatsapp_instances')
      .select('id, instance_name, vps_instance_id')
      .eq('created_by_user_id', createdByUserId)

    if (whatsappInstances && whatsappInstances.length > 0) {
      console.log(`Found ${whatsappInstances.length} WhatsApp instances to delete`)

      // Delete each instance from VPS using the whatsapp_instance_delete edge function
      for (const instance of whatsappInstances) {
        try {
          console.log(`Deleting WhatsApp instance ${instance.id} from VPS...`)

          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp_instance_delete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              instanceId: instance.id,
              userId: createdByUserId,
              trigger_source: 'account_deletion'
            })
          })

          if (!response.ok) {
            const errorData = await response.text()
            console.error(`Failed to delete WhatsApp instance ${instance.id} from VPS:`, errorData)
          } else {
            const result = await response.json()
            console.log(`WhatsApp instance ${instance.id} deleted from VPS:`, result)
          }
        } catch (vpsError) {
          console.error(`Error calling whatsapp_instance_delete for instance ${instance.id}:`, vpsError)
        }
      }
    }

    // Now delete from database (already handled by the edge function above, but ensure cleanup)
    const { error: instancesError } = await supabaseClient
      .from('whatsapp_instances')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (instancesError) {
      console.error('Error deleting WhatsApp instances from database:', instancesError)
    }

    // === LEVEL 5: Outras configurações do usuário ===

    // Delete tags
    const { error: tagsError } = await supabaseClient
      .from('tags')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (tagsError) {
      console.error('Error deleting tags:', tagsError)
    }

    // Delete AI agent prompts
    const { error: promptsError } = await supabaseClient
      .from('ai_agent_prompts')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (promptsError) {
      console.error('Error deleting AI agent prompts:', promptsError)
    }

    // 8. Delete contacts
    const { error: contactsError } = await supabaseClient
      .from('contacts')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (contactsError) {
      console.error('Error deleting contacts:', contactsError)
    }

    // 9. Delete products
    const { error: productsError } = await supabaseClient
      .from('products')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (productsError) {
      console.error('Error deleting products:', productsError)
    }

    // 10. Delete integrations
    const { error: integrationsError } = await supabaseClient
      .from('integrations')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (integrationsError) {
      console.error('Error deleting integrations:', integrationsError)
    }

    // 11. Delete webhooks
    const { error: webhooksError } = await supabaseClient
      .from('webhooks')
      .delete()
      .eq('created_by_user_id', createdByUserId)

    if (webhooksError) {
      console.error('Error deleting webhooks:', webhooksError)
    }

    // 12. Delete billing data
    const { error: billingError } = await supabaseClient
      .from('billing_subscriptions')
      .delete()
      .eq('user_id', userId)

    if (billingError) {
      console.error('Error deleting billing subscriptions:', billingError)
    }

    const { error: usageError } = await supabaseClient
      .from('billing_usage')
      .delete()
      .eq('user_id', userId)

    if (usageError) {
      console.error('Error deleting billing usage:', usageError)
    }

    const { error: paymentsError } = await supabaseClient
      .from('billing_payments')
      .delete()
      .eq('user_id', userId)

    if (paymentsError) {
      console.error('Error deleting billing payments:', paymentsError)
    }

    // 13. Delete user preferences
    const { error: preferencesError } = await supabaseClient
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)

    if (preferencesError) {
      console.error('Error deleting user preferences:', preferencesError)
    }

    // 14. Delete activity logs
    const { error: activityError } = await supabaseClient
      .from('activity_logs')
      .delete()
      .or(`user_id.eq.${userId},created_by_user_id.eq.${createdByUserId}`)

    if (activityError) {
      console.error('Error deleting activity logs:', activityError)
    }

    // 15. Delete notification preferences
    const { error: notifPrefError } = await supabaseClient
      .from('notification_preferences')
      .delete()
      .eq('user_id', userId)

    if (notifPrefError) {
      console.error('Error deleting notification preferences:', notifPrefError)
    }

    // 16. Delete notifications
    const { error: notificationsError } = await supabaseClient
      .from('notifications')
      .delete()
      .or(`user_id.eq.${userId},created_by_user_id.eq.${createdByUserId}`)

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError)
    }

    // 17. Delete other users created by this user (if admin)
    if (userProfile.role === 'admin') {
      const { data: subUsers } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('created_by_user_id', userId)
        .neq('id', userId)

      if (subUsers && subUsers.length > 0) {
        for (const subUser of subUsers) {
          // Recursively delete sub-users
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/delete_account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({ userId: subUser.id })
          })
        }
      }
    }

    // 18. Finally, delete the profile itself
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      throw new Error(`Error deleting profile: ${profileError.message}`)
    }

    // 19. Delete storage files
    console.log(`Cleaning up storage files for user: ${userId}`)
    try {
      // Lista todos os buckets e limpa arquivos do usuário
      const { data: buckets } = await supabaseClient.storage.listBuckets()

      if (buckets) {
        for (const bucket of buckets) {
          console.log(`Checking bucket: ${bucket.name}`)

          // Lista arquivos do usuário neste bucket
          const { data: files } = await supabaseClient.storage
            .from(bucket.name)
            .list('', {
              limit: 1000,
              search: userId // busca por arquivos que contenham o userId
            })

          if (files && files.length > 0) {
            const filePaths = files.map(file => file.name)
            console.log(`Found ${filePaths.length} files in bucket ${bucket.name}`)

            // Remove arquivos em lotes
            const { error: storageError } = await supabaseClient.storage
              .from(bucket.name)
              .remove(filePaths)

            if (storageError) {
              console.error(`Error deleting files from bucket ${bucket.name}:`, storageError)
            } else {
              console.log(`Deleted ${filePaths.length} files from bucket ${bucket.name}`)
            }
          }
        }
      }
    } catch (storageError) {
      console.error('Error cleaning storage:', storageError)
    }

    // 20. Delete from auth.users (this is the final step)
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      // Don't throw here as the main data is already deleted
    }

    console.log(`Successfully deleted all data for user: ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Account and all related data deleted successfully for user ${userId}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in delete-account function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})