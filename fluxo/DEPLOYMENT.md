# Guia de Deploy do Fluxo na Azure

Este guia detalha como fazer o deploy do Fluxo (frontend + backend) na Azure com GitHub Actions CI/CD.

## Pré-requisitos

- ✅ Conta Azure for Students (já tem)
- ✅ Repositório no GitHub
- ✅ Azure SQL Database já configurado (`fluxo-money-database`)
- Node.js 20+

## Passo 1: Preparar o Repositório

1. **Fazer commit dos workflows do GitHub Actions:**
   ```bash
   git add .github/workflows/
   git commit -m "Add GitHub Actions deployment workflows"
   ```

2. **Fazer push para main:**
   ```bash
   git push origin main
   ```

## Passo 2: Criar o Azure Static Web App (Frontend)

O **Azure Static Web Apps** é a maneira ideal para hospedar a aplicação React — é gratuito!

### Via Portal Azure:

1. Acesse [portal.azure.com](https://portal.azure.com)
2. Clique em "Create a resource" → Search "Static Web Apps"
3. Clique em "Create"
4. Preencha os campos:
   - **Subscription**: Sua subscription (Azure for Students)
   - **Resource group**: Crie um novo, ex: `fluxo-resources`
   - **Name**: `fluxo` (ou outro nome que preferir)
   - **Plan type**: `Free`
   - **Region**: `West US 2` (ou mais próximo de você)
   - **Source**: GitHub
5. Clique em "Sign in with GitHub"
6. Autorize a Azure
7. Preencha:
   - **Organization**: Sua conta GitHub
   - **Repository**: Selecione seu repositório do Fluxo
   - **Branch**: `main`
8. Em "Build Details":
   - **Build Presets**: `Vite`
   - **App location**: `fluxo/client`
   - **Output location**: `dist`
   - **API location**: Deixe em branco (vamos usar URL absoluta)
9. Clique em "Review + create" → "Create"

### Após criação:

1. Aguarde o workflow automático rodar (verá em "Actions" no GitHub)
2. Após sucesso, copie o **API Token** do Static Web App:
   - No portal Azure, abra seu Static Web App
   - Vá em "Manage deployment token"
   - Copie o token

3. No GitHub, adicione o token como secret:
   - Vá em Repository → Settings → Secrets and variables → Actions
   - Clique em "New repository secret"
   - **Name**: `AZURE_STATIC_WEB_APPS_TOKEN`
   - **Value**: Cole o token copiado
   - Clique em "Add secret"

## Passo 3: Criar o Azure App Service (Backend)

### Via Portal Azure:

1. Acesse [portal.azure.com](https://portal.azure.com)
2. Clique em "Create a resource" → Search "App Service"
3. Clique em "Create"
4. Preencha os campos:
   - **Subscription**: Sua subscription
   - **Resource group**: Selecione `fluxo-resources` (criado antes)
   - **Name**: `fluxo-api` (importante: use este nome!)
   - **Publish**: `Code`
   - **Runtime stack**: `Node 20 LTS`
   - **Operating System**: `Linux`
   - **Region**: Mesmo que o Static Web App
   - **Pricing plan**: Mude para `Free` (F1)
5. Clique em "Review + create" → "Create"

### Configurar variáveis de ambiente:

1. Após criação, abra o App Service
2. Vá em Settings → Configuration → Application settings
3. Clique em "New application setting" para cada variável:

   ```
   DATABASE_URL = sqlserver://fluxo-money-control.database.windows.net:1433;database=fluxo-money-database;user=fluxoadmin;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=false;loginTimeout=30
   JWT_SECRET = seu-secret-key-aleatorio (gere uma string segura)
   CORS_ORIGIN = https://fluxo.azurestaticapps.net,http://localhost:5173
   PORT = 3001
   NODE_ENV = production
   ```

4. Clique em "Save"

### Obter Publish Profile:

1. No App Service, clique em "Get publish profile" (botão no topo)
2. Salve o arquivo `.PublishSettings`
3. No GitHub, adicione como secret:
   - Repository → Settings → Secrets and variables → Actions
   - **Name**: `AZURE_APP_SERVICE_PUBLISH_PROFILE`
   - **Value**: Cole todo o conteúdo do arquivo `.PublishSettings`
   - Clique em "Add secret"

## Passo 4: Atualizar Configurações do Frontend

Na página do Static Web App, configure as variáveis de ambiente:

1. Vá em Static Web App → Settings → Configuration
2. Adicione em "Environment variables":
   ```
   VITE_API_BASE = https://fluxo-api.azurewebsites.net/api
   ```

## Passo 5: Deploy Inicial

1. **Trigger do workflow do frontend:**
   - Faça qualquer commit/push para `main`
   - Vá em GitHub → Actions
   - Verá o workflow `Deploy Frontend` rodando
   - Aguarde sucesso

2. **Trigger do workflow do backend:**
   - O mesmo push acionará `Deploy Backend`
   - Pode levar alguns minutos
   - Verifique em Azure App Service → Deployment Center

3. **Testar:**
   - Frontend: Visite `https://fluxo.azurestaticapps.net`
   - Health Check: `https://fluxo-api.azurewebsites.net/api/health`

## Passo 6: Configurar Email (Opcional)

Se quiser ativar o envio de emails de password reset:

1. Configure uma conta SMTP (Google, SendGrid, etc)
2. No App Service → Configuration, adicione:
   ```
   SMTP_HOST = seu-smtp-host
   SMTP_USER = seu-email
   SMTP_PASS = sua-senha
   SMTP_FROM = noreply@fluxo.com
   ```
3. Salve

## Troubleshooting

### "Erro ao conectar banco de dados"
- Verifique DATABASE_URL no App Service → Configuration
- Confirme que o IP do App Service está liberado no Firewall do SQL:
  - Portal Azure → SQL Server → Firewall and virtual networks
  - Adicione "Allow Azure services and resources to access this server" = ON

### "CORS error"
- Verifique CORS_ORIGIN no App Service
- Atualize para incluir a URL real do Static Web App
- Aguarde redeploy

### "Build failed"
- Verifique o workflow no GitHub Actions
- Logs estão em Actions → Workflow run → Job details

## Monitoramento

- **Frontend**: Application Insights via Static Web App
- **Backend**: Application Insights via App Service
- **Database**: Query Statistics no SQL Database

## Próximos passos

- Configurar domínio customizado (ex: fluxo.seu-dominio.com)
- Adicionar SSL certificate (automático na Azure)
- Configurar Backups do banco de dados
- Monitorar custos via Azure Cost Management
