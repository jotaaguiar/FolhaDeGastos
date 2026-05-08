# Checklist de Deploy do Fluxo na Azure

## 📋 Preparação (Local)

- [ ] Código commitado e pronto para deploy
- [ ] Ter acesso à conta Azure for Students
- [ ] Ter acesso ao repositório GitHub

## 🔧 Configuração do Azure (Portal)

### Static Web App (Frontend)

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

### App Service (Backend)

- [ ] Criar novo App Service
  - [ ] Name: `fluxo-api`
  - [ ] Resource Group: `fluxo-resources`
  - [ ] Runtime: `Node 20 LTS`
  - [ ] OS: `Linux`
  - [ ] Region: Mesmo que Static Web App (`West US 2`)
  - [ ] Pricing Plan: `Free (F1)`
- [ ] Configurar Application Settings:
  - [ ] `DATABASE_URL` (copiar da .env local)
  - [ ] `JWT_SECRET` (gerar novo valor seguro)
  - [ ] `CORS_ORIGIN` (ver abaixo)
  - [ ] `NODE_ENV` = `production`
- [ ] Verificar conectividade do banco de dados
  - [ ] Ir ao SQL Server firewall
  - [ ] Ativar "Allow Azure services and resources"
- [ ] Obter Publish Profile do App Service
- [ ] Adicionar secret no GitHub: `AZURE_APP_SERVICE_PUBLISH_PROFILE`

### Static Web App - Environment Variables

- [ ] Ir ao Static Web App → Configuration
- [ ] Adicionar Environment Variable:
  - [ ] `VITE_API_BASE` = `https://fluxo-api.azurewebsites.net/api`

## 🔐 GitHub Secrets

- [ ] `AZURE_STATIC_WEB_APPS_TOKEN` (do Static Web App)
- [ ] `AZURE_APP_SERVICE_PUBLISH_PROFILE` (do App Service)

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
| CORS Error | Verifique CORS_ORIGIN no App Service, redeploy |
| Banco de dados não conecta | Verifique firewall do SQL Server |
| Build falhou | Verifique logs no GitHub Actions |
| App não inicia | Verifique logs do App Service |

## 📊 Monitoramento

- [ ] Verificar Application Insights do Static Web App
- [ ] Verificar Application Insights do App Service
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
