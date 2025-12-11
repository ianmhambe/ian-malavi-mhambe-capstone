# CareSync - Healthcare Patient Appointment Scheduler

A comprehensive full-stack healthcare web application for managing patient appointments, doctor availability, and administrative tasks. Built with modern technologies and best practices, deployed on AWS EKS for production-grade scalability and reliability.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)
![Kubernetes](https://img.shields.io/badge/kubernetes-1.28-326ce5.svg)
![AWS](https://img.shields.io/badge/AWS-EKS-FF9900.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start with Docker](#quick-start-with-docker)
  - [Manual Setup](#manual-setup)
- [Production Deployment](#-production-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Default Users](#-default-users)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### For Patients
- 🔍 Browse and search doctors by specialization
- 📅 Book appointments with available time slots
- 📋 View appointment history and upcoming appointments
- 🔔 Receive notifications for appointment updates
- 👤 Manage personal profile and health information

### For Doctors
- 📊 Dashboard with appointment statistics
- 🕐 Set weekly availability schedule
- ✅ Accept, reject, or complete appointments
- 📝 Add notes to completed appointments
- 📈 View patient information

### For Administrators
- 👥 Manage doctors and patients
- 📊 View platform analytics and metrics
- 📋 View all appointments system-wide
- 🔄 Activate/deactivate user accounts

### General Features
- 🔐 Secure JWT-based authentication with refresh tokens
- 🛡️ Role-based access control (Admin, Doctor, Patient)
- 📱 Responsive design for all devices
- 🔔 Real-time notifications
- 🎨 Clean, modern UI with Tailwind CSS

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 15
- **ORM:** Prisma 5.x
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Logging:** Pino
- **Security:** Helmet, CORS, Rate Limiting

### Frontend
- **Framework:** React 18 with Vite 5
- **Styling:** Tailwind CSS 3.x
- **Routing:** React Router 6
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Notifications:** react-hot-toast

### DevOps & Infrastructure
- **Containerization:** Docker & Docker Compose
- **Orchestration:** Kubernetes (AWS EKS)
- **Infrastructure as Code:** Terraform
- **CI/CD:** GitHub Actions
- **Container Registry:** Amazon ECR
- **Load Balancer:** AWS ALB (Application Load Balancer)
- **Database (Production):** Amazon RDS PostgreSQL
- **Monitoring:** Prometheus & Grafana
- **Web Server:** Nginx (production)

## 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React App     │────▶│   Express API   │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│     Nginx       │     │     Prisma      │
│   (Reverse      │     │     (ORM)       │
│    Proxy)       │     │                 │
└─────────────────┘     └─────────────────┘
```

### Production Architecture (AWS EKS)

```
                                    ┌─────────────────────────────────────┐
                                    │           AWS Cloud                  │
                                    │                                      │
┌──────────┐    ┌──────────────┐   │   ┌─────────────────────────────┐   │
│          │    │              │   │   │         EKS Cluster          │   │
│  Users   │───▶│   Route 53   │───┼──▶│                              │   │
│          │    │   (DNS)      │   │   │  ┌─────────┐  ┌─────────┐   │   │
└──────────┘    └──────────────┘   │   │  │Frontend │  │Backend  │   │   │
                                    │   │  │ Pods    │  │ Pods    │   │   │
                      │             │   │  │ (2-5)   │  │ (2-10)  │   │   │
                      ▼             │   │  └────┬────┘  └────┬────┘   │   │
               ┌──────────────┐    │   │       │            │        │   │
               │   AWS ALB    │────┼──▶│       └────┬───────┘        │   │
               │ (Load        │    │   │            │                │   │
               │  Balancer)   │    │   │            ▼                │   │
               └──────────────┘    │   │    ┌─────────────┐          │   │
                      │             │   │    │   HPA       │          │   │
                      │             │   │    │ (Autoscale) │          │   │
               ┌──────────────┐    │   │    └─────────────┘          │   │
               │   AWS ACM    │    │   └─────────────────────────────┘   │
               │ (SSL Cert)   │    │                  │                   │
               └──────────────┘    │                  ▼                   │
                                    │   ┌─────────────────────────────┐   │
                                    │   │       Amazon RDS            │   │
                                    │   │     (PostgreSQL)            │   │
                                    │   │   Multi-AZ, Encrypted       │   │
                                    │   └─────────────────────────────┘   │
                                    │                                      │
                                    │   ┌─────────────────────────────┐   │
                                    │   │      Amazon ECR             │   │
                                    │   │  (Container Registry)       │   │
                                    │   └─────────────────────────────┘   │
                                    │                                      │
                                    └─────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Docker** and **Docker Compose** (for containerized deployment)
- **PostgreSQL** 15 (if running locally without Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/caresync.git
   cd caresync
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your secure values (especially JWT secrets)
   ```

3. **Build and start containers**
   ```bash
   docker-compose up -d --build
   ```

4. **Run database migrations and seed**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npm run db:seed
   ```

5. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - pgAdmin (optional): http://localhost:5050

### Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL with your PostgreSQL connection string
   ```

4. **Set up database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database with sample data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:5000`

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Default settings should work for local development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 🚀 Production Deployment

### AWS EKS Deployment

CareSync is designed for production deployment on AWS EKS. See the full [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

#### Quick Overview

1. **Infrastructure Setup with Terraform**
   ```bash
   cd terraform
   terraform init
   terraform apply -var="rds_password=YourSecurePassword"
   ```

2. **Build and Push Docker Images**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push images
   docker build -t caresync-backend:v1.0.0 ./backend
   docker push <ecr-url>/caresync-backend:v1.0.0
   ```

3. **Deploy with Helm**
   ```bash
   helm upgrade --install caresync ./helm/caresync \
     --namespace caresync \
     --create-namespace \
     --set image.registry=<ecr-registry>
   ```

#### CI/CD Pipeline

The project includes GitHub Actions workflows for:
- Automated testing on pull requests
- Security scanning with Trivy
- Docker image building and pushing to ECR
- Automated deployment to EKS
- Terraform infrastructure management
- Email notifications for deployment status via Gmail

##### Setting Up Gmail Notifications

To receive deployment notifications via email, configure these secrets in your GitHub repository:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated 16-character password

3. **Add GitHub Repository Secrets** (Settings → Secrets and variables → Actions):
   - `GMAIL_USERNAME`: Your Gmail address (e.g., yourname@gmail.com)
   - `GMAIL_APP_PASSWORD`: The 16-character app password from step 2
   - `GMAIL_TO`: Email address to receive notifications (can be the same as GMAIL_USERNAME)

##### Other Required Secrets for CI/CD

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for ECR/EKS access |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `GMAIL_USERNAME` | Gmail address for sending notifications |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `GMAIL_TO` | Recipient email for notifications |

#### Infrastructure Components

| Component | Service | Description |
|-----------|---------|-------------|
| Kubernetes | AWS EKS | Managed Kubernetes cluster |
| Database | Amazon RDS | Multi-AZ PostgreSQL 15 |
| Container Registry | Amazon ECR | Docker image storage |
| Load Balancer | AWS ALB | Application load balancer |
| DNS | Route 53 | DNS management |
| SSL | AWS ACM | SSL/TLS certificates |
| Secrets | AWS Secrets Manager | Secure credential storage |
| Monitoring | Prometheus/Grafana | Metrics and dashboards |

#### Scaling

- **Horizontal Pod Autoscaler (HPA)**: Automatically scales pods based on CPU/memory
  - Backend: 2-10 replicas (target 50% CPU)
  - Frontend: 2-5 replicas (target 50% CPU)
- **Cluster Autoscaler**: Automatically adjusts node count (2-10 nodes)
- **RDS**: Auto-scaling storage up to 100GB

## 📁 Project Structure

```
caresync/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Database seeder
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   ├── validators/        # Zod validation schemas
│   │   └── index.js           # Application entry point
│   ├── Dockerfile             # Production Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── layouts/           # Page layouts
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin pages
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── doctor/        # Doctor pages
│   │   │   └── patient/       # Patient pages
│   │   ├── services/          # API service functions
│   │   ├── store/             # Zustand state management
│   │   ├── App.jsx            # Main application component
│   │   ├── main.jsx           # Application entry point
│   │   └── index.css          # Global styles
│   ├── Dockerfile             # Production Dockerfile
│   ├── nginx.conf             # Nginx configuration
│   └── package.json
│
├── helm/
│   └── caresync/              # Helm chart for Kubernetes
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/         # K8s manifest templates
│
├── k8s/                       # Raw Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── postgres-statefulset.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── network-policy.yaml
│   ├── pod-disruption-budget.yaml
│   └── monitoring/            # Prometheus & Grafana configs
│
├── terraform/                 # AWS Infrastructure as Code
│   ├── main.tf               # Provider configuration
│   ├── variables.tf          # Input variables
│   ├── outputs.tf            # Output values
│   ├── vpc.tf                # VPC configuration
│   ├── eks.tf                # EKS cluster
│   ├── rds.tf                # RDS PostgreSQL
│   ├── ecr.tf                # ECR repositories
│   └── eks-addons.tf         # ALB Controller, Autoscaler
│
├── .github/
│   └── workflows/             # GitHub Actions CI/CD
│       ├── ci-cd.yml         # Main CI/CD pipeline
│       └── terraform.yml     # Infrastructure pipeline
│
├── docs/
│   └── DEPLOYMENT.md         # Production deployment guide
│
├── docker-compose.yml         # Local development
├── .env.example               # Environment variables template
└── README.md
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Patient Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | Get all patients (Admin) |
| GET | `/api/patients/dashboard` | Get patient dashboard |
| GET | `/api/patients/:id` | Get patient by ID |

### Doctor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | Get all doctors |
| GET | `/api/doctors/specializations` | Get specializations |
| GET | `/api/doctors/dashboard` | Get doctor dashboard |
| GET | `/api/doctors/:id` | Get doctor by ID |
| GET | `/api/doctors/:id/availability` | Get doctor availability |
| POST | `/api/doctors/availability` | Set availability |

### Appointment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | Get appointments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/:id` | Get appointment details |
| PUT | `/api/appointments/:id/status` | Update appointment status |
| DELETE | `/api/appointments/:id` | Cancel appointment |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/metrics` | Get platform metrics |
| GET | `/api/admin/specialization-stats` | Get specialization statistics |
| PUT | `/api/admin/users/:id/toggle-status` | Toggle user status |
| DELETE | `/api/admin/users/:id` | Delete user |

## 👥 Default Users

After running the database seed, you can login with these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@caresync.com | Admin@123 |
| Doctor | dr.smith@caresync.com | Doctor@123 |
| Doctor | dr.johnson@caresync.com | Doctor@123 |
| Doctor | dr.williams@caresync.com | Doctor@123 |
| Doctor | dr.brown@caresync.com | Doctor@123 |
| Patient | john.doe@email.com | Patient@123 |
| Patient | jane.doe@email.com | Patient@123 |
| Patient | bob.wilson@email.com | Patient@123 |

## ⚙️ Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/caresync_db

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=<generate-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-secret-min-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

### Docker (.env)

```env
POSTGRES_USER=caresync
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=caresync_db
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
```

## 📜 Scripts

### Backend

```bash
npm run dev          # Start development server
npm start            # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Docker

```bash
docker-compose up -d              # Start all services
docker-compose up -d --build      # Rebuild and start
docker-compose down               # Stop all services
docker-compose logs -f            # View logs
docker-compose exec backend sh    # Access backend shell
docker-compose --profile dev up   # Start with pgAdmin
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the CareSync Team
