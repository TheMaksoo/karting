# 🚀 Karting Dashboard - Deployment Guide

> **Production Deployment Guide**  
> Docker, Kubernetes, and Cloud Deployment Instructions

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Cloud Platform Guides](#cloud-platform-guides)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Docker 24.0+ (with Docker Compose)
- Kubernetes 1.28+ (for K8s deployment)
- kubectl CLI tool
- Git
- Domain name with SSL certificate

### Required Services
- MySQL 8.0+ (or PostgreSQL 15+)
- Redis 7.0+ (for caching)
- SMTP server (for emails)
- Sentry account (for error tracking)
- Storage service (S3, MinIO, or local)

### Required Environment Variables
See [Environment Variables](#environment-variables) section below.

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/karting-dashboard.git
cd karting-dashboard
```

### 2. Configure Environment Variables

Create `.env` files for both backend and frontend:

#### Backend (portal/backend/.env)
```env
# Application
APP_NAME="Karting Dashboard"
APP_ENV=production
APP_KEY=base64:GENERATE_WITH_php_artisan_key:generate
APP_DEBUG=false
APP_URL=https://api.karting.example.com

# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=karting_production
DB_USERNAME=karting_user
DB_PASSWORD=SECURE_PASSWORD_HERE

# Cache & Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=SECURE_REDIS_PASSWORD
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=noreply@karting.example.com
MAIL_PASSWORD=MAIL_PASSWORD_HERE
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@karting.example.com
MAIL_FROM_NAME="${APP_NAME}"

# Authentication
SANCTUM_STATEFUL_DOMAINS=karting.example.com
SESSION_LIFETIME=120
SANCTUM_TOKEN_EXPIRATION=1440

# Security
CSP_REPORT_URI=https://sentry.io/api/YOUR_PROJECT/security/?sentry_key=YOUR_KEY

# CORS
CORS_ALLOWED_ORIGINS=https://karting.example.com

# Sentry Error Tracking
SENTRY_LARAVEL_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_SEND_DEFAULT_PII=false

# Logging
LOG_CHANNEL=json
LOG_LEVEL=warning
LOG_DAILY_DAYS=30

# Database Performance
DB_LOG_SLOW_QUERIES=true
DB_SLOW_QUERY_THRESHOLD=1000

# Storage
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=karting-uploads
AWS_USE_PATH_STYLE_ENDPOINT=false
```

#### Frontend (portal/frontend/.env.production)
```env
VITE_API_BASE_URL=https://api.karting.example.com/api
VITE_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/project-id
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_APP_VERSION=1.0.0
```

---

## Docker Deployment

### 1. Create Dockerfiles

#### Backend Dockerfile (`portal/backend/Dockerfile`)
```dockerfile
FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    git \
    zip \
    unzip \
    libpng-dev \
    libzip-dev \
    mysql-client \
    && docker-php-ext-install pdo pdo_mysql zip gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Copy nginx and supervisor configurations
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port
EXPOSE 80

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

#### Frontend Dockerfile (`portal/frontend/Dockerfile`)
```dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: karting-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: karting_production
      MYSQL_USER: karting_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - karting-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: karting-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - karting-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Laravel Backend
  backend:
    build:
      context: ./portal/backend
      dockerfile: Dockerfile
    container_name: karting-backend
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - APP_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    volumes:
      - ./portal/backend/storage:/var/www/html/storage
      - ./portal/backend/.env:/var/www/html/.env
    networks:
      - karting-network
    healthcheck:
      test: ["CMD", "php", "artisan", "health:check"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Vue Frontend
  frontend:
    build:
      context: ./portal/frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    container_name: karting-frontend
    restart: unless-stopped
    networks:
      - karting-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: karting-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - karting-network

networks:
  karting-network:
    driver: bridge

volumes:
  mysql_data:
  redis_data:
```

### 3. Deploy with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend php artisan migrate --force

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Kubernetes Deployment

### 1. Create Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: karting-dashboard
```

### 2. Create ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: karting-config
  namespace: karting-dashboard
data:
  APP_ENV: "production"
  DB_CONNECTION: "mysql"
  DB_HOST: "mysql-service"
  REDIS_HOST: "redis-service"
  CACHE_DRIVER: "redis"
  SESSION_DRIVER: "redis"
  LOG_CHANNEL: "json"
```

### 3. Create Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: karting-secrets
  namespace: karting-dashboard
type: Opaque
stringData:
  APP_KEY: "base64:YOUR_APP_KEY_HERE"
  DB_PASSWORD: "YOUR_DB_PASSWORD"
  DB_ROOT_PASSWORD: "YOUR_ROOT_PASSWORD"
  REDIS_PASSWORD: "YOUR_REDIS_PASSWORD"
  SENTRY_DSN: "https://your-sentry-dsn@sentry.io/project-id"
```

### 4. MySQL Deployment

```yaml
# k8s/mysql-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: karting-dashboard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_DATABASE
          value: karting_production
        - name: MYSQL_USER
          value: karting_user
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: karting-secrets
              key: DB_PASSWORD
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: karting-secrets
              key: DB_ROOT_PASSWORD
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
        livenessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-service
  namespace: karting-dashboard
spec:
  selector:
    app: mysql
  ports:
  - protocol: TCP
    port: 3306
    targetPort: 3306
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: karting-dashboard
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

### 5. Redis Deployment

```yaml
# k8s/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: karting-dashboard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command: ["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]
        ports:
        - containerPort: 6379
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: karting-secrets
              key: REDIS_PASSWORD
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: karting-dashboard
spec:
  selector:
    app: redis
  ports:
  - protocol: TCP
    port: 6379
    targetPort: 6379
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: karting-dashboard
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

### 6. Backend Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: karting-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/karting-backend:latest
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: karting-config
        - secretRef:
            name: karting-secrets
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: karting-dashboard
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

### 7. Frontend Deployment

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: karting-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/karting-frontend:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
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
  name: frontend-service
  namespace: karting-dashboard
spec:
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

### 8. Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: karting-ingress
  namespace: karting-dashboard
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - karting.example.com
    - api.karting.example.com
    secretName: karting-tls
  rules:
  - host: karting.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.karting.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
```

### 9. Deploy to Kubernetes

```bash
# Apply all configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mysql-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Wait for deployments
kubectl wait --for=condition=available --timeout=300s deployment/backend -n karting-dashboard
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n karting-dashboard

# Run migrations
kubectl exec -it deployment/backend -n karting-dashboard -- php artisan migrate --force

# Check status
kubectl get all -n karting-dashboard
```

---

## Cloud Platform Guides

### AWS (EKS)
1. Create EKS cluster
2. Install AWS Load Balancer Controller
3. Use RDS for MySQL
4. Use ElastiCache for Redis
5. Use S3 for file storage
6. Deploy using kubectl with above manifests

### Google Cloud (GKE)
1. Create GKE cluster
2. Use Cloud SQL for MySQL
3. Use Memorystore for Redis
4. Use Cloud Storage for files
5. Deploy using kubectl with above manifests

### Azure (AKS)
1. Create AKS cluster
2. Use Azure Database for MySQL
3. Use Azure Cache for Redis
4. Use Blob Storage for files
5. Deploy using kubectl with above manifests

---

## Post-Deployment

### 1. Verify Health Checks
```bash
curl https://api.karting.example.com/api/health/detailed
```

### 2. Create Admin User
```bash
kubectl exec -it deployment/backend -n karting-dashboard -- \
  php artisan tinker --execute="User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('SecurePassword123!'), 'role' => 'admin']);"
```

### 3. Configure Backups

Set up automated database backups:
```bash
# MySQL backup cron job
0 2 * * * kubectl exec deployment/mysql -n karting-dashboard -- \
  mysqldump -u root -p${DB_ROOT_PASSWORD} karting_production | \
  gzip > /backups/karting_$(date +\%Y\%m\%d).sql.gz
```

### 4. Enable Monitoring

Configure Prometheus/Grafana for monitoring:
- Pod health metrics
- Database connection pool
- Redis cache hit rate
- Request latency
- Error rates

---

## Monitoring & Maintenance

### Key Metrics to Monitor
1. **Application Health**: `/api/health/detailed`
2. **Response Times**: P50, P95, P99
3. **Error Rates**: 4xx, 5xx responses
4. **Database Performance**: Query time, connections
5. **Cache Hit Rate**: Redis performance
6. **Resource Usage**: CPU, memory, disk

### Log Aggregation
Use structured JSON logs with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki + Grafana
- Cloud logging services

### Alerts to Configure
- Health check failures
- High error rates (>1%)
- Slow queries (>1s)
- High memory usage (>80%)
- Failed deployments

---

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check MySQL status
kubectl logs deployment/mysql -n karting-dashboard
kubectl exec deployment/mysql -n karting-dashboard -- mysql -u root -p${DB_ROOT_PASSWORD} -e "SHOW DATABASES;"
```

**Redis Connection Errors**
```bash
# Check Redis status
kubectl logs deployment/redis -n karting-dashboard
kubectl exec deployment/redis -n karting-dashboard -- redis-cli -a ${REDIS_PASSWORD} ping
```

**Pod Not Starting**
```bash
# Check pod status
kubectl describe pod <pod-name> -n karting-dashboard
kubectl logs <pod-name> -n karting-dashboard
```

**Ingress Not Working**
```bash
# Check ingress status
kubectl describe ingress karting-ingress -n karting-dashboard
kubectl get events -n karting-dashboard
```

### Emergency Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/backend -n karting-dashboard
kubectl rollout undo deployment/frontend -n karting-dashboard

# Check rollout status
kubectl rollout status deployment/backend -n karting-dashboard
```

---

## Security Checklist

- [ ] SSL/TLS certificates configured (Let's Encrypt)
- [ ] Environment variables stored in Kubernetes Secrets
- [ ] Database credentials rotated regularly
- [ ] Network policies configured
- [ ] RBAC roles configured
- [ ] Sentry error tracking enabled
- [ ] Rate limiting configured
- [ ] CSP headers configured
- [ ] CORS whitelist configured
- [ ] Regular security updates applied

---

## Performance Optimization

1. **Enable OPcache** in PHP (production)
2. **Configure Redis caching** for sessions and stats
3. **Use CDN** for frontend assets
4. **Enable HTTP/2** on nginx
5. **Configure horizontal pod autoscaling** (HPA)
6. **Use connection pooling** for database
7. **Enable query caching** in MySQL
8. **Compress responses** with gzip

---

## Support & Updates

- **Documentation**: See `README.md` and `PROJECT_OVERVIEW.md`
- **Issues**: GitHub Issues
- **Security**: security@karting.example.com
- **Updates**: Regular dependency updates via Dependabot

---

**Deployment Status**: Production Ready ✅  
**Last Updated**: February 1, 2026
