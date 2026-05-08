# Deploy no Railway (Backend do Fluxo)

Railway é uma plataforma moderna para hospedar aplicações Node.js, Python, etc. **Totalmente gratuita** e muito mais simples que App Service.

## ✅ Por que Railway?

- ✅ Gratuito (sem limite de créditos)
- ✅ Deploy automático via GitHub
- ✅ Suporta variáveis de ambiente
- ✅ Logs em tempo real
- ✅ Reinicialização automática
- ✅ Muito rápido de configurar

## 🚀 Setup (5 minutos)

### Passo 1: Criar conta no Railway

1. Vá para [railway.app](https://railway.app)
2. Clique em "Start New Project"
3. Escolha "Deploy from GitHub repo"
4. Autorize o GitHub
5. Selecione seu repositório do Fluxo
6. Clique em "Deploy now"

### Passo 2: Configurar variáveis de ambiente

Após o primeiro deploy (pode falhar, é normal):

1. No dashboard do Railway, clique no projeto
2. Vá em "Variables"
3. Adicione as variáveis:

```
DATABASE_URL=sqlserver://fluxo-money-control.database.windows.net:1433;database=fluxo-money-database;user=fluxoadmin;password=Admin123;encrypt=true;trustServerCertificate=false;loginTimeout=30

JWT_SECRET=seu-secret-key-aleatorio-bem-longo

CORS_ORIGIN=https://fluxo.azurestaticapps.net,http://localhost:5173

NODE_ENV=   

PORT=3001
```

4. Clique em "Deploy"

### Passo 3: GitHub Secret

1. No GitHub, vá em: Repository → Settings → Secrets and variables → Actions
2. Clique em "New repository secret"
3. **Name**: `RAILWAY_TOKEN`
4. **Value**: Vá em [railway.app/account/tokens](https://railway.app/account/tokens) e crie um token
5. Copie e cole no secret do GitHub

### Passo 4: Atualizar config do Frontend

No Azure Static Web App, atualize a variável de ambiente:

```
VITE_API_BASE=https://seu-projeto-railway.up.railway.app/api
```

(Copie o URL do seu projeto no Railway)

## 🔄 Como funciona

Quando você faz push para `main`:

```
Git Push
    ↓
GitHub Actions triggered
    ↓
Railway detecta mudança
    ↓
Build automático (npm install + build)
    ↓
Deploy
    ↓
App online em ~2 minutos
```

## 📊 Monitorar

- **Logs em tempo real**: Railway Dashboard → Logs
- **Status**: Railway Dashboard → Status
- **Variáveis**: Railway Dashboard → Variables

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha | Verifique logs no Railway |
| Banco não conecta | Confirme DATABASE_URL |
| CORS error | Atualize CORS_ORIGIN |
| App fica offline | Verifique PORT e NODE_ENV |

## 💡 Dicas

1. Railway dorme depois de inatividade — isso é normal, vai acordar quando receber requisição
2. Você pode ver logs em tempo real no dashboard
3. Restart automático se houver erro
4. Muito mais barato/simples que App Service

## 📧 Email (Opcional)

Se quiser ativar password reset com email:

1. Configure SMTP (Gmail, SendGrid, etc)
2. No Railway → Variables, adicione:
   ```
   SMTP_HOST=seu-smtp
   SMTP_USER=seu-email
   SMTP_PASS=sua-senha
   SMTP_FROM=noreply@fluxo.com
   ```

---

**Pronto!** Seu backend está online em Railway de graça! 🚀
