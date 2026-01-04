#!/bin/bash

# Script para deploy da Edge Function de heartbeat
# Execute este script para fazer deploy da função no Supabase

PROJECT_REF="tlxlzucmbamkfqlskohc"

echo "🚀 Fazendo deploy da Edge Function system-heartbeat..."

# Verifica se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com:"
    echo "npm install -g supabase"
    exit 1
fi

# Verifica se está logado no Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Não está logado no Supabase. Execute:"
    echo "supabase login"
    exit 1
fi

# Verifica se o arquivo da função existe
if [ ! -f "supabase/functions/system-heartbeat/index.ts" ]; then
    echo "❌ Arquivo da função não encontrado: supabase/functions/system-heartbeat/index.ts"
    exit 1
fi

# Deploy da função
echo "📦 Fazendo deploy da função..."
supabase functions deploy system-heartbeat --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
    echo "✅ Deploy realizado com sucesso!"
    echo ""
    echo "🔗 URL da função:"
    echo "https://$PROJECT_REF.supabase.co/functions/v1/system-heartbeat"
    echo ""
    echo "🧪 Teste a função com:"
    echo "curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/system-heartbeat \\"
    echo "  -H \"Authorization: Bearer YOUR_ANON_KEY\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"source\": \"manual_test\"}'"
    echo ""
    echo "📊 Monitore o status com:"
    echo "SELECT * FROM get_heartbeat_status();"
    echo ""
    echo "🔧 Para testar automaticamente, execute:"
    echo "./test-heartbeat-function.sh"
    echo ""
    echo "⚠️  Lembre-se de:"
    echo "   1. Substituir YOUR_ANON_KEY pela sua chave real"
    echo "   2. Verificar se as variáveis de ambiente estão configuradas no Supabase Dashboard"
    echo "   3. Testar a função após o deploy"
else
    echo "❌ Erro no deploy da função"
    echo ""
    echo "🔍 Possíveis causas:"
    echo "   - Não está logado no Supabase CLI"
    echo "   - Projeto não encontrado"
    echo "   - Erro de sintaxe no código TypeScript"
    echo "   - Problemas de rede"
    echo ""
    echo "💡 Tente:"
    echo "   1. supabase login"
    echo "   2. supabase projects list"
    echo "   3. Verificar o código em supabase/functions/system-heartbeat/index.ts"
    exit 1
fi