#!/bin/bash
# CareSync AWS EKS Deployment Script
# Usage: ./deploy-aws.sh [OPTIONS]
#
# Options:
#   --region REGION       AWS region (default: us-east-1)
#   --cluster NAME        EKS cluster name (default: caresync-eks-production)
#   --tag TAG             Image tag (default: latest)
#   --skip-build          Skip Docker build and push
#   --skip-migrate        Skip database migrations
#   --dry-run             Print commands without executing
#
# Prerequisites:
#   - AWS CLI configured with appropriate permissions
#   - kubectl installed
#   - Docker installed and running
#   - Terraform state exists (infrastructure already created)

set -e

# Default values
AWS_REGION="${AWS_REGION:-us-east-1}"
EKS_CLUSTER_NAME="${EKS_CLUSTER_NAME:-caresync-eks-production}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SKIP_BUILD=false
SKIP_MIGRATE=false
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --region)
            AWS_REGION="$2"
            shift 2
            ;;
        --cluster)
            EKS_CLUSTER_NAME="$2"
            shift 2
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-migrate)
            SKIP_MIGRATE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $1"
    else
        eval "$1"
    fi
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log "Starting CareSync AWS EKS Deployment"
log "Region: $AWS_REGION"
log "Cluster: $EKS_CLUSTER_NAME"
log "Image Tag: $IMAGE_TAG"

# Step 1: Get AWS Account ID
log "Getting AWS Account ID..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log "AWS Account ID: $AWS_ACCOUNT_ID"

# Step 2: Get ECR Repository URLs
ECR_BACKEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/caresync-backend"
ECR_FRONTEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/caresync-frontend"

log "Backend ECR: $ECR_BACKEND_REPO"
log "Frontend ECR: $ECR_FRONTEND_REPO"

# Step 3: Configure kubectl for EKS
log "Configuring kubectl for EKS cluster..."
run_cmd "aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER_NAME"

# Verify connection
log "Verifying cluster connection..."
run_cmd "kubectl get nodes"

# Step 4: Build and Push Docker Images
if [ "$SKIP_BUILD" = false ]; then
    log "Logging into ECR..."
    run_cmd "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    log "Building backend image..."
    run_cmd "docker build -t ${ECR_BACKEND_REPO}:${IMAGE_TAG} ${PROJECT_ROOT}/backend"
    
    log "Building frontend image..."
    run_cmd "docker build -t ${ECR_FRONTEND_REPO}:${IMAGE_TAG} --build-arg VITE_API_URL=/api ${PROJECT_ROOT}/frontend"
    
    log "Pushing backend image..."
    run_cmd "docker push ${ECR_BACKEND_REPO}:${IMAGE_TAG}"
    
    log "Pushing frontend image..."
    run_cmd "docker push ${ECR_FRONTEND_REPO}:${IMAGE_TAG}"
else
    warn "Skipping Docker build and push"
fi

# Step 5: Create namespace if not exists
log "Creating namespace..."
run_cmd "kubectl create namespace caresync --dry-run=client -o yaml | kubectl apply -f -"

# Step 6: Get RDS endpoint from Terraform (if available)
if [ -d "${PROJECT_ROOT}/terraform" ]; then
    log "Checking for Terraform outputs..."
    cd "${PROJECT_ROOT}/terraform"
    if terraform output rds_endpoint &>/dev/null; then
        RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
        log "RDS Endpoint: $RDS_ENDPOINT"
        warn "Remember to update k8s/aws/secrets.yaml with the RDS endpoint!"
    fi
    cd "$PROJECT_ROOT"
fi

# Step 7: Update image references in manifests
log "Updating image references in AWS manifests..."
if [ "$DRY_RUN" = false ]; then
    # Create temporary files with correct image references
    sed -e "s|\${AWS_ACCOUNT_ID}|${AWS_ACCOUNT_ID}|g" \
        -e "s|\${AWS_REGION}|${AWS_REGION}|g" \
        -e "s|:latest|:${IMAGE_TAG}|g" \
        "${PROJECT_ROOT}/k8s/aws/backend-deployment.yaml" > /tmp/backend-deployment.yaml
    
    sed -e "s|\${AWS_ACCOUNT_ID}|${AWS_ACCOUNT_ID}|g" \
        -e "s|\${AWS_REGION}|${AWS_REGION}|g" \
        -e "s|:latest|:${IMAGE_TAG}|g" \
        "${PROJECT_ROOT}/k8s/aws/frontend-deployment.yaml" > /tmp/frontend-deployment.yaml
fi

# Step 8: Apply Kubernetes manifests
log "Applying Kubernetes manifests..."

# Apply namespace
run_cmd "kubectl apply -f ${PROJECT_ROOT}/k8s/namespace.yaml"

# Apply ConfigMap and Secrets
run_cmd "kubectl apply -f ${PROJECT_ROOT}/k8s/aws/configmap.yaml"

warn "Make sure you've updated k8s/aws/secrets.yaml with your actual RDS credentials!"
echo -n "Continue with secrets deployment? (y/n): "
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    run_cmd "kubectl apply -f ${PROJECT_ROOT}/k8s/aws/secrets.yaml"
fi

# Apply deployments with correct images
if [ "$DRY_RUN" = false ]; then
    log "Deploying backend..."
    kubectl apply -f /tmp/backend-deployment.yaml
    
    log "Deploying frontend..."
    kubectl apply -f /tmp/frontend-deployment.yaml
else
    run_cmd "kubectl apply -f k8s/aws/backend-deployment.yaml (with image substitution)"
    run_cmd "kubectl apply -f k8s/aws/frontend-deployment.yaml (with image substitution)"
fi

# Apply Ingress
run_cmd "kubectl apply -f ${PROJECT_ROOT}/k8s/aws/ingress.yaml"

# Apply HPA
run_cmd "kubectl apply -f ${PROJECT_ROOT}/k8s/hpa.yaml"

# Apply Network Policies
run_cmd "kubectl apply -f ${PROJECT_ROOT}/k8s/network-policy.yaml"

# Apply PodDisruptionBudget
run_cmd "kubectl apply -f ${PROJECT_ROOT}/k8s/pod-disruption-budget.yaml"

# Step 9: Wait for deployments to be ready
log "Waiting for deployments to be ready..."
run_cmd "kubectl rollout status deployment/caresync-backend -n caresync --timeout=300s"
run_cmd "kubectl rollout status deployment/caresync-frontend -n caresync --timeout=300s"

# Step 10: Run database migrations
if [ "$SKIP_MIGRATE" = false ]; then
    log "Running database migrations..."
    BACKEND_POD=$(kubectl get pods -n caresync -l app.kubernetes.io/name=caresync-backend -o jsonpath='{.items[0].metadata.name}')
    
    if [ -n "$BACKEND_POD" ]; then
        run_cmd "kubectl exec -n caresync ${BACKEND_POD} -- npx prisma migrate deploy"
        
        echo -n "Run database seed? (y/n): "
        read -r seed_response
        if [[ "$seed_response" =~ ^[Yy]$ ]]; then
            run_cmd "kubectl exec -n caresync ${BACKEND_POD} -- node prisma/seed.js"
        fi
    else
        error "Could not find backend pod for migrations"
    fi
else
    warn "Skipping database migrations"
fi

# Step 11: Get deployment info
log "Deployment complete! Getting service information..."
echo ""
echo "===== Deployment Summary ====="
run_cmd "kubectl get pods -n caresync"
echo ""
run_cmd "kubectl get svc -n caresync"
echo ""
run_cmd "kubectl get ingress -n caresync"
echo ""

# Get ALB URL
log "Getting ALB URL..."
ALB_URL=$(kubectl get ingress caresync-ingress -n caresync -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
if [ -n "$ALB_URL" ]; then
    echo -e "${GREEN}Application URL: http://${ALB_URL}${NC}"
else
    warn "ALB URL not yet available. It may take a few minutes for the ALB to be provisioned."
    echo "Run: kubectl get ingress caresync-ingress -n caresync"
fi

echo ""
log "Deployment completed successfully!"
echo ""
echo "Test credentials:"
echo "  Admin: admin@caresync.com / Admin@123"
echo "  Doctor: dr.smith@caresync.com / Doctor@123"
echo "  Patient: john.doe@email.com / Patient@123"
