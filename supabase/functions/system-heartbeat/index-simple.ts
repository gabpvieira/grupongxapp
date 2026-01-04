// Supabase Edge Function - Versão Simplificada
// Mantém o projeto ativo executando heartbeats periódicos

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Função principal
async function handleRequest(request: Request): Promise<Response> {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Pega variáveis de ambiente
    const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL')
    const serviceKey = (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing environment variables')
    }

    // Parse request body
    let body = {}
    if (request.method === 'POST') {
      try {
        const text = await request.text()
        if (text) body = JSON.parse(text)
      } catch (e) {
        console.warn('Could not parse body:', e)
      }
    }

    const { source = 'edge_function', metadata = {} } = body as any

    // Enriquece metadata
    const enrichedMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      method: request.method,
      user_agent: request.headers.get('user-agent') || 'unknown'
    }

    console.log(`Heartbeat: ${source}`)

    // Chama a função RPC
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_system_heartbeat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        p_source: source,
        p_metadata: enrichedMetadata
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`RPC failed: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const result = data[0] || {}

    return new Response(JSON.stringify({
      success: true,
      heartbeat_id: result.heartbeat_id,
      execution_time: result.execution_time,
      total_executions: result.total_executions,
      message: result.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Inicia o servidor
(globalThis as any).Deno.serve(handleRequest)