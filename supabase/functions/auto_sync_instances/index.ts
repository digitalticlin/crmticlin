
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Edge Function DESATIVADA temporariamente para evitar:
// - Reativação de instâncias excluídas
// - Vinculação a usuários incorretos
// - Problemas de multitenant

serve(async (req) => {
  console.log('Auto Sync Instances - FUNÇÃO DESATIVADA')
  
  // Função desativada - apenas retorna sucesso
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Auto sync desativado temporariamente - não reativa instâncias",
      status: "disabled",
      instances_processed: 0
    }),
    { 
      headers: { "Content-Type": "application/json" },
      status: 200
    },
  )
})
