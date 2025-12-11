# CareSync Runbook

This runbook provides troubleshooting steps for common issues encountered in the CareSync application deployed on AWS EKS.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Common Issues](#common-issues)
3. [Monitoring & Alerts](#monitoring--alerts)
4. [Recovery Procedures](#recovery-procedures)
5. [Contact Information](#contact-information)

---

## Quick Reference

### Access Commands

```bash
# Configure kubectl for EKS
aws eks update-kubeconfig --region us-east-1 --name shared-eks-cluster

# Check pods in namespace
kubectl get pods -n ian-malavi-mhambe

# Check pod logs
kubectl logs -n ian-malavi-mhambe <pod-name>

# Check pod events
kubectl describe pod -n ian-malavi-mhambe <pod-name>

# Check services
kubectl get svc -n ian-malavi-mhambe

# Check ingress
kubectl get ingress -n ian-malavi-mhambe
```

### Health Check URLs

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| Frontend | `/health` | `{"status":"healthy","service":"caresync-frontend"}` |
| Backend | `/api/health` | `{"status":"ok","timestamp":"..."}` |

---

## Common Issues

### 1. Pod CrashLoopBackOff

**Symptoms:**
- Pod status shows `CrashLoopBackOff`
- Pod restarts frequently

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n ian-malavi-mhambe

# Check pod logs
kubectl logs -n ian-malavi-mhambe <pod-name> --previous

# Check events
kubectl describe pod -n ian-malavi-mhambe <pod-name>
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Missing environment variables | Verify ConfigMap and Secrets are properly mounted |
| Database connection failure | Check DATABASE_URL secret and network connectivity |
| Application error | Check logs for stack traces |
| Memory limit exceeded | Increase resource limits in deployment |

**Resolution Steps:**
1. Check logs for the error message
2. Verify all required secrets exist:
   ```bash
   kubectl get secrets -n ian-malavi-mhambe
   ```
3. Verify ConfigMap:
   ```bash
   kubectl get configmap caresync-config -n ian-malavi-mhambe -o yaml
   ```
4. If database-related, test connectivity:
   ```bash
   kubectl exec -n ian-malavi-mhambe <pod-name> -- nc -zv <db-host> 5432
   ```

---

### 2. ImagePullBackOff

**Symptoms:**
- Pod status shows `ImagePullBackOff` or `ErrImagePull`

**Diagnosis:**
```bash
kubectl describe pod -n ian-malavi-mhambe <pod-name> | grep -A 10 Events
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Wrong image name/tag | Verify ECR repository and tag exist |
| ECR authentication failure | Check imagePullSecrets configuration |
| Image doesn't exist | Verify CI/CD pushed the image successfully |

**Resolution Steps:**
1. Verify image exists in ECR:
   ```bash
   aws ecr describe-images --repository-name ian-malavi-mhambe/backend --region us-east-1
   aws ecr describe-images --repository-name ian-malavi-mhambe/frontend --region us-east-1
   ```
2. Check imagePullSecrets in deployment
3. Manually pull to verify:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ecr-url>
   ```

---

### 3. High Latency / Slow Response Times

**Symptoms:**
- API responses taking > 2 seconds
- Frontend loading slowly
- Timeouts occurring

**Diagnosis:**
```bash
# Check pod resource usage
kubectl top pods -n ian-malavi-mhambe

# Check node resource usage
kubectl top nodes

# Check HPA status
kubectl get hpa -n ian-malavi-mhambe
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| CPU throttling | Increase CPU limits or add replicas |
| Memory pressure | Increase memory limits |
| Database queries slow | Check database connection pool, add indexes |
| Network issues | Check NetworkPolicy, service mesh |

**Resolution Steps:**
1. Check current resource usage:
   ```bash
   kubectl top pods -n ian-malavi-mhambe
   ```
2. Scale up if needed:
   ```bash
   kubectl scale deployment caresync-backend -n ian-malavi-mhambe --replicas=3
   ```
3. Check HPA is working:
   ```bash
   kubectl describe hpa -n ian-malavi-mhambe
   ```

---

### 4. 502/503/504 Gateway Errors

**Symptoms:**
- Ingress returns 502 Bad Gateway
- Intermittent 503 Service Unavailable
- 504 Gateway Timeout

**Diagnosis:**
```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Check backend pod health
kubectl get pods -n ian-malavi-mhambe -o wide

# Check service endpoints
kubectl get endpoints -n ian-malavi-mhambe
```

**Common Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| No healthy pods | Check pod health, readiness probes |
| Service misconfiguration | Verify service selector matches pod labels |
| Ingress path mismatch | Check ingress rules |
| Backend overloaded | Scale up replicas |

**Resolution Steps:**
1. Verify pods are ready:
   ```bash
   kubectl get pods -n ian-malavi-mhambe -o wide
   ```
2. Check service has endpoints:
   ```bash
   kubectl get endpoints caresync-backend -n ian-malavi-mhambe
   ```
3. Test service directly:
   ```bash
   kubectl port-forward svc/caresync-backend 5000:5000 -n ian-malavi-mhambe
   curl http://localhost:5000/api/health
   ```

---

### 5. Database Connection Issues

**Symptoms:**
- Backend pods fail to start
- Error logs show "connection refused" or "timeout"

**Diagnosis:**
```bash
# Check secret exists
kubectl get secret caresync-secrets -n ian-malavi-mhambe

# Check pod can reach database
kubectl exec -n ian-malavi-mhambe <backend-pod> -- nc -zv <db-host> 5432
```

**Resolution Steps:**
1. Verify DATABASE_URL secret:
   ```bash
   kubectl get secret caresync-secrets -n ian-malavi-mhambe -o jsonpath='{.data.DATABASE_URL}' | base64 -d
   ```
2. Test database connectivity from pod:
   ```bash
   kubectl exec -n ian-malavi-mhambe <pod> -- sh -c "nc -zv $DB_HOST 5432"
   ```
3. Check NetworkPolicy allows egress to database

---

### 6. Frontend Cannot Call Backend API

**Symptoms:**
- Frontend shows "Network Error"
- API calls fail with CORS errors
- 404 errors on /api routes

**Diagnosis:**
```bash
# Check nginx config
kubectl exec -n ian-malavi-mhambe <frontend-pod> -- cat /etc/nginx/conf.d/default.conf

# Check backend service
kubectl get svc caresync-backend -n ian-malavi-mhambe
```

**Resolution Steps:**
1. Verify backend service is running
2. Check nginx proxy_pass configuration
3. Verify CORS settings in backend
4. Test backend directly:
   ```bash
   kubectl port-forward svc/caresync-backend 5000:5000 -n ian-malavi-mhambe
   curl http://localhost:5000/api/health
   ```

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 75% | > 90% |
| Pod Restarts | > 3/hour | > 10/hour |
| Response Time (P95) | > 500ms | > 2000ms |
| Error Rate | > 1% | > 5% |

### Checking Metrics

```bash
# Pod resource usage
kubectl top pods -n ian-malavi-mhambe

# Node resource usage
kubectl top nodes

# HPA status
kubectl get hpa -n ian-malavi-mhambe -o wide
```

---

## Recovery Procedures

### Rolling Restart

```bash
# Restart backend
kubectl rollout restart deployment/caresync-backend -n ian-malavi-mhambe

# Restart frontend
kubectl rollout restart deployment/caresync-frontend -n ian-malavi-mhambe

# Check rollout status
kubectl rollout status deployment/caresync-backend -n ian-malavi-mhambe
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/caresync-backend -n ian-malavi-mhambe

# Rollback to previous version
kubectl rollout undo deployment/caresync-backend -n ian-malavi-mhambe

# Rollback to specific revision
kubectl rollout undo deployment/caresync-backend -n ian-malavi-mhambe --to-revision=2
```

### Scale Operations

```bash
# Scale up
kubectl scale deployment caresync-backend -n ian-malavi-mhambe --replicas=5

# Scale down
kubectl scale deployment caresync-backend -n ian-malavi-mhambe --replicas=2
```

### Emergency: Delete and Recreate Pod

```bash
# Delete pod (deployment will recreate it)
kubectl delete pod <pod-name> -n ian-malavi-mhambe

# Force delete stuck pod
kubectl delete pod <pod-name> -n ian-malavi-mhambe --grace-period=0 --force
```

---

## Contact Information

### DevOps Team

| Name | Email | Role |
|------|-------|------|
| Daniel | dan@tiberbu.com | DevOps Lead |
| James | njoroge@tiberbu.com | DevOps Engineer |
| Elvis | elvis@tiberbu.com | DevOps Engineer |

### Escalation Path

1. **Level 1**: Check this runbook, attempt self-resolution
2. **Level 2**: Contact DevOps team via email
3. **Level 3**: Emergency contact for production outages

---

## Appendix: Useful Commands

### Logs

```bash
# Follow logs
kubectl logs -f -n ian-malavi-mhambe <pod-name>

# Logs from previous container
kubectl logs -n ian-malavi-mhambe <pod-name> --previous

# All logs from deployment
kubectl logs -n ian-malavi-mhambe -l app.kubernetes.io/name=caresync-backend --tail=100
```

### Exec into Pod

```bash
# Shell into pod
kubectl exec -it -n ian-malavi-mhambe <pod-name> -- /bin/sh

# Run single command
kubectl exec -n ian-malavi-mhambe <pod-name> -- env
```

### Port Forwarding

```bash
# Forward backend
kubectl port-forward svc/caresync-backend 5000:5000 -n ian-malavi-mhambe

# Forward frontend
kubectl port-forward svc/caresync-frontend 8080:80 -n ian-malavi-mhambe
```

### Resource Inspection

```bash
# All resources in namespace
kubectl get all -n ian-malavi-mhambe

# Detailed pod info
kubectl describe pod -n ian-malavi-mhambe <pod-name>

# Events in namespace
kubectl get events -n ian-malavi-mhambe --sort-by='.lastTimestamp'
```
