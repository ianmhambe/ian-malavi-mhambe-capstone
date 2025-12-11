# Outputs for CareSync Infrastructure

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

# EKS Outputs
output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_version" {
  description = "The Kubernetes version of the EKS cluster"
  value       = module.eks.cluster_version
}

output "eks_cluster_security_group_id" {
  description = "The security group ID of the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_oidc_provider_arn" {
  description = "The OIDC provider ARN for the EKS cluster"
  value       = module.eks.oidc_provider_arn
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

# RDS Outputs
output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "The address of the RDS instance"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "The port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "rds_credentials_secret_arn" {
  description = "The ARN of the RDS credentials secret in Secrets Manager"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

# ECR Outputs
output "ecr_backend_repository_url" {
  description = "The URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "The URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_repository_name" {
  description = "The name of the backend ECR repository"
  value       = aws_ecr_repository.backend.name
}

output "ecr_frontend_repository_name" {
  description = "The name of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.name
}

# Kubeconfig command
output "configure_kubectl" {
  description = "Command to configure kubectl for the EKS cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

# Helm deployment command
output "helm_deploy_command" {
  description = "Command to deploy CareSync with Helm"
  value       = <<-EOT
    helm install caresync ./helm/caresync \
      --namespace caresync \
      --create-namespace \
      --set image.registry=${aws_ecr_repository.backend.repository_url} \
      --set ingress.hosts[0].host=${var.domain_name} \
      --set externalDatabase.host=${aws_db_instance.main.address} \
      --set externalDatabase.port=${aws_db_instance.main.port} \
      --set postgresql.enabled=false
  EOT
}
