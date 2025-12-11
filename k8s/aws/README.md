# AWS EKS Deployment Files

This directory contains Kubernetes manifests specifically configured for AWS EKS deployment.

## Files

| File | Description |
|------|-------------|
| `configmap.yaml` | Environment configuration for production |
| `secrets.yaml` | Secrets template (requires manual configuration) |
| `backend-deployment.yaml` | Backend deployment with ClusterIP service |
| `frontend-deployment.yaml` | Frontend deployment with ClusterIP service |
| `ingress.yaml` | AWS ALB Ingress configuration |
| `kustomization.yaml` | Kustomize configuration (optional) |

## Pre-requisites

1. **AWS Infrastructure Created via Terraform**
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```

2. **ECR Repositories Exist**
   - `caresync-backend`
   - `caresync-frontend`

3. **Docker Images Pushed to ECR**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push
   docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/caresync-backend:v1.0.0 ./backend
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/caresync-backend:v1.0.0
   
   docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/caresync-frontend:v1.0.0 ./frontend
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/caresync-frontend:v1.0.0
   ```

## Configuration

### 1. Update Secrets

Edit `secrets.yaml` with your actual values:

```yaml
stringData:
  DATABASE_URL: "postgresql://caresync:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/caresync_db?schema=public"
  JWT_SECRET: "your-strong-jwt-secret"
  JWT_REFRESH_SECRET: "your-strong-refresh-secret"
```

Or create secrets via kubectl:
```bash
kubectl create secret generic caresync-secrets \
  --namespace caresync \
  --from-literal=DATABASE_URL="postgresql://caresync:password@rds-endpoint:5432/caresync_db?schema=public" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
```

### 2. Update Image References

Replace `${AWS_ACCOUNT_ID}` and `${AWS_REGION}` in deployment files with your actual values.

### 3. Update ConfigMap (Optional)

If using a custom domain, update `configmap.yaml`:
```yaml
FRONTEND_URL: "https://your-domain.com"
CORS_ORIGIN: "https://your-domain.com"
```

### 4. Configure SSL (Optional)

For HTTPS, edit `ingress.yaml`:
```yaml
annotations:
  alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
  alb.ingress.kubernetes.io/ssl-redirect: "443"
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID
```

## Deployment

### Option 1: Using the Deploy Script

```bash
cd scripts
./deploy-aws.sh --region us-east-1 --cluster caresync-eks-production --tag v1.0.0
```

### Option 2: Manual Deployment

```bash
# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name caresync-eks-production

# Create namespace
kubectl apply -f ../namespace.yaml

# Apply ConfigMap and Secrets
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Apply deployments (after updating image references)
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Apply Ingress
kubectl apply -f ingress.yaml

# Apply HPA and policies
kubectl apply -f ../hpa.yaml
kubectl apply -f ../network-policy.yaml
kubectl apply -f ../pod-disruption-budget.yaml
```

### Option 3: Using Kustomize

```bash
kubectl apply -k .
```

## Post-Deployment

### Run Database Migrations

```bash
POD_NAME=$(kubectl get pods -n caresync -l app.kubernetes.io/name=caresync-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n caresync ${POD_NAME} -- npx prisma migrate deploy
kubectl exec -n caresync ${POD_NAME} -- node prisma/seed.js
```

### Get ALB URL

```bash
kubectl get ingress caresync-ingress -n caresync -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Verification

```bash
# Check pods
kubectl get pods -n caresync

# Check services
kubectl get svc -n caresync

# Check ingress
kubectl get ingress -n caresync

# View logs
kubectl logs -l app.kubernetes.io/name=caresync-backend -n caresync --tail=50
```

## Differences from Local Deployment

| Aspect | Local (k8s/) | AWS (k8s/aws/) |
|--------|--------------|----------------|
| Service Type | NodePort | ClusterIP |
| Ingress | Disabled | AWS ALB |
| Database | PostgreSQL StatefulSet | Amazon RDS |
| Images | Local | ECR |
| SSL | None | ACM Certificate (optional) |
