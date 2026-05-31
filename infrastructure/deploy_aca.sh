#!/bin/bash

# Infrastructure script for deploying to Azure Container Apps (ACA) and Azure Container Registry (ACR)

RESOURCE_GROUP="rg-atm-intelligence-2"
LOCATION="centralindia"
ACR_NAME="atmacrregistryadithya"
ENV_NAME="atm-container-env"
FRONTEND_APP="atm-frontend"
BACKEND_APP="atm-backend"

echo "Provisioning Azure Orchestration Environment..."

# Create Resource Group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Create Container Apps Environment
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "Deployment infrastructure prepared successfully for scalable URLs."
