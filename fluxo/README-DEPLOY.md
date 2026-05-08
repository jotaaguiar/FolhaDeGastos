# Fluxo - Deploy na Azure

Seu Fluxo foi configurado para deploy automático na Azure usando GitHub Actions CI/CD.

## 📁 Arquivos de Deploy Criados

```
fluxo/
├── .github/workflows/
│   ├── deploy-frontend.yml      # CI/CD para React (Static Web Apps)
│   └── deploy-backend.yml       # CI/CD para Node.js (Railway)
├── .gitignore                   # Segurança: evita commit de .env
├── client/
│   └── staticwebapp.config.json # Config do Static Web Apps
├── server/
│   └── .env.example             # Template de variáveis de ambiente
├── RAILWAY-SETUP.md             # Guia para deploy no Railway
├── DEPLOYMENT-CHECKLIST.md      # Checklist de verificação
└── README-DEPLOY.md             # Este arquivo
```

## 🚀 Quick Start

### 1. Preparação (2 min)

Certifique-se de que tudo está commitado:
```bash
git status  # Deve estar limpo ou com commits prontos
git push origin main
```

### 2. Setup (15 min)

**Frontend (Azure Static Web Apps):**
- Siga o **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)**

**Backend (Railway):**
- Siga o **[RAILWAY-SETUP.md](RAILWAY-SETUP.md)** (muito mais rápido!)

### 3. Deploy (2 min)

Só faça um push para `main` — tudo é automático:
```bash
git push origin main
```

Os workflows vão:
- ✅ Fazer build da React
- ✅ Deploy no Static Web Apps
- ✅ Fazer build do Node.js
- ✅ Deploy no Railway

Verifique em **GitHub → Actions** para acompanhar.

### 4. Verificar (1 min)

Após workflows concluírem:
- Frontend: `https://fluxo.azurestaticapps.net`
- Backend Health: `https://seu-projeto-railway.up.railway.app/api/health`

## 📚 Documentação Completa

Para setup detalhado, veja **[DEPLOYMENT.md](DEPLOYMENT.md)**

Tópicos inclusos:
- Criar Static Web App e App Service
- Configurar variáveis de ambiente
- Adicionar GitHub Secrets
- Troubleshooting
- Monitoramento
- Configurar email (opcional)

## 🔄 Workflow Automático

Cada push para `main` dispara:

```
GitHub Push (main)
      ↓
Deploy Frontend Workflow
  ├─ npm ci (client)
  ├─ npm run build
  └─ Deploy no Static Web Apps
      ↓
Deploy Backend Workflow
  ├─ npm ci (server)
  ├─ npm run build
  └─ Deploy no App Service (via publish profile)
      ↓
Azure atualiza
  ├─ Frontend em: fluxo.azurestaticapps.net
  └─ Backend em: fluxo-api.azurewebsites.net
```

## 🌐 URLs do Ambiente

Após deploy bem-sucedido:

| Componente | URL |
|-----------|-----|
| Frontend | `https://fluxo.azurestaticapps.net` |
| Backend API | `https://fluxo-api.azurewebsites.net/api` |
| Health Check | `https://fluxo-api.azurewebsites.net/api/health` |

## 🔐 Variáveis de Ambiente Necessárias

### Backend (Railway Variables)

```
DATABASE_URL=sqlserver://...
JWT_SECRET=seu-secret-key
CORS_ORIGIN=https://fluxo.azurestaticapps.net,http://localhost:5173
NODE_ENV=production
PORT=3001
```

### Frontend (Azure Static Web Apps Configuration)

```
VITE_API_BASE=https://seu-projeto-railway.up.railway.app/api
```

## 🆘 Problemas Comuns

### Build falha no GitHub Actions
- Verifique logs: GitHub → Actions → Seu workflow
- Confirm que `npm ci` e `npm run build` funcionam localmente

### Erro de CORS
- Verifique `CORS_ORIGIN` no Railway
- Certifique-se de incluir a URL do Static Web Apps
- Aguarde redeploy automático

### Banco de dados não conecta
- Verifique DATABASE_URL no Railway
- SQL Server firewall pode estar bloqueando (não é Azure, então provavelmente OK)
- Confirm credenciais no DATABASE_URL

### API retorna erro
- Verifique logs no Railway Dashboard
- Confirm variáveis de ambiente estão corretas
- Tente redeploy manualmente no Railway

## 📊 Próximos Passos

- [ ] Configurar **Application Insights** para monitoramento
- [ ] Adicionar **domínio customizado** (ex: fluxo.seu-dominio.com)
- [ ] Setup **backup automático** do banco de dados
- [ ] Configurar **alertas** para erros

## 💡 Dicas

1. **Desenvolver localmente primeiro**: Test tudo com `npm run dev` antes de push
2. **Commit pequeno**: Assim workflows são mais rápidos
3. **Logs do Azure**: Muito úteis para debug
   - Static Web App → Logs
   - App Service → Logs stream
4. **Ambiente de staging**: Considere criar um branch `staging` para testes
5. **Custos**: Monitorar via **Azure Cost Management**

## 📞 Suporte

Se encontrar problemas:

1. **Primeiro**: Verifique [DEPLOYMENT.md](DEPLOYMENT.md)
2. **Logs**: GitHub Actions + Azure Diagnostics
3. **Azure Docs**: https://learn.microsoft.com/pt-br/azure/

---

**Status**: ✅ Pronto para deploy  
**Stack**: React + Vite + Node.js + Express + Azure SQL  
**CI/CD**: GitHub Actions → Azure  
**Custo**: Grátis (Azure for Students + Free Tiers)
