# Checklist de Deploy do Fluxo na Azure

## 📋 Preparação (Local)

- [ ] Código commitado e pronto para deploy
- [ ] Ter acesso à conta Azure for Students
- [ ] Ter acesso ao repositório GitHub

## 🔧 Configuração (Azure + Railway)

### Static Web App (Frontend) - Azure

- [ ] Criar novo Static Web App
  - [ ] Name: `fluxo`
  - [ ] Resource Group: `fluxo-resources`
  - [ ] Region: `West US 2`
  - [ ] Conectar repositório GitHub
  - [ ] Branch: `main`
  - [ ] App location: `fluxo/client`
  - [ ] API location: (deixar vazio)
  - [ ] Output location: `dist`
  - [ ] Build preset: `Vite`
- [ ] Obter API Token do Static Web App
- [ ] Adicionar secret no GitHub: `AZURE_STATIC_WEB_APPS_TOKEN`

### Backend - Railway

- [ ] Ir para [railway.app](https://railway.app)
- [ ] Conectar com GitHub
- [ ] Selecionar seu repositório do Fluxo
- [ ] Clicar "Deploy now"
- [ ] Aguardar primeiro deploy (pode falhar, é normal)
- [ ] Adicionar variáveis de ambiente no Railway:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET` (gerar novo valor seguro)
  - [ ] `CORS_ORIGIN` = `https://fluxo.azurestaticapps.net,http://localhost:5173`
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `3001`
- [ ] Obter Railway API Token em [railway.app/account/tokens](https://railway.app/account/tokens)
- [ ] Adicionar secret no GitHub: `RAILWAY_TOKEN`

### Static Web App - Environment Variables

- [ ] Ir ao Static Web App → Configuration
- [ ] Adicionar Environment Variable:
  - [ ] `VITE_API_BASE` = `https://seu-projeto-railway.up.railway.app/api`

## 🔐 GitHub Secrets

- [ ] `AZURE_STATIC_WEB_APPS_TOKEN` (do Azure Static Web App)
- [ ] `RAILWAY_TOKEN` (do Railway)

## 🚀 Deploy

- [ ] Fazer push para `main` (ou qualquer branch)
  ```bash
  git push origin main
  ```
- [ ] Verificar GitHub Actions → Workflows rodando
- [ ] Aguardar sucesso do workflow `Deploy Frontend`
- [ ] Aguardar sucesso do workflow `Deploy Backend`

## ✅ Verificação Pós-Deploy

### Frontend
- [ ] Acessar `https://fluxo.azurestaticapps.net`
- [ ] Login com usuário de teste
- [ ] Verificar se está carregando corretamente

### Backend
- [ ] Health Check: `https://fluxo-api.azurewebsites.net/api/health`
- [ ] Deve retornar `{"ok":true,"version":"1.0.0"}`

### Conectividade
- [ ] Tentar fazer login
- [ ] Tentar criar uma transação
- [ ] Verificar se dados estão salvando no banco

## 📧 Email (Opcional)

Se quiser ativar password reset com email:

- [ ] Configurar SMTP (Gmail, SendGrid, etc)
- [ ] No App Service → Configuration, adicionar:
  - [ ] `SMTP_HOST`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASS`
  - [ ] `SMTP_FROM`
- [ ] Testar password reset

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| CORS Error | Verifique CORS_ORIGIN no Railway, redeploy |
| Banco de dados não conecta | Verifique DATABASE_URL no Railway |
| Build falhou | Verifique logs no GitHub Actions ou Railway |
| App não inicia | Verifique logs no Railway Dashboard |

## 📊 Monitoramento

- [ ] Verificar logs no Railway Dashboard
- [ ] Verificar Application Insights do Static Web App (opcional)
- [ ] Configurar alertas (opcional)

## 🎯 Próximas Melhorias

- [ ] Configurar domínio customizado
- [ ] Setup de backup automático do banco
- [ ] Adicionar CI/CD para testes automáticos
- [ ] Configurar logs centralizados

---

**Tempo estimado**: 20-30 minutos (primeira vez)  
**Custo**: Grátis (coberto por Azure for Students + free tiers)

Dúvidas? Veja [DEPLOYMENT.md](DEPLOYMENT.md) para guia detalhado.
