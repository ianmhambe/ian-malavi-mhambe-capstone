# CareSync Deployment Guide - AWS EKS Capstone Project

## Ian Malavi Mhambe - Complete Step-by-Step Deployment Guide

This guide walks you through deploying the CareSync Healthcare Appointment Scheduler to AWS EKS for your capstone project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Local Setup & Verification](#phase-1-local-setup--verification)
3. [Phase 2: AWS & ECR Configuration](#phase-2-aws--ecr-configuration)
4. [Phase 3: GitHub Repository Setup](#phase-3-github-repository-setup)
5. [Phase 4: Deploy to EKS](#phase-4-deploy-to-eks)
6. [Phase 5: Verification & Testing](#phase-5-verification--testing)
7. [Demo Preparation](#demo-preparation)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] AWS Access Key ID (provided by DevOps team)
- [ ] AWS Secret Access Key (provided by DevOps team)
- [ ] GitHub account
- [ ] Docker installed locally
- [ ] AWS CLI installed
- [ ] kubectl installed
- [ ] Git installed

### Install Required Tools (if not already installed)

```bash
# Install AWS CLI (Linux)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installations
aws --version
kubectl version --client
docker --version
git --version
```

---

## Phase 1: Local Setup & Verification

### Step 1.1: Verify Project Structure

Your project should have this structure:

```
ian-malavi-mhambe-capstone/
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-statefulset.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── network-policy.yaml
│   └── pod-disruption-budget.yaml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── README.md
├── RUNBOOK.md
└── DEPLOYMENT_GUIDE.md
```

### Step 1.2: Test Application Locally (Optional)

```bash
# Navigate to project directory
cd /home/mhambe/Desktop/ian-malavi-mhambe-capstone

# Build and test with Docker Compose
docker-compose up --build

# Test endpoints
curl http://localhost:3000/api/health    # Backend health
curl http://localhost:80/health          # Frontend health
```

---

## Phase 2: AWS & ECR Configuration

### Step 2.1: Configure AWS CLI

```bash
# Run AWS configure
aws configure
```

When prompted, enter:

```
AWS Access Key ID [None]: <YOUR_AWS_ACCESS_KEY_ID>
AWS Secret Access Key [None]: <YOUR_AWS_SECRET_ACCESS_KEY>
Default region name [None]: eu-west-1
Default output format [None]: json
```

### Step 2.2: Verify AWS Connection

```bash
# Verify your identity
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "...",
#     "Account": "...",
#     "Arn": "arn:aws:iam::..."
# }
```

### Step 2.3: Connect to EKS Cluster

```bash
# Update kubeconfig for the innovation cluster
aws eks update-kubeconfig --region eu-west-1 --name innovation

# Verify connection
kubectl cluster-info

# Check available namespaces
kubectl get namespaces
```

### Step 2.4: Create ECR Repositories

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="eu-west-1"

echo "AWS Account ID: $AWS_ACCOUNT_ID"

# Create frontend ECR repository
aws ecr create-repository \
    --repository-name ian-malavi-mhambe/frontend \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true

# Create backend ECR repository
aws ecr create-repository \
    --repository-name ian-malavi-mhambe/backend \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true

# Verify repositories were created
aws ecr describe-repositories --region $AWS_REGION | grep ian-malavi-mhambe
```

**Expected Output:**

```
"repositoryName": "ian-malavi-mhambe/frontend"
"repositoryName": "ian-malavi-mhambe/backend"
```

### Step 2.5: Note Your ECR URIs

Your ECR image URIs will be:

```
<AWS_ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/frontend
<AWS_ACCOUNT_ID>.dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/backend
```

---

## Phase 3: GitHub Repository Setup

### Step 3.1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new **public** repository named: `ian-malavi-mhambe-capstone`
3. Do NOT initialize with README (we already have one)

### Step 3.2: Push Your Code to GitHub

```bash
# Navigate to project directory
cd /home/mhambe/Desktop/ian-malavi-mhambe-capstone

# Initialize git if not already done
git init

# Add remote origin
git remote add origin https://github.com/ianmhambe/ian-malavi-mhambe-capstone.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: CareSync Healthcare Appointment Scheduler"

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3.3: Configure GitHub Secrets

1. Go to your repository: `https://github.com/ianmhambe/ian-malavi-mhambe-capstone`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key ID | From DevOps team |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key | From DevOps team |

> **Note:** AWS_REGION and EKS_CLUSTER_NAME are already configured in the workflow file (eu-west-1 and innovation).

**Screenshot Guide:**

```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

### Step 3.4: Set Up Branch Protection (Optional but Recommended)

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - [x] Require a pull request before merging
   - [x] Require status checks to pass before merging

---

## Phase 4: Deploy to EKS (Automated via CI/CD)

The CI/CD pipeline automatically handles:
1. ✅ Building Docker images
2. ✅ Pushing to AWS ECR
3. ✅ Updating Kubernetes manifests with ECR image URIs
4. ✅ Deploying to EKS cluster

### Step 4.1: Trigger Deployment

Simply push your code to GitHub - the CI/CD pipeline handles everything:

```bash
cd /home/mhambe/Desktop/ian-malavi-mhambe-capstone

# Add all files
git add .

# Commit
git commit -m "Initial deployment: CareSync Healthcare App"

# Push to main branch
git push origin main
```

### Step 4.2: Monitor CI/CD Pipeline

1. Go to: `https://github.com/ianmhambe/ian-malavi-mhambe-capstone/actions`
2. Watch the pipeline progress through:
   - **Test** - Runs tests
   - **Build and Push to ECR** - Builds Docker images and pushes to AWS ECR
   - **Deploy to EKS** - Deploys to Kubernetes cluster

### Step 4.3: What the Pipeline Does

```
1. Checkout Code
2. Configure AWS Credentials (using secrets)
3. Login to Amazon ECR (aws-actions/amazon-ecr-login@v2)
4. Build Docker Images (multi-stage Dockerfiles)
5. Push to ECR:
   - <account-id>.dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/backend:<git-sha>
   - <account-id>.dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/frontend:<git-sha>
6. Update kubeconfig for EKS cluster "innovation"
7. Update K8s manifests with ECR image URIs
8. kubectl apply all manifests to namespace "ian-malavi-mhambe"
9. Verify deployments are ready
```

### Step 4.4: Manual Deployment (Alternative)

If you need to deploy manually:

```bash
# 1. Login to ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-west-1.amazonaws.com

# 2. Build and push backend
cd backend
docker build -t $(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/backend:latest .
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/backend:latest

# 3. Build and push frontend
cd ../frontend
docker build -t $(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/frontend:latest .
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.eu-west-1.amazonaws.com/ian-malavi-mhambe/frontend:latest

# 4. Update manifests and deploy
cd ..
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -i "s|REPLACE_WITH_ECR_URI|${AWS_ACCOUNT_ID}.dkr.ecr.eu-west-1.amazonaws.com|g" k8s/backend-deployment.yaml k8s/frontend-deployment.yaml

# 5. Apply to Kubernetes
kubectl apply -f k8s/
```

---

## Phase 5: Verification & Testing

### Step 5.1: Check Pod Status

```bash
# View all pods in your namespace
kubectl get pods -n ian-malavi-mhambe

# Expected output:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxxxxxxxx-xxxxx     1/1     Running   0          5m
# frontend-xxxxxxxxx-xxxxx    1/1     Running   0          5m
```

### Step 5.2: Check Services

```bash
# View all services
kubectl get services -n ian-malavi-mhambe

# Expected output:
# NAME       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
# backend    ClusterIP   10.100.xxx.xx   <none>        3000/TCP   5m
# frontend   ClusterIP   10.100.xxx.xx   <none>        80/TCP     5m
```

### Step 5.3: Check Ingress

```bash
# View ingress
kubectl get ingress -n ian-malavi-mhambe

# Get ingress details
kubectl describe ingress caresync-ingress -n ian-malavi-mhambe
```

### Step 5.4: Test Health Endpoints

```bash
# Port-forward to test backend directly
kubectl port-forward svc/backend 3000:3000 -n ian-malavi-mhambe &

# Test backend health
curl http://localhost:3000/api/health

# Port-forward to test frontend directly
kubectl port-forward svc/frontend 8080:80 -n ian-malavi-mhambe &

# Test frontend health
curl http://localhost:8080/health
```

### Step 5.5: View Logs

```bash
# View backend logs
kubectl logs -l app=backend -n ian-malavi-mhambe --tail=100

# View frontend logs
kubectl logs -l app=frontend -n ian-malavi-mhambe --tail=100

# Follow logs in real-time
kubectl logs -l app=backend -n ian-malavi-mhambe -f
```

### Step 5.6: Access Application via Ingress

Your application should be accessible at:

```
https://ian-malavi-mhambe.capstone.tiberbu.com
```

Or the URL provided by your DevOps team.

---

## Demo Preparation

### For Your 10-Minute Demo

#### 1. Make a Code Change

```bash
# Edit a file (e.g., backend health endpoint message)
cd /home/mhambe/Desktop/ian-malavi-mhambe-capstone

# Make a visible change in backend/src/routes/health.js
# Change the health message to include a timestamp or version
```

#### 2. Commit and Push

```bash
git add .
git commit -m "Demo: Updated health endpoint message"
git push origin main
```

#### 3. Show GitHub Actions

Open: `https://github.com/ianmhambe/ian-malavi-mhambe-capstone/actions`

Show the pipeline:
- Building images
- Pushing to ECR
- Deploying to EKS

#### 4. Verify Deployment

```bash
# Watch pods update
kubectl get pods -n ian-malavi-mhambe -w

# Verify new version is running
kubectl describe pod -l app=backend -n ian-malavi-mhambe | grep Image
```

#### 5. Test the Application

```bash
# Test health endpoint
kubectl port-forward svc/backend 3000:3000 -n ian-malavi-mhambe
curl http://localhost:3000/api/health

# Show frontend calling backend
# Open browser to your ingress URL
```

### Demo Checklist

- [ ] GitHub repository is public
- [ ] CI/CD pipeline runs successfully
- [ ] Images pushed to ECR
- [ ] Pods running in `ian-malavi-mhambe` namespace
- [ ] Frontend accessible via Ingress
- [ ] Frontend can call Backend API
- [ ] Health endpoints return 200 OK
- [ ] Can explain design decisions

---

## Troubleshooting

### Issue: AWS CLI Not Configured

```bash
# Re-run configuration
aws configure

# Verify
aws sts get-caller-identity
```

### Issue: kubectl Cannot Connect to Cluster

```bash
# Update kubeconfig
aws eks update-kubeconfig --region eu-west-1 --name innovation

# Verify
kubectl cluster-info
```

### Issue: ECR Push Access Denied

```bash
# Re-authenticate with ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.eu-west-1.amazonaws.com
```

### Issue: Pods in CrashLoopBackOff

```bash
# Check logs
kubectl logs -l app=backend -n ian-malavi-mhambe --previous

# Check events
kubectl describe pod -l app=backend -n ian-malavi-mhambe

# Common fixes:
# - Check DATABASE_URL is correct
# - Check secrets are mounted
# - Check image exists in ECR
```

### Issue: ImagePullBackOff

```bash
# Verify image exists in ECR
aws ecr describe-images --repository-name ian-malavi-mhambe/backend --region eu-west-1

# Check if image tag is correct
kubectl describe pod -l app=backend -n ian-malavi-mhambe | grep Image

# Ensure ECR pull secret is configured (if required)
```

### Issue: Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n ian-malavi-mhambe

# Check if pods are ready
kubectl get pods -n ian-malavi-mhambe -o wide

# Test internal connectivity
kubectl run test-pod --rm -it --image=busybox -n ian-malavi-mhambe -- wget -qO- http://backend:3000/api/health
```

### Issue: Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress -n ian-malavi-mhambe

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

---

## Quick Reference Commands

```bash
# Set namespace as default
kubectl config set-context --current --namespace=ian-malavi-mhambe

# View all resources in namespace
kubectl get all -n ian-malavi-mhambe

# Delete and recreate deployment
kubectl delete -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml

# Scale deployment
kubectl scale deployment backend --replicas=3 -n ian-malavi-mhambe

# View HPA status
kubectl get hpa -n ian-malavi-mhambe

# View resource usage
kubectl top pods -n ian-malavi-mhambe

# Execute command in pod
kubectl exec -it $(kubectl get pod -l app=backend -n ian-malavi-mhambe -o jsonpath='{.items[0].metadata.name}') -n ian-malavi-mhambe -- /bin/sh
```

---

## Project Deliverables Checklist

### Mandatory Requirements ✅

- [x] **Working CI/CD Pipeline** - `.github/workflows/ci-cd.yml`
- [x] **Multi-stage Dockerfiles** - `frontend/Dockerfile`, `backend/Dockerfile`
- [x] **Non-root users** - Both Dockerfiles use non-root users
- [x] **Kubernetes Manifests** - All in `k8s/` directory
- [x] **Resource Limits** - Defined in deployments
- [x] **Health Probes** - Liveness and readiness probes configured
- [x] **Namespace Isolation** - `ian-malavi-mhambe` namespace
- [x] **ECR Repositories** - `ian-malavi-mhambe/frontend`, `ian-malavi-mhambe/backend`
- [x] **README.md** - Project documentation
- [x] **RUNBOOK.md** - Troubleshooting guide

### Bonus Features ✅

- [x] **Terraform IaC** - `terraform/` directory
- [x] **Helm Charts** - `helm/caresync/` directory
- [x] **Network Policies** - `k8s/network-policy.yaml`
- [x] **HPA Autoscaling** - `k8s/hpa.yaml`
- [x] **Pod Disruption Budget** - `k8s/pod-disruption-budget.yaml`

---

## Contact & Support

If you encounter issues:

| Contact | Email | Role |
|---------|-------|------|
| Daniel | dan@tiberbu.com | DevOps Lead |
| James | njoroge@tiberbu.com | DevOps Engineer |
| Elvis | elvis@tiberbu.com | DevOps Engineer |

---

**Good luck with your capstone project!** 🚀
