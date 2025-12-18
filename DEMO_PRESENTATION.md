# Capstone Project: AWS EKS Production Deployment

## 1. Introduction

Welcome! My name is **Ian Malavi Mhambe**. This is my capstone project demonstration, where I showcase:
- A production-grade, multi-component application
- Deployed to AWS EKS
- Using DevOps, CI/CD, Kubernetes, and AWS best practices

**Focus:** DevOps, automation, security, and operational excellence (not just software development).

---

## 2. Architecture & Naming

- **Resource Isolation:** All resources are uniquely named using my name for clarity and separation.
- **Namespace:** `ian-malavi-mhambe`
- **ECR Repositories:**
  - `ian-malavi-mhambe/frontend`
  - `ian-malavi-mhambe/backend`
- **Kubernetes Objects:** All deployments, services, and policies are in my namespace.

**Show:**
```bash
kubectl get ns
kubectl get all -n ian-malavi-mhambe
```

---

## 3. CI/CD Pipeline

- **GitHub Actions** automates the entire workflow:
  - On every push: builds Docker images, pushes to ECR, deploys to EKS
  - Uses secure GitHub secrets for AWS credentials
- **Branch Protection:** Main branch requires PR reviews and passing checks

**Show:**
- GitHub Actions tab with a recent successful workflow run

---

## 4. ECR Images

- **Images are versioned and stored in ECR** for traceability and rollback

**Show:**
```bash
aws ecr describe-images --repository-name ian-malavi-mhambe/backend --region eu-west-1 --output json | jq -r '.imageDetails | sort_by(.imagePushedAt) | reverse | .[:3][] | "Tags: \(.imageTags | join(", ")) | Pushed: \(.imagePushedAt[:19])"'
aws ecr describe-images --repository-name ian-malavi-mhambe/frontend --region eu-west-1 --output json | jq -r '.imageDetails | sort_by(.imagePushedAt) | reverse | .[:3][] | "Tags: \(.imageTags | join(", ")) | Pushed: \(.imagePushedAt[:19])"'
```

---

## 5. Kubernetes Deployment

- **Manifests:** All in `k8s/` (namespace, deployments, services, ingress, HPA, RBAC, network policies)
- **Resource Management:** Requests/limits set for all pods
- **Probes:** Liveness/readiness probes for health
- **Security:** Non-root containers, RBAC, secrets

**Show:**
```bash
kubectl get pods -n ian-malavi-mhambe
kubectl get svc -n ian-malavi-mhambe
kubectl get ingress -n ian-malavi-mhambe
```

---

## 6. Accessing the Application (Port Forwarding)

> DNS is not mapped, so I use port-forwarding to access my app locally.

**Start port-forwarding:**
```bash
kubectl port-forward svc/caresync-frontend 8080:80 -n ian-malavi-mhambe
kubectl port-forward svc/caresync-backend 5000:5000 -n ian-malavi-mhambe
```

- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Backend health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 7. Live Code Change & CI/CD Demo

1. **Make a small backend code change** (e.g., update `/api/health` message)
2. **Commit and push to GitHub**
3. **Show the workflow running** (build, push, deploy)
4. **Monitor rolling update:**
```bash
kubectl get pods -w -n ian-malavi-mhambe
```
5. **Verify update in browser or with curl:**
```bash
curl http://localhost:5000/api/health
```

---

## 8. Application Verification

- **Show frontend calling backend:**
  - Open [http://localhost:8080](http://localhost:8080) and demonstrate a feature that calls the backend (e.g., login, dashboard, or health check)
- **Show backend health endpoint:**
```bash
curl http://localhost:5000/api/health
```

---

## 9. Bonus Features (Advanced DevOps)

### Terraform IaC
- **Infrastructure as Code:** Provisioned ECR, RDS, and optionally EKS with Terraform
```bash
cd terraform
terraform state list
```

### EFK Stack
- **Centralized Logging:** Fluentd ships logs to CloudWatch/Elasticsearch
```bash
kubectl get pods -l app=fluentd -n ian-malavi-mhambe
```

### Network Policies
- **Restrict traffic between frontend and backend**
```bash
kubectl get networkpolicy -n ian-malavi-mhambe
```

### RBAC
- **ServiceAccounts and RoleBindings for security**
```bash
kubectl get serviceaccount -n ian-malavi-mhambe
kubectl get role,rolebinding -n ian-malavi-mhambe
```

### Sealed Secrets
- **Encrypted secrets with Bitnami Sealed Secrets**
```bash
kubectl get sealedsecret -n ian-malavi-mhambe
```

### Helm
- **Reusable Helm chart for deployment**
```bash
helm list -n ian-malavi-mhambe
```

### HPA (Horizontal Pod Autoscaler)
- **Auto-scales backend based on CPU**
```bash
kubectl get hpa -n ian-malavi-mhambe
```

---

## 10. Q&A and Best Practices

> “I followed best practices: non-root containers, encrypted secrets, RBAC, resource limits, and automated everything with CI/CD and Terraform. Happy to answer any questions!”
