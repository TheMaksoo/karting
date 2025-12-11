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

| Secret Name | Example Value | Description |
|------------|---------------|-------------|
| `FTP_SERVER` | `ftp.yourdomain.com` | Namecheap FTP hostname |
| `FTP_USERNAME` | `username@yourdomain.com` | FTP/SSH username |
| `FTP_PASSWORD` | `your_password` | FTP/SSH password |
| `APP_KEY` | `base64:abc123...` | From Step 1 |
| `APP_URL` | `https://yourdomain.com/karting` | Full URL to app |
| `DB_HOST` | `localhost` | Database host (usually localhost) |
| `DB_DATABASE` | `themgbpn_karting` | Your MySQL database name |
| `DB_USERNAME` | `themgbpn_dbuser` | Database username |
| `DB_PASSWORD` | `db_password` | Database password |
| `SANCTUM_DOMAINS` | `yourdomain.com` | Your domain (no https://) |

### Step 3: Create Database

In cPanel → MySQL Databases:
1. Create database: `themgbpn_karting`
2. Create user with strong password
3. Grant ALL PRIVILEGES to user on database

### Step 4: Push to Deploy

```bash
git add .
git commit -m "Deploy"
git push origin main
```

## ✅ Done!

Every push automatically:
- Builds frontend
- Deploys via FTP
- Creates `.env` from secrets
- Runs migrations
- Caches configs

No manual steps needed!
