# -----------------------------------------------
# Helper — current AWS account ID
# -----------------------------------------------
data "aws_caller_identity" "current" {}

# -----------------------------------------------
# ECR
# -----------------------------------------------
output "ecr_backend_url" {
  description = "ECR backend repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR frontend repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_registry" {
  description = "ECR registry URL (without repo name)"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

# -----------------------------------------------
# S3 + App IAM credentials
# -----------------------------------------------
output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.pocket_pdfs.bucket
}

output "app_access_key_id" {
  description = "App IAM key ID — use as AWS_ACCESS_KEY_ID"
  value       = aws_iam_access_key.app.id
}

output "app_secret_access_key" {
  description = "App IAM secret — use as AWS_SECRET_ACCESS_KEY"
  value       = aws_iam_access_key.app.secret
  sensitive   = true
}

# -----------------------------------------------
# EC2
# -----------------------------------------------
output "ec2_public_ip" {
  description = "Elastic IP — use this as EC2_HOST"
  value       = aws_eip.pocket_pdfs.public_ip
}

output "ec2_ssh_command" {
  description = "SSH command to connect manually"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.pocket_pdfs.public_ip}"
}


# -----------------------------------------------
# GitHub Actions OIDC Role
# -----------------------------------------------
output "github_actions_role_arn" {
  description = "IAM Role ARN — add as AWS_ROLE_ARN in GitHub Secrets"
  value       = aws_iam_role.github_actions.arn
}

# -----------------------------------------------
# GitHub Secrets summary — run after terraform apply
# -----------------------------------------------
output "github_secrets_summary" {
  description = "All GitHub Secrets to set after terraform apply"
  value       = <<-EOT
    Set these in GitHub → Settings → Secrets → Actions:

    EC2_HOST          = ${aws_eip.pocket_pdfs.public_ip}
    EC2_SSH_KEY       = (contents of ~/.ssh/${var.key_pair_name}.pem)
    AWS_ROLE_ARN      = ${aws_iam_role.github_actions.arn}
    AWS_REGION        = ${var.aws_region}
    ECR_REGISTRY      = ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com
    ECR_BACKEND_REPO  = ${aws_ecr_repository.backend.name}
    ECR_FRONTEND_REPO = ${aws_ecr_repository.frontend.name}
  EOT
}