# Eva Mental Health App - Production Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying Eva to production environments using Docker, Kubernetes, or cloud platforms.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Domain name configured
- SSL certificates (Let's Encrypt recommended)
- PostgreSQL database (managed or self-hosted)
- Redis instance (for caching)
- OpenAI API key
- (Optional) Epistemic Me SDK deployment

## 🔧 Environment Configuration

### 1. Create Production Environment File

Create `.env.production`:

```bash
# Application
NODE_ENV=production
APP_NAME=Eva Mental Health

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=eva_production
DB_USER=eva_user
DB_PASSWORD=strong_password_here

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_here

# JWT
JWT_SECRET=very_long_random_string_here
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Epistemic Me (Optional)
EPISTEMIC_ME_URL=https://epistemic-api.yourdomain.com
EPISTEMIC_ME_API_KEY=your_epistemic_api_key

# Frontend
FRONTEND_URL=https://eva.yourdomain.com
FRONTEND_API_URL=https://api.eva.yourdomain.com

# Security
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## 🐳 Docker Deployment

### 1. Build Production Images

```bash
# Build backend
docker build -f backend/Dockerfile.prod -t eva-backend:latest ./backend

# Build frontend
docker build -f frontend/Dockerfile.prod \
  --build-arg REACT_APP_API_URL=https://api.eva.yourdomain.com \
  -t eva-frontend:latest ./frontend
```

### 2. Deploy with Docker Compose

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Check health
docker-compose -f docker-compose.prod.yml ps
```

### 3. Setup SSL with Let's Encrypt

```bash
# Install certbot
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d eva.yourdomain.com \
  -d api.eva.yourdomain.com
```

## ☸️ Kubernetes Deployment

### 1. Create Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: eva-mental-health
```

### 2. Deploy Backend

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eva-backend
  namespace: eva-mental-health
spec:
  replicas: 3
  selector:
    matchLabels:
      app: eva-backend
  template:
    metadata:
      labels:
        app: eva-backend
    spec:
      containers:
      - name: backend
        image: your-registry/eva-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: production
        envFrom:
        - secretRef:
            name: eva-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: eva-backend
  namespace: eva-mental-health
spec:
  selector:
    app: eva-backend
  ports:
  - port: 3001
    targetPort: 3001
```

### 3. Deploy Frontend

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eva-frontend
  namespace: eva-mental-health
spec:
  replicas: 2
  selector:
    matchLabels:
      app: eva-frontend
  template:
    metadata:
      labels:
        app: eva-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/eva-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: eva-frontend
  namespace: eva-mental-health
spec:
  selector:
    app: eva-frontend
  ports:
  - port: 80
    targetPort: 80
```

### 4. Setup Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: eva-ingress
  namespace: eva-mental-health
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - eva.yourdomain.com
    - api.eva.yourdomain.com
    secretName: eva-tls
  rules:
  - host: eva.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: eva-frontend
            port:
              number: 80
  - host: api.eva.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: eva-backend
            port:
              number: 3001
```

## ☁️ Cloud Platform Deployments

### AWS Deployment

1. **RDS PostgreSQL**:
```bash
aws rds create-db-instance \
  --db-instance-identifier eva-production \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username evaadmin \
  --master-user-password your-password \
  --allocated-storage 100
```

2. **ECS Fargate**:
```bash
# Create task definition
aws ecs register-task-definition \
  --family eva-backend \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --container-definitions file://task-definition.json

# Create service
aws ecs create-service \
  --cluster eva-cluster \
  --service-name eva-backend \
  --task-definition eva-backend:1 \
  --desired-count 3 \
  --launch-type FARGATE
```

3. **CloudFront + S3** for frontend:
```bash
# Deploy frontend to S3
aws s3 sync frontend/build s3://eva-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Google Cloud Platform

1. **Cloud SQL**:
```bash
gcloud sql instances create eva-production \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1
```

2. **Cloud Run**:
```bash
# Deploy backend
gcloud run deploy eva-backend \
  --image gcr.io/your-project/eva-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy eva-frontend \
  --image gcr.io/your-project/eva-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Deployment

1. **Azure Database for PostgreSQL**:
```bash
az postgres server create \
  --resource-group eva-rg \
  --name eva-postgres \
  --admin-user evaadmin \
  --admin-password your-password \
  --sku-name B_Gen5_1
```

2. **Container Instances**:
```bash
az container create \
  --resource-group eva-rg \
  --name eva-backend \
  --image your-registry.azurecr.io/eva-backend:latest \
  --cpu 1 \
  --memory 1.5 \
  --ports 3001
```

## 📊 Monitoring & Logging

### 1. Prometheus + Grafana

Add to your backend:

```javascript
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### 2. Error Tracking with Sentry

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 3. Application Logs

Configure structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔒 Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured (using secrets management)
- [ ] Database connections encrypted
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security updates applied
- [ ] Backup strategy in place
- [ ] Incident response plan documented

## 🔄 CI/CD Pipeline

### GitHub Actions Deployment

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Production
      env:
        DEPLOY_KEY: ${{ secrets.PRODUCTION_DEPLOY_KEY }}
        PRODUCTION_HOST: ${{ secrets.PRODUCTION_HOST }}
      run: |
        echo "$DEPLOY_KEY" > deploy_key
        chmod 600 deploy_key
        ssh -i deploy_key -o StrictHostKeyChecking=no deploy@$PRODUCTION_HOST '
          cd /opt/eva-app &&
          git pull origin main &&
          docker-compose -f docker-compose.prod.yml build &&
          docker-compose -f docker-compose.prod.yml up -d &&
          docker-compose -f docker-compose.prod.yml exec backend npm run migrate
        '
```

## 📈 Scaling Considerations

1. **Database**: Use read replicas for scaling reads
2. **Caching**: Implement Redis caching for frequently accessed data
3. **CDN**: Use CloudFlare or AWS CloudFront for static assets
4. **Load Balancing**: Use nginx or cloud load balancers
5. **Horizontal Scaling**: Deploy multiple backend instances
6. **Queue System**: Add RabbitMQ/Redis Queue for background jobs

## 🔄 Backup & Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3
aws s3 cp backup_*.sql s3://eva-backups/database/

# Keep only last 30 days
find . -name "backup_*.sql" -mtime +30 -delete
```

### Recovery Process

1. **Database Recovery**:
```bash
psql $DATABASE_URL < backup_20240101_120000.sql
```

2. **Application Recovery**:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## 📞 Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- Monitor health endpoints
- Review error tracking in Sentry
- Contact support team

---

Remember: Always test deployments in staging before production!