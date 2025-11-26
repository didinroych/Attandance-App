# Deployment Guide: admin-school to admin-attendify.chafi.dev

This guide provides step-by-step instructions to deploy the admin-school Vue.js application to your VPS using aaPanel.

## 🎯 Deployment Overview

- **Application**: admin-school (Vue.js 3 + Vite SPA)
- **Domain**: admin-attendify.chafi.dev
- **Backend API**: https://staging.chafi.dev
- **VPS Panel**: aaPanel
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (via aaPanel)

---

## 📋 Prerequisites

- [x] VPS with aaPanel installed
- [x] Node.js installed on VPS
- [x] Nginx installed in aaPanel
- [x] Domain registered and managed in Cloudflare
- [x] Backend API running at https://staging.chafi.dev

---

## 🚀 PHASE 1: Local Preparation (COMPLETED ✅)

### 1.1 Configuration Files Updated
- ✅ `vite.config.ts` - Base path changed from `/tailadmin-vuejs/` to `/`
- ✅ `.env.production` - Production environment variables created
- ✅ `nginx.conf.example` - Nginx configuration template created

### 1.2 Application Built
```bash
npm run build
```
- ✅ Built successfully in 8.95s
- ✅ Output: `dist/` folder with optimized assets
- ✅ Total size: ~723 KB (gzipped: ~213 KB)

**Your `dist/` folder is ready to deploy!** 🎉

---

## 🌐 PHASE 2: Cloudflare DNS Setup

### 2.1 Add DNS A Record

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select domain: **chafi.dev**
3. Navigate to: **DNS** → **Records**
4. Click: **Add record**
5. Configure:
   - **Type**: `A`
   - **Name**: `admin-attendify`
   - **IPv4 address**: `[Your VPS IP Address]`
   - **Proxy status**: 🟠 Proxied (Orange cloud - enables Cloudflare SSL)
   - **TTL**: Auto
6. Click: **Save**

### 2.2 Verify DNS Propagation

Wait 1-5 minutes, then test:
```bash
ping admin-attendify.chafi.dev
```
Should return your VPS IP or Cloudflare IP (if proxied).

---

## 🖥️ PHASE 3: aaPanel Website Setup

### 3.1 Create Website

1. Login to **aaPanel** (usually at `http://[VPS-IP]:7800`)
2. Navigate to: **Website** → **Add Site**
3. **IMPORTANT**: Select submenu **"PHP Project"** ⭐
   - ✅ Use: **PHP Project** (for static files)
   - ❌ Don't use: Node.js Project (not needed - we're serving static files)
   - ❌ Don't use: Proxy Project (not needed)
4. Fill in the form:
   - **Domain**: `admin-attendify.chafi.dev`
   - **Root Directory**: `/www/wwwroot/admin-attendify.chafi.dev`
   - **PHP Version**: Select any (e.g., PHP 7.4 - won't be used but required)
   - **Database**: None (uncheck if prompted)
   - **FTP**: Optional (check if you want FTP access)
5. Click: **Submit**

**Why PHP Project?**
Vue.js builds to static HTML/JS/CSS files. The "PHP Project" option in aaPanel is for serving static websites. Node.js Project would try to run a Node server (which we don't need).

---

## ⚙️ PHASE 4: Configure Nginx for SPA

### 4.1 Edit Nginx Configuration

**Critical step to prevent 403/404 errors!**

1. In aaPanel, go to: **Website**
2. Find: `admin-attendify.chafi.dev` in the list
3. Click: **Settings** (gear icon ⚙️)
4. Click tab: **Config File**
5. Find the section that looks like:
   ```nginx
   location / {
       # ... existing code
   }
   ```
6. **Replace** the `location /` block with:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
7. Click: **Save**

**What this does:**
- Enables Vue Router to work properly
- Fixes 403 errors on page refresh
- Allows direct URL access to routes like `/dashboard`, `/students`, etc.

### 4.2 Verify Site Directory Settings

1. In the same Settings modal, click: **Site Directory** tab
2. Verify:
   - **Site Directory**: `/www/wwwroot/admin-attendify.chafi.dev`
   - **Run Directory**: `/` (root of site directory)
   - **Index File**: `index.html` (add if not present)
3. Click: **Save** if you made changes

---

## 📤 PHASE 5: Upload Files to VPS

Choose one of the following methods:

### Option A: Upload via SFTP/FTP (Recommended for first-time)

#### Step 1: Connect via SFTP Client
Use **FileZilla**, **WinSCP**, **Cyberduck**, or similar:
- **Host**: Your VPS IP address
- **Protocol**: SFTP (SSH File Transfer Protocol)
- **Port**: 22
- **Username**: `root` (or FTP user if created)
- **Password**: Your VPS/FTP password

#### Step 2: Navigate to Directory
- **Remote path**: `/www/wwwroot/admin-attendify.chafi.dev/`

#### Step 3: Clean Directory
- Delete any default files (like `index.html`, `404.html`) if present

#### Step 4: Upload Files
- **Local path**: `c:\Study\magang\Attandance-App\admin-school\dist\`
- **Upload**: ALL contents INSIDE the `dist/` folder (not the folder itself)
- **Final structure should be**:
  ```
  /www/wwwroot/admin-attendify.chafi.dev/
  ├── index.html              ← Must be at root
  ├── assets/
  │   ├── index-DAKgoRQ4.js
  │   ├── index-DxUDesnj.css
  │   └── ... (other files)
  ├── favicon.ico
  └── ... (other files)
  ```

**⚠️ Common Mistake**: Don't upload the `dist` folder itself, upload its CONTENTS.

---

### Option B: Deploy via Git (Alternative)

#### Step 1: SSH into VPS
```bash
ssh root@[YOUR-VPS-IP]
```

#### Step 2: Navigate to Site Directory
```bash
cd /www/wwwroot/admin-attendify.chafi.dev/
```

#### Step 3: Clone Repository
```bash
# Clone your repo to a temp directory
git clone [YOUR-REPO-URL] temp

# Navigate to admin-school
cd temp/admin-school

# Install dependencies
npm install

# Build for production
npm run build

# Move built files to web root
mv dist/* /www/wwwroot/admin-attendify.chafi.dev/

# Clean up
cd /www/wwwroot/admin-attendify.chafi.dev/
rm -rf temp
```

#### Step 4: Verify Files
```bash
ls -la /www/wwwroot/admin-attendify.chafi.dev/
```
Should show `index.html`, `assets/`, etc.

---

## 🔐 PHASE 6: Fix File Permissions

**Critical step to prevent 403 Forbidden errors!**

### Method A: Via aaPanel File Manager

1. Go to: **Files** (File Manager)
2. Navigate to: `/www/wwwroot/admin-attendify.chafi.dev/`
3. Select **all files and folders**
4. Right-click → **Permission**
5. Set:
   - **Folders**: `755`
   - **Files**: `644`
6. Check: **Apply to subdirectories**
7. Click: **OK**

### Method B: Via SSH

```bash
# Set owner to www user
chown -R www:www /www/wwwroot/admin-attendify.chafi.dev/

# Set folder permissions to 755
find /www/wwwroot/admin-attendify.chafi.dev/ -type d -exec chmod 755 {} \;

# Set file permissions to 644
find /www/wwwroot/admin-attendify.chafi.dev/ -type f -exec chmod 644 {} \;
```

---

## 🧪 PHASE 7: Testing

### 7.1 Test HTTP Access

1. Open browser: `http://admin-attendify.chafi.dev`
2. **Expected**: Should load the login page
3. **If you see errors**: See Troubleshooting section below

### 7.2 Test Vue Router

Try accessing different routes directly:
- `http://admin-attendify.chafi.dev/dashboard`
- `http://admin-attendify.chafi.dev/students`
- `http://admin-attendify.chafi.dev/signin`

**Expected**: All should work without 404 errors (thanks to nginx `try_files` config)

### 7.3 Check Browser Console

1. Open DevTools (F12)
2. Go to: **Console** tab
3. **Expected**: No red errors
4. Go to: **Network** tab
5. Refresh page
6. **Expected**: All JS/CSS files return status 200

### 7.4 Test Login Functionality

1. Try logging in with valid credentials
2. **Expected**: Should authenticate via https://staging.chafi.dev
3. **If CORS error**: Contact backend team to whitelist `admin-attendify.chafi.dev`

---

## 🔒 PHASE 8: SSL Certificate Setup

### 8.1 Apply Let's Encrypt Certificate

1. In aaPanel, go to: **Website**
2. Find: `admin-attendify.chafi.dev`
3. Click: **Settings** → **SSL** tab
4. Select: **Let's Encrypt**
5. Check: `admin-attendify.chafi.dev`
6. Click: **Apply**
7. Wait 30-60 seconds for certificate generation
8. **Expected**: Green checkmark with expiry date

**If it fails:**
- Ensure DNS is propagated (wait 5-10 minutes)
- Verify domain points to your VPS IP
- Check port 80 is open and not blocked by firewall

### 8.2 Enable Force HTTPS

1. In the same **SSL** tab
2. Toggle: **Force HTTPS** to ON
3. This automatically redirects HTTP → HTTPS

### 8.3 Test HTTPS

1. Open browser: `https://admin-attendify.chafi.dev`
2. **Expected**:
   - Green padlock 🔒 in address bar
   - No certificate warnings
   - All resources load via HTTPS

### 8.4 Test Mixed Content

1. Open DevTools → Console
2. **Expected**: No "Mixed Content" warnings
3. All API calls should go to `https://staging.chafi.dev` (already HTTPS ✅)

---

## 🎉 Deployment Complete!

Your application is now live at: **https://admin-attendify.chafi.dev**

### Post-Deployment Checklist

- [ ] Login works
- [ ] Dashboard loads
- [ ] Student management works
- [ ] Teacher management works
- [ ] Class management works
- [ ] All routes accessible
- [ ] Assets load correctly
- [ ] API calls work
- [ ] No console errors
- [ ] SSL certificate valid

---

## 🐛 Troubleshooting Common Errors

### Error: 403 Forbidden

**Possible causes:**
1. ❌ Wrong file permissions
2. ❌ Missing nginx `try_files` directive
3. ❌ Incorrect document root

**Solutions:**
```bash
# Fix permissions
chown -R www:www /www/wwwroot/admin-attendify.chafi.dev/
chmod -R 755 /www/wwwroot/admin-attendify.chafi.dev/

# Verify nginx config has:
location / {
    try_files $uri $uri/ /index.html;
}

# Restart nginx
systemctl restart nginx
# OR in aaPanel: App Store → Nginx → Restart
```

---

### Error: 502 Bad Gateway

**Possible causes:**
1. ❌ Used "Node.js Project" instead of "PHP Project" in aaPanel
2. ❌ Nginx trying to proxy to non-existent service
3. ❌ Nginx not running

**Solutions:**
1. Delete site and recreate using **"PHP Project"**
2. Check nginx config - should NOT have `proxy_pass` directives for this SPA
3. Restart Nginx: aaPanel → App Store → Nginx → Restart

---

### Error: Assets not loading (404 on .js/.css files)

**Possible causes:**
1. ❌ Wrong base path in vite.config.ts
2. ❌ Files uploaded to wrong directory
3. ❌ Uploaded `dist` folder instead of its contents

**Solutions:**
1. ✅ Already fixed: `vite.config.ts` has `base: '/'`
2. Verify file structure:
   ```bash
   ls -la /www/wwwroot/admin-attendify.chafi.dev/
   # Should show index.html and assets/ at root
   ```
3. If you see `/www/wwwroot/admin-attendify.chafi.dev/dist/index.html`, you uploaded wrong:
   ```bash
   cd /www/wwwroot/admin-attendify.chafi.dev/
   mv dist/* .
   rm -rf dist
   ```

---

### Error: Blank white page

**Possible causes:**
1. ❌ API backend not accessible
2. ❌ CORS error
3. ❌ JavaScript errors

**Solutions:**
1. Open browser DevTools (F12) → Console tab
2. Look for errors (usually red text)
3. Common issues:
   - **CORS error**: Backend needs to whitelist `admin-attendify.chafi.dev`
   - **Failed to fetch**: Check `VITE_API_BASE_URL` in `.env.production`
   - **Syntax error**: Rebuild with `npm run build`

---

### Error: Routes return 404 on refresh

**Cause:**
❌ Missing nginx SPA configuration

**Solution:**
Add to nginx config:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

### Error: CORS Policy Error

**Example:**
```
Access to XMLHttpRequest at 'https://staging.chafi.dev/api/auth/login'
from origin 'https://admin-attendify.chafi.dev' has been blocked by CORS policy
```

**Cause:**
Backend API doesn't allow requests from your domain.

**Solution:**
Contact backend team to add `admin-attendify.chafi.dev` to CORS whitelist.

Backend needs to add header:
```
Access-Control-Allow-Origin: https://admin-attendify.chafi.dev
```

---

## 🔄 Future Updates

When you need to update the application:

### Quick Update Process

1. **Make changes locally**
2. **Rebuild**:
   ```bash
   cd c:\Study\magang\Attandance-App\admin-school
   npm run build
   ```
3. **Upload new files**:
   - Delete old files in `/www/wwwroot/admin-attendify.chafi.dev/`
   - Upload new `dist/` contents
4. **Test**: `https://admin-attendify.chafi.dev`

### Automated Deployment (Future Enhancement)

Consider setting up:
- **GitHub Actions**: Auto-deploy on push to main branch
- **Webhooks**: Auto-pull and rebuild on VPS
- **CI/CD Pipeline**: Automated testing + deployment

---

## 📚 Reference Files

- **Nginx config example**: [nginx.conf.example](./nginx.conf.example)
- **Production env**: [.env.production](./.env.production)
- **Vite config**: [vite.config.ts](./vite.config.ts)

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check nginx error logs: `/www/wwwlogs/admin-attendify.chafi.dev.error.log`
3. Verify backend API is accessible: `curl https://staging.chafi.dev`

---

## ✅ Deployment Summary

- ✅ Configuration files updated
- ✅ Application built successfully
- ✅ Deployment guide created
- ✅ Ready to deploy to VPS

**Next steps**: Follow PHASE 2-8 above to complete deployment on your VPS!

---

**Last Updated**: 2025-11-24
**Application**: admin-school v2.0.1
**Framework**: Vue.js 3.5.13 + Vite 6.0.11
