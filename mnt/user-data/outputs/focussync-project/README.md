# 🚀 FocusSync

Anonymous accountability partner sessions for focused, productive work.

Real-time matching, synchronized timers, chat, and voice status - all powered by Socket.IO.

## ✨ Features

- **Real-time Partner Matching** - Get paired instantly with someone ready to focus
- **Synchronized Sessions** - 25 or 50-minute Pomodoro-style work blocks
- **Live Chat** - Encourage each other during the session
- **Voice Status Indicators** - See when your partner is speaking
- **Built-in To-Do List** - Track tasks during your session
- **Session Check-ins** - Reflect on productivity afterward
- **Anonymous & Safe** - No accounts required, random partner names

## 🏗️ Architecture

```
focussync-project/
├── server/          # Node.js + Socket.IO backend
│   ├── server.js    # Main server with matching logic
│   └── package.json
└── client/          # React + Vite frontend
    ├── src/
    │   ├── App.jsx  # Main component with Socket.IO integration
    │   └── main.jsx
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14 or higher
- npm or yarn

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd focussync-project

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

**Server (.env):**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Client (.env):**
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Run Locally

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
```

Server will run on `http://localhost:3001`

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
```

Client will run on `http://localhost:3000`

### 4. Test It Out!

1. Open `http://localhost:3000` in two browser windows
2. Click "25 minutes" in both windows
3. Watch them get matched together!
4. Test the chat, voice status, and to-do list

## 📦 Deployment

### Server Deployment (Render)

1. Push code to GitHub
2. Create account on [render.com](https://render.com)
3. New Web Service → Connect your repo
4. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `NODE_ENV` = `production`
     - `CLIENT_URL` = `https://your-client-url.com`
5. Deploy and copy your server URL

### Client Deployment (Vercel)

1. Create account on [vercel.com](https://vercel.com)
2. Import your repository
3. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_SOCKET_URL` = `https://your-server-url.com` (from Render)
4. Deploy!

### Update CORS

After deploying the client, update server's `CLIENT_URL` environment variable to your Vercel URL.

## 🔧 Tech Stack

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server
- **Socket.IO** - WebSocket communication
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Socket.IO Client** - Real-time connection
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🎯 How It Works

### Matching Algorithm

1. User clicks 25 or 50-minute session
2. Client emits `find-match` to server
3. Server checks waiting queue for same duration
4. If match found:
   - Creates session room
   - Joins both users to room
   - Emits `match-found` to both
5. If no match:
   - Adds user to waiting queue
   - Timeout after 10 minutes

### Real-time Communication

- **Rooms:** Each session gets a unique room ID
- **Events:** Chat, voice status, and disconnect are all real-time
- **Reconnection:** Socket.IO handles network issues automatically

## 📊 Server Events

### Client → Server
- `find-match` - Request partner
- `send-message` - Chat message
- `voice-status` - Mic on/off
- `end-session` - Session complete
- `cancel-match` - Cancel search

### Server → Client
- `match-found` - Partner matched
- `receive-message` - New message
- `partner-voice-status` - Partner's mic status
- `partner-disconnected` - Partner left
- `match-timeout` - No match found

## 🛠️ Development

### Server Development

```bash
cd server
npm run dev  # Auto-restarts on changes
```

### Client Development

```bash
cd client
npm run dev  # Hot module replacement
```

### Testing Locally

Open two browser tabs to simulate two users matching with each other.

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 🐛 Troubleshooting

### Connection issues
- Ensure server is running
- Check `.env` files have correct URLs
- Verify firewall settings

### No match found
- Need 2 users searching for same duration
- Test with 2 browser windows

### Chat not working
- Check browser console for errors
- Verify Socket.IO connection (green indicator)
- Check server logs

## 📚 Learn More

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

Built with ❤️ for focused, productive work sessions
