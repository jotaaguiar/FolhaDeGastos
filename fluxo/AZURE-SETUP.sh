#!/bin/bash

# Fluxo Azure Setup Script
# Este script ajuda a configurar os recursos no Azure para deploy

set -e

echo "🚀 Fluxo Azure Setup"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se az CLI está instalado
if ! command -v az &> /dev/null; then
    echo -e "${YELLOW}⚠️  Azure CLI não está instalado${NC}"
    echo "   Instale em: https://learn.microsoft.com/pt-br/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${BLUE}1. Fazendo login na Azure...${NC}"
az login

# Obter subscription info
SUBSCRIPTION=$(az account show --query id -o tsv)
echo -e "${GREEN}✓ Subscription: $SUBSCRIPTION${NC}"

# Criar Resource Group
echo ""
echo -e "${BLUE}2. Criando Resource Group...${NC}"
RESOURCE_GROUP="fluxo-resources"
LOCATION="westus2"

if az group exists --name $RESOURCE_GROUP --query value -o tsv | grep -q "true"; then
    echo -e "${YELLOW}⚠️  Resource Group já existe${NC}"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}✓ Resource Group criado${NC}"
fi

echo ""
echo -e "${BLUE}✨ Setup pronto!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Crie o Static Web App (frontend) no portal:"
echo "   - Name: fluxo"
echo "   - Repository: seu-repo-github"
echo "   - App location: fluxo/client"
echo "   - Output location: dist"
echo ""
echo "2. Crie o App Service (backend) no portal:"
echo "   - Name: fluxo-api"
echo "   - Runtime: Node 20 LTS"
echo "   - Plan: Free (F1)"
echo ""
echo "3. Configure as variáveis de ambiente e secrets no GitHub"
echo ""
echo "4. Faça um push para main para triggar o deploy:"
echo "   git push origin main"
echo ""
echo "Mais detalhes em: DEPLOYMENT.md"
