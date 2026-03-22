#!/bin/bash
set -e

# Load shared deploy config
source "$(dirname "$0")/../.deploy.env"

# Derived values
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_ECR="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
EC2_HOST=$(cd "$(dirname "$0")/../terraform" && terraform output -raw ec2_public_ip)
APP_DIR="/opt/pocket-pdfs/prod"
TERRAFORM_DIR="$(dirname "$0")/../terraform"

# Fetch dynamic values from Terraform
APP_ACCESS_KEY_ID=$(cd $TERRAFORM_DIR && terraform output -raw -no-color app_access_key_id)
APP_SECRET_ACCESS_KEY=$(cd $TERRAFORM_DIR && terraform output -raw -no-color app_secret_access_key)

# Validate Terraform outputs were retrieved
if [ -z "$APP_ACCESS_KEY_ID" ] || [ -z "$APP_SECRET_ACCESS_KEY" ]; then
  echo "ERROR: Could not retrieve AWS credentials from Terraform output."
  echo "Run 'terraform output' from infra/terraform/ to diagnose."
  exit 1
fi


echo "==> [0/6] Waiting for EC2 to be ready..."
until ssh -i $KEY_PATH \
  -o ConnectTimeout=5 \
  -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  $EC2_USER@$EC2_HOST "test -d /opt/pocket-pdfs/prod" 2>/dev/null; do
  echo "    EC2 not ready yet, retrying in 15s..."
  sleep 15
done
echo "    EC2 is ready!"


echo "==> [1/6] Syncing .env to EC2..."
# Copy static .env first
scp -i $KEY_PATH \
  "$(dirname "$0")/.env" \
  $EC2_USER@$EC2_HOST:$APP_DIR/.env

# Write dynamic values to a temp file locally
TEMP_ENV=$(mktemp)
echo "AWS_ACCESS_KEY_ID=$APP_ACCESS_KEY_ID" >> $TEMP_ENV
echo "AWS_SECRET_ACCESS_KEY=$APP_SECRET_ACCESS_KEY" >> $TEMP_ENV
echo "CORS_ALLOWED_ORIGINS=http://$EC2_HOST" >> $TEMP_ENV

# Copy temp file to EC2 and append to .env
scp -i $KEY_PATH $TEMP_ENV $EC2_USER@$EC2_HOST:/tmp/dynamic.env
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST \
  "cat /tmp/dynamic.env >> $APP_DIR/.env && rm /tmp/dynamic.env"

# Clean up locally
rm $TEMP_ENV


echo "==> [2/6] Authenticating with ECR..."
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $AWS_ECR


echo "==> [3/6] Building and pushing prod images..."
docker buildx build --platform linux/amd64 \
  -t $AWS_ECR/pocket-pdfs/backend:prod \
  --push "$(dirname "$0")/../../backend"

docker buildx build --platform linux/amd64 \
  -t $AWS_ECR/pocket-pdfs/frontend:prod \
  --push "$(dirname "$0")/../../frontend"


echo "==> [4/6] Copying config files to EC2..."
scp -i $KEY_PATH \
  "$(dirname "$0")/compose.yaml" \
  "$(dirname "$0")/nginx.conf" \
  $EC2_USER@$EC2_HOST:$APP_DIR/


echo "==> [5/6] Deploying on EC2..."
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST << ENDSSH
  set -e

  aws ecr get-login-password --region $REGION \
    | docker login --username AWS --password-stdin \
    $AWS_ECR

  cd $APP_DIR
  docker compose pull
  docker compose up -d
ENDSSH

echo "==> [6/6] Done! Prod is live at http://$EC2_HOST"