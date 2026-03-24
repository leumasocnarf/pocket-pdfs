# -----------------------------------------------
# GitHub Actions OIDC Provider
# Allows GitHub Actions to assume AWS roles
# without storing long-lived credentials
# -----------------------------------------------
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = []

  tags = {
    Project     = var.project_name
    Provisioned = "Terraform"
  }
}

# -----------------------------------------------
# IAM Role — assumed by GitHub Actions via OIDC
# -----------------------------------------------
resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          # Restricts to your specific repo — replace with your GitHub username
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_username}/${var.project_name}:*"
        }
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Project     = var.project_name
    Provisioned = "Terraform"
  }
}

# -----------------------------------------------
# ECR push policy — attached to the role
# -----------------------------------------------
resource "aws_iam_role_policy" "github_actions_ecr" {
  name = "${var.project_name}-github-actions-ecr-policy"
  role = aws_iam_role.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # ecr:GetAuthorizationToken cannot be resource scoped
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = [
          aws_ecr_repository.backend.arn,
          aws_ecr_repository.frontend.arn
        ]
      }
    ]
  })
}
