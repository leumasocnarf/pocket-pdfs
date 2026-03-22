#!/bin/bash
set -e

# Update packages
dnf update -y

# Install Docker
dnf install -y docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install Docker Compose plugin
DOCKER_CONFIG=/home/ec2-user/.docker
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
chown -R ec2-user:ec2-user $DOCKER_CONFIG

# Add 2GB swap — prevents OOM on EC2
dd if=/dev/zero of=/swapfile bs=128M count=16
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

# Create app directories
mkdir -p /opt/pocket-pdfs/prod
mkdir -p /opt/pocket-pdfs/staging
chown -R ec2-user:ec2-user /opt/pocket-pdfs