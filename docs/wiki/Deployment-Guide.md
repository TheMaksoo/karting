# 🚀 Deployment Guide

Complete guide for deploying the Karting Dashboard to production.

## 📋 Prerequisites

### Server Requirements

- **Web Server**: Apache 2.4+ or Nginx
- **PHP**: 8.2+
- **MySQL**: 8.0+
- **Node.js**: 18+ (for building frontend)
- **Composer**: 2.x
- **Git**: For deployment
- **SSL Certificate**: Required for HTTPS

### cPanel Requirements (Current Setup)

- PHP 8.2 or higher
- MySQL database
- SSH access (optional but recommended)
- FTP/SFTP access

## 🔧 Production Environment Setup

### 1. Server Configuration

#### Apache Virtual Host

```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /home/user/public_html/karting

    <Directory /home/user/public_html/karting>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Laravel public directory
    Alias / /home/user/public_html/karting/portal/backend/public/

    SSLEngine on
    SSLCertificateFile /path/to/cert.crt
    SSLCertificateKeyFile /path/to/private.key
</VirtualHost>
```

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    root /var/www/karting/portal/backend/public;

    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/private.key;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 2. Database Setup

```sql
-- Create database
CREATE DATABASE karting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'karting_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON karting.* TO 'karting_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Environment Configuration

#### Backend (.env)

```env
APP_NAME="Karting Dashboard"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com/karting

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=karting
DB_USERNAME=karting_user
DB_PASSWORD=secure_password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

#### Frontend (.env.production)

```env
VITE_API_BASE_URL=https://yourdomain.com/karting/api
VITE_APP_NAME="Karting Dashboard"
```

## 🔄 Automated Deployment (GitHub Actions)

### Setup GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `FTP_SERVER` | FTP hostname | `ftp.yourdomain.com` |
| `FTP_USERNAME` | FTP username | `user@yourdomain.com` |
| `FTP_PASSWORD` | FTP password | Your FTP password |
| `SSH_HOST` | SSH hostname | `premium128.web-hosting.com` |
| `SSH_USERNAME` | SSH username | `themgbpn` |
| `SSH_PRIVATE_KEY` | SSH private key | Your private key content |
| `APP_KEY` | Laravel app key | From `php artisan key:generate --show` |
| `DB_HOST` | Database host | `localhost` |
| `DB_DATABASE` | Database name | `karting` |
| `DB_USERNAME` | Database user | `karting_user` |
| `DB_PASSWORD` | Database password | Your database password |

### Deployment Workflow

The `.github/workflows/pipeline.yml` handles automatic deployment on push to main:

```yaml
deploy:
  needs: [backend-tests, frontend-tests]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  
  steps:
    - name: Build Frontend
      run: |
        cd portal/frontend
        npm ci
        npm run build
        
    - name: Deploy via FTP
      uses: SamKirkland/FTP-Deploy-Action@4.3.0
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        
    - name: Run Migrations via SSH
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd ~/public_html/karting/portal/backend
          php artisan migrate --force
          php artisan config:cache
          php artisan route:cache
          php artisan view:cache
```

### Deploy Process

```bash
# 1. Commit your changes
git add .
git commit -m "feat: new feature"

# 2. Push to main branch
git push origin main

# 3. GitHub Actions automatically:
#    - Runs tests
#    - Builds frontend
#    - Deploys via FTP
#    - Runs migrations
#    - Optimizes caches
```

## 📦 Manual Deployment

### First-Time Deployment

```bash
# 1. Clone repository on server
cd /var/www
git clone https://github.com/TheMaksoo/karting.git
cd karting

# 2. Backend setup
cd portal/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
# Edit .env with production values
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link

# 3. Frontend setup and build
cd ../frontend
npm ci
npm run build

# 4. Set permissions
cd /var/www/karting
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### Update Deployment

```bash
# 1. Pull latest code
cd /var/www/karting
git pull origin main

# 2. Update backend
cd portal/backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 3. Rebuild frontend
cd ../frontend
npm ci
npm run build

# 4. Clear application cache
cd ../backend
php artisan cache:clear
php artisan optimize
```

## 🔒 Security Checklist

### Pre-Deployment Security

- [ ] `APP_DEBUG=false` in production .env
- [ ] Strong `APP_KEY` generated
- [ ] Strong database passwords
- [ ] HTTPS enabled with valid SSL certificate
- [ ] `.env` file not publicly accessible
- [ ] `storage/` and `bootstrap/cache/` writable
- [ ] All dependencies up to date
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### Post-Deployment Security

- [ ] Verify HTTPS working
- [ ] Test authentication
- [ ] Test rate limiting
- [ ] Check error pages (404, 500)
- [ ] Verify file upload restrictions
- [ ] Test password reset flow
- [ ] Check logs for errors

## 📊 Performance Optimization

### Backend Optimization

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer install --optimize-autoloader --no-dev

# Enable OPcache
# In php.ini:
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_lap_time ON laps(lap_time);
CREATE INDEX idx_session_date ON karting_sessions(session_date);

-- Optimize tables
OPTIMIZE TABLE drivers, tracks, karting_sessions, laps;
```

### Frontend Optimization

```bash
# Build with optimization
npm run build

# Assets are automatically:
# - Minified
# - Tree-shaken
# - Code-split
# - Gzip/Brotli compressed
```

## 🔍 Monitoring

### Health Check Endpoints

```bash
# Basic health check
curl https://yourdomain.com/api/health

# Detailed health check
curl https://yourdomain.com/api/health/detailed
```

### Application Monitoring

Set up monitoring for:
- **Uptime**: Use UptimeRobot or similar
- **Performance**: Use New Relic or similar
- **Errors**: Use Sentry or similar
- **Logs**: Use Papertrail or similar

### Log Monitoring

```bash
# View Laravel logs
tail -f storage/logs/laravel.log

# View web server logs
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx
```

## 🗄️ Backup Strategy

### Database Backups

```bash
# Manual backup
mysqldump -u karting_user -p karting > backup_$(date +%Y%m%d).sql

# Automated daily backup (cron)
0 2 * * * /usr/bin/mysqldump -u karting_user -pPASSWORD karting | gzip > /backups/karting_$(date +\%Y\%m\%d).sql.gz
```

### File Backups

```bash
# Backup uploaded files
tar -czf uploads_$(date +%Y%m%d).tar.gz storage/app/uploads

# Full application backup
tar -czf karting_$(date +%Y%m%d).tar.gz /var/www/karting \
  --exclude=node_modules \
  --exclude=vendor \
  --exclude=storage/logs
```

## 🔄 Rollback Procedure

### If deployment fails:

```bash
# 1. Revert to previous git commit
git checkout HEAD~1

# 2. Rollback database migrations
php artisan migrate:rollback --step=1

# 3. Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 4. Rebuild frontend (if needed)
cd portal/frontend
npm run build
```

## 📱 Post-Deployment Testing

### Smoke Tests

```bash
# Test endpoints
curl -I https://yourdomain.com
curl https://yourdomain.com/api/health
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test frontend
curl https://yourdomain.com
```

### Functional Tests

- [ ] Login/Logout works
- [ ] Driver creation works
- [ ] Session upload works
- [ ] Statistics display correctly
- [ ] Admin functions work
- [ ] Notifications appear
- [ ] Charts render correctly

## 🆘 Troubleshooting Deployment

### Common Issues

#### 500 Internal Server Error
```bash
# Check logs
tail -f storage/logs/laravel.log

# Check permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Clear and regenerate caches
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

#### Database Connection Error
```bash
# Verify database credentials in .env
# Test connection
php artisan tinker
>>> DB::connection()->getPdo();
```

#### Frontend Not Loading
```bash
# Rebuild frontend
cd portal/frontend
rm -rf dist node_modules
npm install
npm run build

# Check build output
ls -la dist/
```

## 📚 Additional Resources

- [Laravel Deployment Documentation](https://laravel.com/docs/deployment)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [Server Security Best Practices](https://laravel.com/docs/deployment#server-requirements)

---

*Last Updated: February 2026*
