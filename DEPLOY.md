# Deploy no Vercel - NGX Growth

## Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Repositório Git (GitHub, GitLab, ou Bitbucket)
3. Projeto Supabase configurado

## Passos para Deploy

### 1. Preparar o Repositório

Certifique-se de que todos os arquivos estão commitados:
- `vercel.json` - Configuração de rotas
- `.env.example` - Exemplo de variáveis de ambiente
- Código atualizado com logotipo

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub/GitLab/Bitbucket
3. Clique em "New Project"
4. Selecione o repositório do NGX Growth
5. Configure as seguintes opções:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Configurar Variáveis de Ambiente

No painel do Vercel, vá em Settings > Environment Variables e adicione:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Acesse a URL fornecida pelo Vercel

## Configurações Importantes

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### PWA
O app está configurado como PWA e funcionará offline após o primeiro carregamento.

### Domínio Customizado
Para usar um domínio próprio:
1. Vá em Settings > Domains
2. Adicione seu domínio
3. Configure os DNS conforme instruções

## Troubleshooting

### Build Falha
- Verifique se todas as dependências estão no `package.json`
- Confirme se as variáveis de ambiente estão configuradas

### PWA não Funciona
- Verifique se o manifest.json está acessível
- Confirme se os ícones estão carregando corretamente

### Rotas não Funcionam
- Verifique se o `vercel.json` está na raiz do projeto
- Confirme se as configurações de rewrite estão corretas