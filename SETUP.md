# Deployment Setup

## One-Time Setup

### Step 1: Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Example Value | Description |
|------------|---------------|-------------|
| `FTP_SERVER` | `ftp.yourdomain.com` | Namecheap FTP hostname |
| `FTP_USERNAME` | `username@yourdomain.com` | FTP username |
| `FTP_PASSWORD` | `your_ftp_password` | FTP password |

### Step 2: Push to Deploy

```bash
git add .
git commit -m "Deploy"
git push origin main
```

The workflow will automatically build and deploy to `/public_html/karting/`

### Step 3: Manual Server Setup (First Time Only)

After first deployment, SSH into your server or use cPanel Terminal:

```bash
cd ~/public_html/karting/api
nano .env  # Edit with your database credentials
bash setup.sh
```

Or use cPanel File Manager:
1. Navigate to `public_html/karting/api`
2. Edit `.env` file with your database details
3. Use Terminal to run: `bash setup.sh`

## Database Setup

Create MySQL database in cPanel:
1. cPanel → MySQL Databases
2. Create database: `themgbpn_karting` (or your choice)
3. Create user and grant ALL PRIVILEGES
4. Update `.env` with these credentials

## Future Deployments

Just push to GitHub - files will auto-deploy. Migrations run automatically via `setup.sh` if needed.
