# 🚀 Auto-Deploy Setup

Just **3 simple steps** to get fully automatic deployments!

## 1️⃣ Generate Your APP_KEY

```bash
cd portal/backend
php artisan key:generate --show
```

Copy the output (starts with `base64:...`)

## 2️⃣ Add GitHub Secrets

Go to: **Your Repo → Settings → Secrets and variables → Actions → New repository secret**

Add these **10 secrets**:

| Secret Name | Value | Example |
|------------|-------|---------|
| `FTP_SERVER` | Your domain's FTP server | `ftp.yourdomain.com` |
| `FTP_USERNAME` | Your cPanel username | `themgbpn` |
| `FTP_PASSWORD` | Your cPanel password | `your_password` |
| `SSH_HOST` | Your domain | `yourdomain.com` |
| `SSH_USERNAME` | Same as FTP username | `themgbpn` |
| `SSH_PASSWORD` | Same as FTP password | `your_password` |
| `APP_KEY` | From step 1 | `base64:xxxxx...` |
| `APP_URL` | Your site URL | `https://yourdomain.com/karting` |
| `DB_HOST` | Usually localhost | `localhost` |
| `DB_DATABASE` | Your MySQL database name | `themgbpn_karting` |
| `DB_USERNAME` | Your MySQL username | `themgbpn_karting` |
| `DB_PASSWORD` | Your MySQL password | `db_password` |
| `SANCTUM_DOMAINS` | Your domain | `yourdomain.com` |

## 3️⃣ Push to Deploy

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

## ✨ That's It!

Every push to `main` will now automatically:
- ✅ Build your Vue.js frontend
- ✅ Install Laravel dependencies
- ✅ Deploy to your cPanel server
- ✅ Run database migrations
- ✅ Cache configs for production

## 📊 Monitor Deployment

Watch the progress: **Actions tab** in your GitHub repo

## 🔧 First Time Setup on cPanel

1. **Create MySQL Database** in cPanel:
   - Database name: `themgbpn_karting`
   - User: `themgbpn_karting`
   - Grant ALL PRIVILEGES

2. **Enable SSH** in cPanel (if not enabled)

3. **Push and relax** - GitHub Actions handles everything!

## 🔄 Daily Workflow

```bash
# Make changes locally
git add .
git commit -m "Added new feature"
git push

# ✨ Automatically deploys!
```

No manual steps. No FTP. No SSH commands. Just code and push! 🎉
