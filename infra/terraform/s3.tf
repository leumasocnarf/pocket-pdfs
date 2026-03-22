# -----------------------------------------------
# S3 Bucket — shared between prod and staging
# -----------------------------------------------
resource "aws_s3_bucket" "pocket_pdfs" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = var.s3_bucket_name
    Project     = var.project_name
    Provisioned = "Terraform"
  }
}

# Block all public access — files served via presigned URLs only
resource "aws_s3_bucket_public_access_block" "pocket_pdfs" {
  bucket = aws_s3_bucket.pocket_pdfs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning — protects against accidental deletes
resource "aws_s3_bucket_versioning" "pocket_pdfs" {
  bucket = aws_s3_bucket.pocket_pdfs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# -----------------------------------------------
# IAM user for the Spring Boot app
# -----------------------------------------------
resource "aws_iam_user" "app" {
  name = "${var.project_name}-app"

  tags = {
    Project     = var.project_name
    Provisioned = "Terraform"
  }
}

resource "aws_iam_user_policy" "app_s3" {
  name = "${var.project_name}-s3-policy"
  user = aws_iam_user.app.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.pocket_pdfs.arn}/*"
      }
    ]
  })
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}
