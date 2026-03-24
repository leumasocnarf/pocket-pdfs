# Declare to use the default VPC
data "aws_vpc" "default" {
  default = true
}

# -----------------------------------------------
# Security Group
# -----------------------------------------------
resource "aws_security_group" "pocket_pdfs_sg" {
  name        = "${var.project_name}-sg"
  description = "Security group for ${var.project_name}"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name        = "${var.project_name}-sg"
    Project     = var.project_name
    Provisioned = "Terraform"
  }
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.pocket_pdfs_sg.id
  description       = "SSH"
  cidr_ipv4         = var.allowed_ssh_cidr
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "http_prod" {
  security_group_id = aws_security_group.pocket_pdfs_sg.id
  description       = "HTTP prod frontend"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "https_prod" {
  security_group_id = aws_security_group.pocket_pdfs_sg.id
  description       = "HTTPS prod frontend"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "http_staging" {
  security_group_id = aws_security_group.pocket_pdfs_sg.id
  description       = "HTTP staging frontend - intentionally public for portfolio visibility"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 3001
  to_port           = 3001
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all_outbound" {
  security_group_id = aws_security_group.pocket_pdfs_sg.id
  description       = "Allow all outbound"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}


# -----------------------------------------------
# IAM Role for EC2 — allows pulling images from ECR
# -----------------------------------------------
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "ecr_read" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}


# -----------------------------------------------
# EC2 Instance
# -----------------------------------------------
resource "aws_instance" "pocket_pdfs" {
  ami                    = var.ec2_ami
  instance_type          = var.ec2_instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.pocket_pdfs_sg.id]

  # IAM role so EC2 can pull from ECR without extra credentials
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  # Custom definition with 20GB — also enough for Docker images
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  # Install Docker on first boot
  user_data = file("${path.module}/scripts/setup_docker.sh")

  tags = {
    Name        = var.project_name
    Project     = var.project_name
    Provisioned = "Terraform"
  }
}

# -----------------------------------------------
# Elastic IP — stable IP across reboots
# -----------------------------------------------
resource "aws_eip" "pocket_pdfs" {
  instance = aws_instance.pocket_pdfs.id
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-eip"
    Project     = var.project_name
    Provisioned = "Terraform"
  }
}

