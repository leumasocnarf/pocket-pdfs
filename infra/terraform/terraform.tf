# ----------------------------------------------------------
# Terraform configuration for Pocket PDFs infrastructure
# ----------------------------------------------------------
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }
  }

  required_version = ">= 1.2"

  # Configure the S3 backend for Terraform state management
  backend "s3" {
    bucket         = "pocket-pdfs-terraform-state"
    key            = "pocket-pdfs/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "pocket-pdfs-terraform-lock"
    encrypt        = true
  }
}
