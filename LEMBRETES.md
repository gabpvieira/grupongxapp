# Sistema de Lembretes - NGX Growth App

## 📋 Visão Geral

O sistema de lembretes foi implementado para enviar notificações push via webhook nos horários definidos para as tarefas. O sistema verifica automaticamente os lembretes e envia notificações em diferentes momentos:

- **Na hora exata** do lembrete
- **5 minutos antes** do horário
- **15 minutos antes** do horário  
- **30 minutos antes** do horário
- **1 hora antes** do horário

## 🔧 Configuração

### 1. Configurar URL do Webhook

Edite o arquivo `.env` e configure a URL do seu webhook:

```env
VITE_WEBHOOK_URL=https://seu-webhook.com/endpoint
```

**Exemplo com webhook.site para testes:**
```env
VITE_WEBHOOK_URL=https://webhook.site/your-unique-id
```

### 2. Estrutura do Banco de Dados

O sistema utiliza as seguintes colunas na tabela `tarefas`:

- `hora_lembrete` (time): Horário do lembrete no formato HH:mm:ss
- `reminder` (varchar): Campo auxiliar (não utilizado atualmente)
- `lembrete_enviado` (boolean): Controla se o lembrete já foi enviado
- `data_vencimento` (date): Data da tarefa

## 📱 Como Usar

### 1. Definir Lembrete em uma Tarefa

1. Acesse a página de **Tarefas**
2. Crie uma nova tarefa ou edite uma existente
3. No campo "Lembrete", digite o horário no formato **HH:mm** (ex: 14:30)
4. Salve a tarefa

### 2. Funcionamento Automático

- O sistema verifica automaticamente a cada **1 minuto** se há lembretes para enviar
- Apenas tarefas com data de vencimento **hoje** são verificadas
- Lembretes são enviados apenas uma vez por tarefa

## 🔔 Payload do Webhook

Quando um lembrete é acionado, o seguinte payload é enviado para o webhook:

```json
{
  "taskId": "uuid-da-tarefa",
  "taskTitle": "Título da Tarefa",
  "dueDate": "2024-01-15",
  "reminderTime": "14:30:00",
  "reminderType": "on_time",
  "message": "🔔 Lembrete: \"Título da Tarefa\" - Horário do lembrete chegou! (14:30:00)",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "source": "NGX Growth App"
}
```

### Tipos de Lembrete (`reminderType`)

- `on_time`: Exatamente no horário definido
- `5_min_before`: 5 minutos antes
- `15_min_before`: 15 minutos antes  
- `30_min_before`: 30 minutos antes
- `1_hour_before`: 1 hora antes

## 🛠️ Arquitetura Técnica

### Componentes Principais

1. **`useReminders.ts`**: Hook principal que gerencia o sistema
2. **`TimeInput.tsx`**: Componente de input para horário HH:mm
3. **Integração no `App.tsx`**: Inicialização automática do serviço

### Fluxo de Funcionamento

1. **Verificação Periódica**: A cada minuto, o sistema busca tarefas com lembretes para hoje
2. **Cálculo de Diferença**: Calcula a diferença entre o horário atual e o horário do lembrete
3. **Envio de Webhook**: Se estiver no momento certo, envia o webhook
4. **Marcação como Enviado**: Marca o lembrete como enviado para evitar duplicatas

### Tolerâncias

- **Lembretes de minutos**: ±1 minuto de tolerância
- **Lembrete de 1 hora**: ±2 minutos de tolerância

## 🧪 Testando o Sistema

### 1. Teste Rápido

1. Configure um webhook de teste (ex: webhook.site)
2. Crie uma tarefa com lembrete para **agora + 2 minutos**
3. Aguarde e verifique se o webhook recebe as notificações

### 2. Logs do Console

O sistema registra logs no console do navegador:

```
🔔 Serviço de lembretes iniciado
✅ Webhook enviado com sucesso: Nome da Tarefa
❌ Erro ao enviar webhook: [erro]
```

## 🔍 Troubleshooting

### Lembretes não estão sendo enviados

1. Verifique se a URL do webhook está correta no `.env`
2. Confirme que a tarefa tem `data_vencimento` para hoje
3. Verifique se `lembrete_enviado` não está marcado como `true`
4. Confira os logs no console do navegador

### Webhook não está recebendo

1. Teste a URL do webhook manualmente
2. Verifique se há bloqueios de CORS
3. Confirme se o endpoint aceita POST com JSON

### Horários incorretos

1. Verifique o fuso horário do sistema
2. Confirme se o formato do `hora_lembrete` está correto (HH:mm:ss)
3. Verifique se a data da tarefa está correta

## 📝 Notas Importantes

- O sistema funciona apenas enquanto a aplicação estiver aberta no navegador
- Para um sistema de produção, considere implementar um backend dedicado
- Os lembretes são baseados no horário local do dispositivo
- Apenas uma notificação "na hora" marca o lembrete como enviado definitivamente