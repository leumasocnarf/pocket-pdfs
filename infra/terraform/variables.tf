variable "aws_region" {
  description = "AWS region to deploy all resources"
  type        = string
}

variable "project_name" {
  description = "Project name used to tag and name all resources"
  type        = string
  default     = "pocket-pdfs"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "ec2_ami" {
  description = "Amazon Linux 2023 AMI ID"
  type        = string
}

variable "key_pair_name" {
  description = "Name of the AWS key pair for SSH access"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "Your IP in CIDR notation for SSH access e.g. 203.0.113.0/32."
  type        = string
}

variable "s3_bucket_name" {
  description = "Globally unique S3 bucket name for PDF storage"
  type        = string
}
