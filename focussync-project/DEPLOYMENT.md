# 🚀 FocusSync Deployment Guide

Step-by-step guide to deploy FocusSync to production.

## Overview

You'll deploy:
- **Server** → Render (or Railway/Fly.io)
- **Client** → Vercel (or Netlify/Cloudflare Pages)

Total cost: **$0/month** (using free tiers)

---

## Part 1: Deploy Server to Render

### Step 1: Prepare Repository

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-url>
git push -u origin main
```

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 3: Deploy Server

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

```
Name: focussync-server
Root Directory: server
Environment: Node
Region: Choose closest to your users
Branch: main
Build Command: npm install
Start Command: npm start
```

4. **Add Environment Variables:**
   - Click "Advanced"
   - Add environment variables:
     ```
     NODE_ENV=production
     CLIENT_URL=https://your-app.vercel.app (we'll update this later)
     ```

5. Click **"Create Web Service"**

6. Wait for deployment (2-3 minutes)

7. **Copy your server URL** - looks like: `https://focussync-server.onrender.com`

### Step 4: Test Server

Visit: `https://your-server-url.com/health`

Should return:
```json
{
  "status": "ok",
  "activeSessions": 0,
  "waitingUsers": 0
}
```

---

## Part 2: Deploy Client to Vercel

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### Step 2: Deploy Client

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure:

```
Framework Preset: Vite
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

4. **Add Environment Variable:**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_SOCKET_URL=https://your-server-url.onrender.com
     ```
   - Use the server URL from Part 1, Step 7

5. Click **"Deploy"**

6. Wait for deployment (1-2 minutes)

7. **Copy your client URL** - looks like: `https://focussync.vercel.app`

### Step 3: Update Server CORS

Go back to Render:

1. Open your server on Render
2. Go to "Environment"
3. Edit `CLIENT_URL` to your Vercel URL:
   ```
   CLIENT_URL=https://focussync.vercel.app
   ```
4. Save (server will auto-redeploy)

---

## Part 3: Test Production

1. Open your Vercel URL in **two different browser windows**
2. Click "25 minutes" in both
3. They should match!
4. Test chat and voice status

---

## Alternative Deployment Options

### Server Alternatives

#### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd server
railway init
railway up
```

#### Fly.io
```bash
# Install flyctl
# Follow: https://fly.io/docs/hands-on/install-flyctl/

# Login
fly auth login

# Deploy
cd server
fly launch
fly deploy
```

### Client Alternatives

#### Netlify
1. Go to [netlify.com](https://netlify.com)
2. New site from Git
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `client/dist`
   - Base directory: `client`
4. Add env var: `VITE_SOCKET_URL`

#### Cloudflare Pages
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Create project from GitHub
3. Configure:
   - Build command: `npm run build`
   - Build output: `dist`
   - Root directory: `client`
4. Add env var: `VITE_SOCKET_URL`

---

## Monitoring & Maintenance

### Server Logs

Render Dashboard → Your Service → Logs

### Client Analytics

Vercel Dashboard → Your Project → Analytics

### Health Checks

Set up monitoring:
- [UptimeRobot](https://uptimerobot.com) - Free
- Ping your `/health` endpoint every 5 minutes

### Cost

**Free Tiers:**
- Render: 750 hours/month (enough for 1 service)
- Vercel: Unlimited bandwidth for personal projects

**When you might need to upgrade:**
- 1000+ concurrent users
- Heavy traffic (unlikely for productivity app)

---

## Custom Domain (Optional)

### Add Domain to Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `focussync.com`)
3. Follow DNS configuration instructions

### Update Environment Variables

After adding custom domain:

1. **Render:** Update `CLIENT_URL` to `https://focussync.com`
2. **Vercel:** Update preview deployments to use production server

---

## Troubleshooting

### Server won't start on Render
- Check logs in Render dashboard
- Verify `package.json` has correct `start` script
- Ensure all dependencies are in `dependencies`, not `devDependencies`

### Client can't connect to server
- Verify `VITE_SOCKET_URL` is correct in Vercel
- Check CORS `CLIENT_URL` in Render
- Look for CORS errors in browser console

### Render free tier sleeps
- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid tier ($7/month) for 24/7 uptime
- Or use a cron job to ping every 10 minutes

### WebSocket connection fails
- Ensure server URL uses `https://` not `http://`
- Socket.IO automatically upgrades to WSS with HTTPS
- Check browser console for connection errors

---

## Next Steps

1. ✅ Monitor server health
2. ✅ Set up error tracking (Sentry, LogRocket)
3. ✅ Add analytics (Vercel Analytics, Google Analytics)
4. ✅ Collect user feedback
5. ✅ Iterate on features!

---

## Support

- Server issues: Check Render logs
- Client issues: Check Vercel deployment logs
- Connection issues: Check browser console

Good luck! 🚀
