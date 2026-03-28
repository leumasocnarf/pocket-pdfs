# Pocket PDFs

![Backend CI](https://github.com/leumasocnarf/pocket-pdfs/actions/workflows/backend-ci.yaml/badge.svg)
![Frontend CI](https://github.com/leumasocnarf/pocket-pdfs/actions/workflows/frontend-ci.yaml/badge.svg)

Pocket PDFs is a fullstack web application that lets users securely upload, preview, download, and manage PDF files in the cloud.

## Tech Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Backend        | Java 25 · Spring Boot · Spring Security · Gradle    |
| Frontend       | React · TypeScript · Vite · Axios · Bun             |
| Storage        | AWS S3 · PostgreSQL 18                              |
| Infrastructure | AWS EC2 · ECR · Terraform · Docker · Nginx          |
| CI/CD          | GitHub Actions                                      |
| Auth           | JWT (JSON Web Tokens)                               |
| Monitoring     | Sentry                                              |
| Testing        | JUnit · Mockito (backend) · Vitest · MSW (frontend) |

## Prerequisites

Make sure the following tools are installed before running the project locally:

- **Java** 25+ (JDK)
- **Gradle** 9+
- **Bun** 1.3+
- **Docker** and **Docker Compose**
- **AWS CLI** v2 (configured with valid credentials)
- **Terraform** 1.14+

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/pocket-pdfs.git
cd pocket-pdfs
```

### 2. Set up environment variables

```bash
# Copy the example environment file and fill in your values:
cp .env.example .env
```

Open `.env` and configure each variable (see the [Environment Variables](#environment-variables) table below). These values are injected into the backend and frontend containers through Docker Compose.

For the deploy script, also configure `.deploy.env`:

```bash
cp .deploy.env.example .deploy.env
```

> **⚠️ Never commit real secrets.** Use `.env.example` files with placeholder values as a reference.

### 3. Run with Docker Compose

Run the full stack with Docker:

```bash
# Use the staging environment
cd infra/staging
docker compose up --build
```

This spins up the backend, frontend, and Nginx reverse proxy together.

## Environment Variables

Environment variables are injected into the containers through Docker Compose. Copy `.env.example` to `.env` at the project root and fill in your values.

### `.env` — Application config (used by Docker Compose)

| Variable            | Description                            | Example                                            |
| ------------------- | -------------------------------------- | -------------------------------------------------- |
| `DB_NAME`           | PostgreSQL database name               | `your-staging-db`                                  |
| `DB_HOST`           | Database host (Docker service name)    | `postgres-staging`                                 |
| `DB_USERNAME`       | Database user                          | `your-staging-user`                                |
| `DB_PASSWORD`       | Database password                      | `your-staging-secret`                              |
| `DB_PORT`           | Database port                          | `5432`                                             |
| `JWT_SECRET`        | Secret key for signing JWTs            | `your-staging-jwt-secret`                          |
| `JWT_EXPIRATION_MS` | Token expiration time in milliseconds  | `86400000` (24 hours)                              |
| `ADMIN_USERNAME`    | Default admin account username         | `your-admin-username`                              |
| `ADMIN_PASSWORD`    | Default admin account password         | `your-staging-password`                            |
| `AWS_REGION`        | AWS region for S3 and ECR              | `us-east-1`                                        |
| `AWS_S3_BUCKET`     | S3 bucket name for PDF storage         | `pocket-pdfs-bucket`                               |
| `AWS_S3_PREFIX`     | Key prefix for uploaded files in S3    | `pdfs-staging/`                                    |
| `AWS_ECR`           | ECR registry URL for Docker images     | `some-number-here.dkr.ecr.us-east-1.amazonaws.com` |
| `SPRING_SENTRY_DSN` | Sentry DSN for backend error tracking  | `https://...@sentry.io/...`                        |
| `VITE_SENTRY_DSN`   | Sentry DSN for frontend error tracking | `https://...@sentry.io/...`                        |

### `.deploy.env` — Deployment config (used by deploy scripts)

| Variable            | Description                            | Example                     |
| ------------------- | -------------------------------------- | --------------------------- |
| `KEY_PATH`          | Path to SSH private key for EC2 access | `~/.ssh/your-key.pem`       |
| `REGION`            | AWS region for deployment              | `us-east-1`                 |
| `EC2_USER`          | SSH user on the EC2 instance           | `your-ec2-user`             |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for release tracking | `sntrys_...`                |
| `VITE_SENTRY_DSN`   | Sentry DSN passed to frontend at build | `https://...@sentry.io/...` |

## Testing

### Backend

```bash
cd backend
./gradlew test
```

The backend uses **JUnit 5** and **Mockito** for unit and integration testing.

### Frontend

```bash
cd frontend
bun run test
```

The frontend uses **Vitest** as the test runner and **MSW** (Mock Service Worker) to mock API responses during tests.

## CI/CD Pipeline

The project uses **GitHub Actions** with four workflows and follows a **two-branch strategy**: `develop` for staging and `main` for production.

| Workflow              | Trigger                                                       | Purpose                                                    |
| --------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| `backend-ci.yaml`     | Push to `main` or PR to `main`/`develop` (only `backend/**`)  | Build and test the Spring Boot backend                     |
| `frontend-ci.yaml`    | Push to `main` or PR to `main`/`develop` (only `frontend/**`) | Install dependencies, lint, and test the React app         |
| `deploy-staging.yaml` | Push to `develop`                                             | Build Docker images, push to ECR, deploy to staging EC2    |
| `deploy-prod.yaml`    | Push to `main`                                                | Build Docker images, push to ECR, deploy to production EC2 |

- **CI workflows are path-scoped.** Changes to `backend/` only trigger the backend CI, and changes to `frontend/` only trigger the frontend CI. This avoids wasting runner minutes on unchanged code.
- **Staging deploys from `develop`, production deploys from `main`.** The typical flow is: open a PR against `develop` → CI runs → merge → staging deploy triggers automatically → once validated, merge `develop` into `main` → production deploy triggers automatically.
- **GitHub authenticates with AWS through OIDC federation** — no long-lived AWS credentials are stored as repository secrets. The trust relationship is defined in `infra/terraform/oidc.tf`.

## Infrastructure

All AWS resources are provisioned with **Terraform** and defined in `infra/terraform/`:

| Resource | File      | Purpose                                        |
| -------- | --------- | ---------------------------------------------- |
| EC2      | `ec2.tf`  | Hosts the Docker Compose application stack     |
| ECR      | `ecr.tf`  | Container registry for backend/frontend images |
| S3       | `s3.tf`   | Stores uploaded PDF files                      |
| OIDC     | `oidc.tf` | GitHub Actions → AWS trust relationship        |

### Provisioning infrastructure

```bash
cd infra/terraform
terraform init
terraform plan

# Review the resources to be created then:
terraform apply
```

### Deploying

Staging and production each have their own `compose.yaml`, `nginx.conf`, and `deploy.sh` inside `infra/staging/` and `infra/prod/` respectively. The deploy scripts pull the latest images from ECR and restart the containers without Github Actions.

## Monitoring

**Sentry** is integrated in both the backend and the frontend to capture unhandled exceptions and errors in real time. Configure the `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend) environment variables to enable it.
