# CareSync Production Deployment Guide

This guide provides step-by-step instructions for deploying CareSync to AWS EKS in a production environment, or running it locally with Kubernetes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Kubernetes Deployment](#local-kubernetes-deployment)
3. [AWS Infrastructure Setup](#aws-infrastructure-setup)
4. [Terraform Deployment](#terraform-deployment)
5. [Application Deployment](#application-deployment)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Tools Required

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# For local Kubernetes - Install Minikube or Kind
# Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Or Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

---

## Local Kubernetes Deployment

This section covers deploying CareSync to a local Kubernetes cluster (Minikube or Kind) for development and testing.

### Step 1: Start Local Kubernetes Cluster

**Using Minikube:**
```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable necessary addons
minikube addons enable metrics-server
minikube addons enable ingress
```

**Using Kind:**
```bash
# Create a Kind cluster with port mappings
cat <<EOF | kind create cluster --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30050
    hostPort: 30050
    protocol: TCP
  - containerPort: 30080
    hostPort: 30080
    protocol: TCP
EOF
```

### Step 2: Build Docker Images

```bash
# For Minikube - use Minikube's Docker daemon
eval $(minikube docker-env)

# Build backend
cd backend
docker build -t caresync-backend:latest .

# Build frontend
cd ../frontend
docker build -t caresync-frontend:latest --build-arg VITE_API_URL=http://localhost:30050/api .
```

### Step 3: Deploy with Kubernetes Manifests

```bash
# Apply namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-statefulset.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n caresync --timeout=120s

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Apply network policies (optional, for security)
kubectl apply -f k8s/network-policy.yaml
```

### Step 4: Run Database Migrations

```bash
# Get backend pod name
POD_NAME=$(kubectl get pods -n caresync -l app.kubernetes.io/name=caresync-backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n caresync ${POD_NAME} -- npx prisma migrate deploy

# Seed database
kubectl exec -n caresync ${POD_NAME} -- node prisma/seed.js
```

### Step 5: Access the Application

The services are exposed via NodePort:
- **Frontend**: http://localhost:30080
- **Backend API**: http://localhost:30050

For Minikube, you may need to get the Minikube IP:
```bash
minikube ip
# Then access at http://<minikube-ip>:30080
```

Or use port forwarding:
```bash
# Forward frontend
kubectl port-forward svc/caresync-frontend -n caresync 8080:80 &

# Forward backend
kubectl port-forward svc/caresync-backend -n caresync 5000:5000 &

# Access at http://localhost:8080
```

### Step 6: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n caresync

# Check services
kubectl get svc -n caresync

# View backend logs
kubectl logs -l app.kubernetes.io/name=caresync-backend -n caresync --tail=50

# View frontend logs
kubectl logs -l app.kubernetes.io/name=caresync-frontend -n caresync --tail=50
```

### Test Credentials
- **Admin**: admin@caresync.com / admin123
- **Doctor**: dr.smith@caresync.com / doctor123
- **Patient**: patient1@example.com / patient123

---

## Alternative: Deploy with Helm (Local)

```bash
cd helm/caresync

helm upgrade --install caresync . \
  --namespace caresync \
  --create-namespace \
  --set backend.image.repository=caresync-backend \
  --set backend.image.tag=latest \
  --set frontend.image.repository=caresync-frontend \
  --set frontend.image.tag=latest \
  --set postgresql.enabled=true \
  --set ingress.enabled=false \
  --set backend.service.type=NodePort \
  --set backend.service.nodePort=30050 \
  --set frontend.service.type=NodePort \
  --set frontend.service.nodePort=30080 \
  --wait
```

---

### AWS Account Setup

1. Create an IAM user with programmatic access
2. Attach the following policies:
   - `AdministratorAccess` (for initial setup) or
   - Custom policy with EKS, EC2, RDS, ECR, IAM, VPC permissions

3. Configure AWS CLI:
```bash
aws configure
# Enter your Access Key ID, Secret Access Key, Region (us-east-1), and output format (json)
```

---

## AWS Infrastructure Setup

### Step 1: Create Terraform State Backend

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket caresync-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket caresync-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket caresync-terraform-state \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name caresync-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### Step 2: Configure Terraform Variables

```bash
cd terraform

# Copy example tfvars
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

Set the following in `terraform.tfvars`:
```hcl
aws_region  = "us-east-1"
environment = "production"
project_name = "caresync"
domain_name = "your-domain.com"

# Generate a strong password
rds_password = "YourSecurePassword123!"
```

---

## Terraform Deployment

### Step 1: Initialize Terraform

```bash
cd terraform

terraform init \
  -backend-config="bucket=caresync-terraform-state" \
  -backend-config="key=eks/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="encrypt=true" \
  -backend-config="dynamodb_table=caresync-terraform-locks"
```

### Step 2: Plan Infrastructure

```bash
terraform plan -var="rds_password=YourSecurePassword123!" -out=tfplan
```

Review the plan carefully.

### Step 3: Apply Infrastructure

```bash
terraform apply tfplan
```

This will create:
- VPC with public/private subnets
- EKS cluster with managed node groups
- RDS PostgreSQL instance
- ECR repositories
- AWS Load Balancer Controller
- Cluster Autoscaler

### Step 4: Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name caresync-eks-production
```

Verify connection:
```bash
kubectl get nodes
kubectl get namespaces
```

---

## Application Deployment

### Step 1: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_backend_repository_url | cut -d'/' -f1)

# Get ECR URLs
BACKEND_REPO=$(terraform output -raw ecr_backend_repository_url)
FRONTEND_REPO=$(terraform output -raw ecr_frontend_repository_url)

# Build and push backend
cd ../backend
docker build -t ${BACKEND_REPO}:v1.0.0 .
docker push ${BACKEND_REPO}:v1.0.0

# Build and push frontend
cd ../frontend
docker build -t ${FRONTEND_REPO}:v1.0.0 --build-arg VITE_API_URL=/api .
docker push ${FRONTEND_REPO}:v1.0.0
```

### Step 2: Create Kubernetes Secrets

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform -chdir=../terraform output -raw rds_endpoint)
DATABASE_URL="postgresql://caresync:YourSecurePassword123!@${RDS_ENDPOINT}/caresync_db?schema=public"

# Create namespace
kubectl create namespace caresync

# Create secrets
kubectl create secret generic caresync-secrets \
  --namespace caresync \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
```

### Step 3: Deploy with Helm

```bash
cd ../helm/caresync

# Add Bitnami repo for PostgreSQL (optional, for development)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy application
helm upgrade --install caresync . \
  --namespace caresync \
  --set image.registry=$(terraform -chdir=../../terraform output -raw ecr_backend_repository_url | cut -d'/' -f1) \
  --set backend.image.tag=v1.0.0 \
  --set frontend.image.tag=v1.0.0 \
  --set postgresql.enabled=false \
  --set externalDatabase.host=$(terraform -chdir=../../terraform output -raw rds_address) \
  --set externalDatabase.port=5432 \
  --set externalDatabase.user=caresync \
  --set externalDatabase.database=caresync_db \
  --set ingress.hosts[0].host=caresync.your-domain.com \
  --set aws.certificateArn=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID \
  --wait
```

### Step 4: Run Database Migrations

```bash
# Get a backend pod name
POD_NAME=$(kubectl get pods -n caresync -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n caresync ${POD_NAME} -- npx prisma migrate deploy

# Seed database (optional)
kubectl exec -n caresync ${POD_NAME} -- node prisma/seed.js
```

### Step 5: Verify Deployment

```bash
# Check pod status
kubectl get pods -n caresync

# Check services
kubectl get svc -n caresync

# Check ingress
kubectl get ingress -n caresync

# Get ALB DNS name
kubectl get ingress caresync-caresync-ingress -n caresync -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## DNS Configuration

### Route 53 Setup

1. Go to Route 53 in AWS Console
2. Create or select your hosted zone
3. Create an A record:
   - Name: `caresync` (or your subdomain)
   - Type: A - IPv4 address
   - Alias: Yes
   - Alias Target: Select the ALB from the dropdown
4. Wait for DNS propagation (5-15 minutes)

### SSL Certificate (ACM)

1. Go to ACM in AWS Console
2. Request a certificate
3. Add domain names: `caresync.your-domain.com`
4. Choose DNS validation
5. Create the validation records in Route 53
6. Wait for certificate to be issued
7. Note the certificate ARN for Helm deployment

---

## Monitoring Setup

### Deploy Prometheus and Grafana

```bash
# Apply monitoring manifests
kubectl apply -f ../k8s/monitoring/prometheus.yaml
kubectl apply -f ../k8s/monitoring/grafana.yaml

# Port forward Grafana for access
kubectl port-forward svc/grafana -n monitoring 3000:3000

# Access at http://localhost:3000
# Default credentials: admin / CareSync@2024
```

### CloudWatch Container Insights

```bash
# Install CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml

# Replace cluster name in the above manifest with your cluster name
```

---

## Troubleshooting

### Common Issues

#### Pods not starting
```bash
kubectl describe pod <pod-name> -n caresync
kubectl logs <pod-name> -n caresync
```

#### Database connection issues
```bash
# Check database connectivity from pod
kubectl exec -it <pod-name> -n caresync -- nc -zv <rds-endpoint> 5432
```

#### ALB not provisioning
```bash
# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# Check ingress events
kubectl describe ingress -n caresync
```

#### HPA not scaling
```bash
# Check metrics server
kubectl top pods -n caresync

# Check HPA status
kubectl describe hpa -n caresync
```

### Useful Commands

```bash
# View all resources in namespace
kubectl get all -n caresync

# View logs for all backend pods
kubectl logs -l app.kubernetes.io/component=backend -n caresync --tail=100

# Execute into a pod
kubectl exec -it <pod-name> -n caresync -- /bin/sh

# Rollback deployment
kubectl rollout undo deployment/caresync-backend -n caresync

# Force restart deployment
kubectl rollout restart deployment/caresync-backend -n caresync
```

---

## Cleanup

To destroy all infrastructure:

```bash
# Delete Helm release
helm uninstall caresync -n caresync

# Delete namespace
kubectl delete namespace caresync

# Destroy Terraform infrastructure
cd terraform
terraform destroy -var="rds_password=YourSecurePassword123!"

# Delete S3 bucket (empty first)
aws s3 rm s3://caresync-terraform-state --recursive
aws s3api delete-bucket --bucket caresync-terraform-state --region us-east-1

# Delete DynamoDB table
aws dynamodb delete-table --table-name caresync-terraform-locks --region us-east-1
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable AWS CloudTrail
- [ ] Configure AWS Config rules
- [ ] Enable GuardDuty
- [ ] Set up billing alerts
- [ ] Configure VPC Flow Logs (done by Terraform)
- [ ] Enable RDS encryption (done by Terraform)
- [ ] Review security groups
- [ ] Enable Kubernetes audit logging
- [ ] Set up AWS Backup for RDS
