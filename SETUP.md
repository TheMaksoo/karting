# Deployment Setup

## One-Time Setup

### Step 1: Generate APP_KEY

```bash
cd portal/backend
php artisan key:generate --show
```

Copy the output (starts with `base64:`)

### Step 2: Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**

Add these **11 secrets**:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `FTP_SERVER` | `ftp.yourdomain.com` | Your FTP hostname |
| `FTP_USERNAME` | `username@yourdomain.com` | FTP username |
| `FTP_PASSWORD` | `your_password` | FTP password |
| `SSH_HOST` | `premium128.web-hosting.com` | SSH hostname (from cPanel) |
| `SSH_USERNAME` | `themgbpn` | SSH username (from cPanel) |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH...` | **The SSH private key you generated** |
| `APP_KEY` | `base64:abc123...` | From Step 1 |
| `APP_URL` | `https://yourdomain.com/karting` | Full URL |
| `DB_HOST` | `localhost` | Database host |
| `DB_DATABASE` | `themgbpn_karting` | Database name |
| `DB_USERNAME` | `themgbpn_dbuser` | Database user |
| `DB_PASSWORD` | `db_password` | Database password |
| `SANCTUM_DOMAINS` | `yourdomain.com` | Domain (no https://) |

### Step 3: Create Database

In cPanel → MySQL Databases:
1. Create database: `themgbpn_karting`
2. Create user with password
3. Grant ALL PRIVILEGES

### Step 4: Push to Deploy

```bash
git add .
git commit -m "Deploy"
git push origin main
```

## ✅ Done!

Every push automatically:
- ✅ Builds Vue frontend
- ✅ Deploys via FTP
- ✅ Creates `.env` via SSH
- ✅ Runs migrations
- ✅ Caches configs

**Zero manual steps!** 🚀
