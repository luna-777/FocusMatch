# FocusSync Client

React + Vite frontend for FocusSync productivity app with real-time Socket.IO integration.

## Features

- 🎯 Real-time partner matching
- 💬 Live chat with partner
- 🎤 Voice status indicators
- ✅ Built-in to-do list
- ⏱️ Synchronized countdown timer
- 📊 Session check-ins

## Setup

### Prerequisites

- Node.js 14+ 
- npm or yarn
- Running FocusSync server (see `../server/`)

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```bash
cp .env.example .env
```

Edit `.env` and set your server URL:
```
VITE_SOCKET_URL=http://localhost:3001
```

3. **Start development server:**
```bash
npm run dev
```

App will run on `http://localhost:3000`

## Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

Preview production build:
```bash
npm run preview
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_SOCKET_URL` = `https://your-server-url.com`
5. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. New site from Git
4. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Environment variables:**
     - `VITE_SOCKET_URL` = `https://your-server-url.com`
5. Deploy!

### Deploy to GitHub Pages

1. Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

2. Install gh-pages:
```bash
npm install -D gh-pages
```

3. Add to `package.json`:
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

4. Deploy:
```bash
npm run deploy
```

### Deploy to Cloudflare Pages

1. Push to GitHub
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Create new project
4. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:**
     - `VITE_SOCKET_URL` = `https://your-server-url.com`
5. Deploy!

## Environment Variables

- `VITE_SOCKET_URL` - Socket.IO server URL (required)

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Socket.IO Client** - Real-time communication
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
client/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json         # Dependencies
```

## Development Tips

### Hot Module Replacement
Vite provides instant HMR - changes appear immediately without full page reload.

### Socket.IO Connection
The app automatically connects to the server defined in `VITE_SOCKET_URL`. Check the connection indicator in the top-right corner.

### Storage API
The app uses `window.storage` for to-do persistence (if available). This is optional and the app works without it.

## Troubleshooting

### Can't connect to server
- Ensure server is running on the URL specified in `.env`
- Check CORS settings in server
- Verify firewall/network settings

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Socket disconnects frequently
- Check server logs
- Verify network stability
- Check server reconnection settings

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported
