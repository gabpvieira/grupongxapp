# Estratégia de Keep-Alive para Supabase

## 📋 Visão Geral

Esta solução implementa uma estratégia robusta para manter o projeto Supabase sempre ativo, evitando pausas automáticas por inatividade. O sistema funciona de forma completamente autônoma, sem depender do frontend ou acesso de usuários.

## 🏗️ Arquitetura da Solução

### Componentes Implementados:

1. **Tabela de Monitoramento** (`system_heartbeat`)
2. **Funções SQL** para execução e monitoramento
3. **Edge Function** para execução via HTTP
4. **Cron Jobs** para automação
5. **Sistema de Limpeza** automática

## 📊 Tabela `system_heartbeat`

```sql
CREATE TABLE system_heartbeat (
    id BIGSERIAL PRIMARY KEY,
    last_execution_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'cron',
    execution_count BIGINT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único
- `last_execution_at`: Timestamp da última execução
- `source`: Origem da execução (cron, edge_function, manual)
- `execution_count`: Contador de execuções
- `metadata`: Dados adicionais em JSON
- `created_at/updated_at`: Timestamps de controle

## 🔧 Funções Principais

### `execute_system_heartbeat()`
Função principal que registra atividade no banco:

```sql
SELECT execute_system_heartbeat('cron_daily', '{"scheduled": true}'::jsonb);
```

### `get_heartbeat_status()`
Retorna status de todos os sources de heartbeat:

```sql
SELECT * FROM get_heartbeat_status();
```

### `is_system_healthy()`
Verifica se o sistema está saudável:

```sql
SELECT * FROM is_system_healthy();
```

### `cleanup_old_heartbeats()`
Limpa registros antigos (mantém 90 dias):

```sql
SELECT cleanup_old_heartbeats(90);
```

## ⏰ Cron Jobs Configurados

### 1. Heartbeat Principal
- **Nome**: `system-heartbeat-daily`
- **Frequência**: A cada 12 horas (00:00 e 12:00)
- **Comando**: `SELECT execute_system_heartbeat('cron_daily', '{"scheduled": true, "interval": "12h"}'::jsonb);`

### 2. Limpeza Automática
- **Nome**: `system-heartbeat-cleanup`
- **Frequência**: Todo dia 1 do mês às 02:00
- **Comando**: `SELECT cleanup_old_heartbeats(90);`

## 🌐 Edge Function

### Localização
`supabase/functions/system-heartbeat/index.ts`

### Uso
```bash
# Deploy da função
supabase functions deploy system-heartbeat

# Teste manual
curl -X POST https://your-project.supabase.co/functions/v1/system-heartbeat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual_test"}'
```

## 📈 Monitoramento

### Dashboard View
```sql
SELECT * FROM v_heartbeat_dashboard;
```

### Verificação de Status
```sql
-- Status detalhado
SELECT * FROM get_heartbeat_status();

-- Saúde geral
SELECT * FROM is_system_healthy();

-- Últimas execuções
SELECT * FROM system_heartbeat ORDER BY last_execution_at DESC LIMIT 10;
```

## 🚀 Como Funciona

1. **Cron Job Principal**: Executa a cada 12 horas, registrando atividade no banco
2. **Registro de Atividade**: Cada execução atualiza a tabela `system_heartbeat`
3. **Monitoramento**: Funções permitem verificar se o sistema está ativo
4. **Limpeza**: Remove registros antigos mensalmente para evitar crescimento desnecessário
5. **Edge Function**: Permite execução manual ou via webhooks externos

## ✅ Validação de Funcionamento

### Verificar se está funcionando:
```sql
-- Deve mostrar execuções recentes
SELECT * FROM get_heartbeat_status();

-- Deve retornar is_healthy = true
SELECT * FROM is_system_healthy();

-- Verificar cron jobs ativos
SELECT * FROM cron.job WHERE active = true;
```

### Indicadores de Sucesso:
- ✅ `is_healthy = true`
- ✅ `hours_since_last < 24`
- ✅ `active_sources > 0`
- ✅ Cron jobs com `active = true`

## 🔒 Segurança

- Funções usam `SECURITY DEFINER` para execução com privilégios adequados
- Edge Function usa Service Role Key para acesso ao banco
- Limpeza automática previne crescimento descontrolado de dados
- Logs estruturados para auditoria

## 🛠️ Manutenção

### Comandos Úteis:

```sql
-- Executar heartbeat manual
SELECT execute_system_heartbeat('manual', '{"executed_by": "admin"}'::jsonb);

-- Verificar últimas execuções
SELECT * FROM system_heartbeat ORDER BY last_execution_at DESC LIMIT 5;

-- Limpar registros antigos manualmente
SELECT cleanup_old_heartbeats(30);

-- Verificar cron jobs
SELECT jobname, schedule, active FROM cron.job;
```

### Troubleshooting:

1. **Sistema inativo**: Verificar se cron jobs estão ativos
2. **Muitos registros**: Executar limpeza manual
3. **Edge Function falhando**: Verificar logs no Supabase Dashboard

## 📋 Checklist de Deploy

- [x] Tabela `system_heartbeat` criada
- [x] Funções SQL implementadas
- [x] Cron jobs configurados
- [x] Edge Function deployada
- [x] Sistema de limpeza ativo
- [x] Monitoramento funcionando

## 🎯 Resultado Esperado

Com esta implementação, seu projeto Supabase:
- ✅ **Nunca entrará em pausa** por inatividade
- ✅ **Registra atividade a cada 12 horas** automaticamente
- ✅ **Mantém histórico** de execuções para auditoria
- ✅ **Limpa dados antigos** automaticamente
- ✅ **Permite monitoramento** em tempo real
- ✅ **Funciona independentemente** do frontend

A solução é **robusta, escalável e de baixo custo**, garantindo que seu projeto permaneça sempre ativo! 🚀