#!/bin/bash

# Script para testar a Edge Function de heartbeat
# Execute este script para testar a função localmente e em produção

PROJECT_REF="tlxlzucmbamkfqlskohc"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/system-heartbeat"

echo "🧪 Testando Edge Function system-heartbeat..."
echo "📍 URL: $FUNCTION_URL"
echo ""

# Função para testar com diferentes payloads
test_heartbeat() {
    local test_name="$1"
    local payload="$2"
    local expected_status="$3"
    
    echo "🔍 Teste: $test_name"
    echo "📦 Payload: $payload"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
        -H "Authorization: Bearer YOUR_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    # Separa o corpo da resposta do código HTTP
    body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    echo "📊 Status: $status_code"
    echo "📄 Response: $body"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ Teste passou!"
    else
        echo "❌ Teste falhou! Esperado: $expected_status, Recebido: $status_code"
    fi
    echo "----------------------------------------"
}

# Testes
echo "🚀 Iniciando testes..."
echo ""

# Teste 1: Payload básico
test_heartbeat "Payload Básico" '{"source": "test_basic"}' "200"

# Teste 2: Payload com metadata
test_heartbeat "Com Metadata" '{"source": "test_metadata", "metadata": {"test": true, "version": "1.0"}}' "200"

# Teste 3: Payload vazio (deve usar defaults)
test_heartbeat "Payload Vazio" '{}' "200"

# Teste 4: GET request (sem payload)
echo "🔍 Teste: GET Request"
echo "📦 Método: GET"

response=$(curl -s -w "\n%{http_code}" -X GET "$FUNCTION_URL" \
    -H "Authorization: Bearer YOUR_ANON_KEY")

body=$(echo "$response" | head -n -1)
status_code=$(echo "$response" | tail -n 1)

echo "📊 Status: $status_code"
echo "📄 Response: $body"

if [ "$status_code" = "200" ]; then
    echo "✅ Teste passou!"
else
    echo "❌ Teste falhou! Esperado: 200, Recebido: $status_code"
fi
echo "----------------------------------------"

# Teste 5: OPTIONS request (CORS)
echo "🔍 Teste: CORS Preflight"
echo "📦 Método: OPTIONS"

response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$FUNCTION_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: authorization, content-type")

body=$(echo "$response" | head -n -1)
status_code=$(echo "$response" | tail -n 1)

echo "📊 Status: $status_code"
echo "📄 Response: $body"

if [ "$status_code" = "200" ]; then
    echo "✅ CORS funcionando!"
else
    echo "❌ CORS com problema! Status: $status_code"
fi

echo ""
echo "🏁 Testes concluídos!"
echo ""
echo "📝 Para usar em produção, substitua 'YOUR_ANON_KEY' pela sua chave real:"
echo "   - Anon Key: Para chamadas públicas"
echo "   - Service Role Key: Para chamadas administrativas"
echo ""
echo "🔗 Documentação: https://supabase.com/docs/guides/functions"