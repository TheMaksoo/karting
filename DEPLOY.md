# 🚀 AUTO-DEPLOY SETUP

## ⚡ Deploy in 3 Steps (5 minutes)

### 1. Push to GitHub
```powershell
.\setup-github.ps1
```

### 2. Add Secrets to GitHub
Go to: `Settings → Secrets and variables → Actions → New repository secret`

**Copy these from `secrets.json` file:**
- `FTP_PASSWORD` - From secrets.json
- `DB_PASSWORD` - From secrets.json
- `DOMAIN` - From secrets.json
- `FTP_USERNAME` - From secrets.json

### 3. Deploy
```bash
git push origin main
```

**Watch:** GitHub → Actions tab  
**Live in:** ~5 minutes! 🎉

---

## 🔄 Every Deploy After

```bash
git push origin main
```

That's it! Auto-deploys in ~5 minutes.

---

## 🌐 Access Your App

- **Frontend:** https://yourdomain.com/karting/
- **API:** https://yourdomain.com/karting/api/api

---

## 📝 First-Time Database Setup

**Once only** - SSH to server:

```bash
ssh your_username@server.com -p 21098
cd ~/public_html/karting/api
php artisan migrate --force
```

---

## 🔧 What Auto-Generates

- ✅ Laravel APP_KEY
- ✅ JWT_SECRET
- ✅ .env files
- ✅ .htaccess routing
- ✅ Frontend builds
- ✅ Backend deploys
- ✅ Cache clearing

**Zero manual config!** Just push and go! 🚀
