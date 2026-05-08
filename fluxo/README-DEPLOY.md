# Fluxo - Deploy na Azure

Seu Fluxo foi configurado para deploy automático na Azure usando GitHub Actions CI/CD.

## 📁 Arquivos de Deploy Criados

```
fluxo/
├── .github/workflows/
│   ├── deploy-frontend.yml      # CI/CD para React (Static Web Apps)
│   └── deploy-backend.yml       # CI/CD para Node.js (App Service)
├── .gitignore                   # Segurança: evita commit de .env
├── client/
│   └── staticwebapp.config.json # Config do Static Web Apps
├── server/
│   └── .env.example             # Template de variáveis de ambiente
├── DEPLOYMENT.md                # Guia passo-a-passo completo
├── DEPLOYMENT-CHECKLIST.md      # Checklist de verificação
├── AZURE-SETUP.sh               # Script de setup (auxiliar)
└── README-DEPLOY.md             # Este arquivo
```

## 🚀 Quick Start

### 1. Preparação (2 min)

Certifique-se de que tudo está commitado:
```bash
git status  # Deve estar limpo ou com commits prontos
git push origin main
```

### 2. Setup no Azure (15 min)

Siga o **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** para:
1. Criar Static Web App (frontend)
2. Criar App Service (backend)
3. Adicionar secrets no GitHub

### 3. Deploy (2 min)

Só faça um push para `main` — tudo é automático:
```bash
git push origin main
```

Os workflows vão:
- ✅ Fazer build da React
- ✅ Fazer build do Node.js
- ✅ Deploy no Static Web Apps
- ✅ Deploy no App Service

Verifique em **GitHub → Actions** para acompanhar.

### 4. Verificar (1 min)

Após workflows concluírem:
- Frontend: `https://fluxo.azurestaticapps.net`
- Backend Health: `https://fluxo-api.azurewebsites.net/api/health`

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

### Backend (Azure App Service Configuration)

```
DATABASE_URL=sqlserver://...
JWT_SECRET=seu-secret-key
CORS_ORIGIN=https://fluxo.azurestaticapps.net,http://localhost:5173
NODE_ENV=production
PORT=3001
```

### Frontend (Azure Static Web Apps Configuration)

```
VITE_API_BASE=https://fluxo-api.azurewebsites.net/api
```

## 🆘 Problemas Comuns

### Build falha no GitHub Actions
- Verifique logs: GitHub → Actions → Seu workflow
- Confirm que `npm ci` e `npm run build` funcionam localmente

### Erro de CORS
- Verifique `CORS_ORIGIN` no App Service
- Certifique-se de incluir a URL do Static Web Apps
- Aguarde redeploy automático

### Banco de dados não conecta
- Verifique SQL Server firewall
- Ative "Allow Azure services and resources"
- Confirm DATABASE_URL no App Service

### API retorna 502/503
- Verifique logs do App Service (Diagnostic logs)
- Confirm variáveis de ambiente estão corretas
- Tente restart do App Service

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
