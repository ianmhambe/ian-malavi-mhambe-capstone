CareSync Helm Chart
===================

This chart deploys the CareSync Healthcare Appointment Scheduling application on Kubernetes.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure
- AWS Load Balancer Controller (for ALB Ingress)

## Installing the Chart

To install the chart with the release name `caresync`:

```bash
# Add the Bitnami repo for PostgreSQL dependency
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install dependencies
helm dependency update ./helm/caresync

# Install the chart
helm install caresync ./helm/caresync \
  --namespace caresync \
  --create-namespace \
  --set secrets.jwtSecret=your-jwt-secret \
  --set secrets.jwtRefreshSecret=your-refresh-secret \
  --set postgresql.auth.password=your-db-password \
  --set postgresql.auth.postgresPassword=your-postgres-password
```

## Configuration

The following table lists the configurable parameters and their default values.

### Global Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.imageRegistry` | Global Docker image registry | `""` |
| `namespace` | Kubernetes namespace | `caresync` |

### Backend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.enabled` | Enable backend deployment | `true` |
| `backend.replicaCount` | Number of replicas | `3` |
| `backend.image.repository` | Backend image repository | `caresync-backend` |
| `backend.image.tag` | Backend image tag | `latest` |
| `backend.service.port` | Service port | `5000` |
| `backend.resources.requests.memory` | Memory request | `256Mi` |
| `backend.resources.limits.memory` | Memory limit | `512Mi` |

### Frontend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.replicaCount` | Number of replicas | `2` |
| `frontend.image.repository` | Frontend image repository | `caresync-frontend` |
| `frontend.image.tag` | Frontend image tag | `latest` |
| `frontend.service.port` | Service port | `80` |

### PostgreSQL Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `postgresql.enabled` | Use bundled PostgreSQL | `true` |
| `postgresql.auth.username` | PostgreSQL username | `caresync` |
| `postgresql.auth.database` | PostgreSQL database | `caresync_db` |
| `postgresql.primary.persistence.size` | Storage size | `20Gi` |

### Ingress Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `alb` |
| `ingress.hosts[0].host` | Hostname | `caresync.example.com` |
| `aws.certificateArn` | ACM certificate ARN | `""` |

### Autoscaling

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.autoscaling.enabled` | Enable HPA for backend | `true` |
| `backend.autoscaling.minReplicas` | Min replicas | `2` |
| `backend.autoscaling.maxReplicas` | Max replicas | `10` |
| `frontend.autoscaling.enabled` | Enable HPA for frontend | `true` |

## Production Values

For production deployment, create a `values-production.yaml`:

```yaml
image:
  registry: <your-ecr-registry>

backend:
  image:
    repository: caresync-backend
    tag: "v1.0.0"
  replicaCount: 3
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "1000m"

frontend:
  image:
    repository: caresync-frontend
    tag: "v1.0.0"
  replicaCount: 3

postgresql:
  enabled: false

externalDatabase:
  host: your-rds-endpoint.rds.amazonaws.com
  port: 5432
  user: caresync
  database: caresync_db

ingress:
  hosts:
    - host: caresync.yourdomain.com
      paths:
        - path: /api
          pathType: Prefix
          service: backend
        - path: /
          pathType: Prefix
          service: frontend

aws:
  region: us-east-1
  certificateArn: arn:aws:acm:us-east-1:123456789:certificate/abc123

secrets:
  jwtSecret: ""  # Use external secrets manager
  jwtRefreshSecret: ""
```

Install with production values:

```bash
helm install caresync ./helm/caresync \
  -f values-production.yaml \
  --namespace caresync \
  --create-namespace
```

## Uninstalling the Chart

```bash
helm uninstall caresync --namespace caresync
```
