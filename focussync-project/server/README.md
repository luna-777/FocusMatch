# FocusSync Server

Real-time Socket.IO server for FocusSync productivity app.

## Features

- Real-time partner matching
- WebSocket-based chat
- Voice status indicators
- Session management
- Automatic cleanup

## Setup

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```bash
cp .env.example .env
```

3. **Start the server:**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3001`

## API Endpoints

### HTTP
- `GET /health` - Health check

### Socket.IO Events

**Client → Server:**
- `find-match` - Request partner matching
- `join-session` - Join existing session
- `send-message` - Send chat message
- `voice-status` - Update voice status
- `end-session` - End current session
- `cancel-match` - Cancel match search

**Server → Client:**
- `match-found` - Partner matched
- `receive-message` - New chat message
- `partner-voice-status` - Partner's voice status
- `partner-disconnected` - Partner left
- `session-ended` - Session completed
- `match-timeout` - No match found (10min)
- `message-history` - Previous messages

## Deployment

### Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect your repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `NODE_ENV` = `production`
     - `CLIENT_URL` = `https://your-frontend-url.com`
6. Deploy!

### Deploy to Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`
5. Add environment variables in Railway dashboard

### Deploy to Fly.io

1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Deploy: `fly deploy`

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS

## Monitoring

Check server health:
```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "activeSessions": 5,
  "waitingUsers": 2
}
```

## Development

Watch logs:
```bash
npm run dev
```

The server will automatically reload on file changes with nodemon.
