// Supabase Edge Function - Versão Simplificada
// Mantém o projeto ativo executando heartbeats periódicos

/// <reference types="https://deno.land/types/index.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface HeartbeatResponse {
  success: boolean
  heartbeat_id?: number
  execution_time?: string
  total_executions?: number
  message?: string
  error?: string
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
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    // Parse request body
    let requestData: any = {}
    if (request.method === 'POST') {
      try {
        const text = await request.text()
        if (text.trim()) {
          requestData = JSON.parse(text)
        }
      } catch (parseError) {
        console.warn('Could not parse request body, using defaults:', parseError)
      }
    }

    const { source = 'edge_function', metadata = {} } = requestData

    // Enriquece metadata
    const enrichedMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      method: request.method,
      user_agent: request.headers.get('user-agent') || 'unknown',
      function_version: '1.0.3',
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }

    console.log(`Executing heartbeat for source: ${source}`)

    // Chama a função RPC do Supabase
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_system_heartbeat`, {
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

    if (!rpcResponse.ok) {
      const errorText = await rpcResponse.text()
      throw new Error(`Database RPC failed: ${rpcResponse.status} - ${errorText}`)
    }

    const data = await rpcResponse.json()

    if (!data || data.length === 0) {
      throw new Error('No data returned from heartbeat function')
    }

    const result = data[0]
    
    console.log(`Heartbeat successful:`, result)

    const response: HeartbeatResponse = {
      success: true,
      heartbeat_id: result?.heartbeat_id,
      execution_time: result?.execution_time,
      total_executions: result?.total_executions,
      message: result?.message
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Heartbeat function error:', error)
    
    const errorResponse: HeartbeatResponse = {
      success: false,
      error: error.message || 'Unknown error occurred'
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Inicia o servidor Deno
(globalThis as any).Deno.serve(handleRequest)