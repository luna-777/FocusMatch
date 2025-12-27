const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active sessions and waiting queue
const sessions = new Map();
const waitingQueue = [];

// Helper to generate anonymous names
const anonymousNames = [
  'Focused Phoenix', 'Quiet Owl', 'Steady River', 'Calm Mountain',
  'Silent Wolf', 'Deep Forest', 'Wise Turtle', 'Patient Stone',
  'Gentle Rain', 'Strong Oak', 'Clear Sky', 'Bright Star',
  'Brave Lion', 'Swift Eagle', 'Calm Ocean', 'Peaceful Dove'
];

function getRandomName() {
  return anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeSessions: sessions.size,
    waitingUsers: waitingQueue.length 
  });
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Handle finding a match
  socket.on('find-match', ({ duration, userName }) => {
    console.log(`🔍 User ${socket.id} looking for ${duration}min session`);
    
    // Check if there's someone waiting for the same duration
    const matchIndex = waitingQueue.findIndex(user => user.duration === duration);
    
    if (matchIndex !== -1) {
      // Found a match!
      const match = waitingQueue[matchIndex];
      waitingQueue.splice(matchIndex, 1);
      
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create session data
      const sessionData = {
        id: sessionId,
        duration: duration,
        startTime: Date.now(),
        users: [
          { socketId: match.socket.id, name: match.userName },
          { socketId: socket.id, name: userName }
        ],
        messages: [],
        voiceStatus: {}
      };
      
      sessions.set(sessionId, sessionData);
      
      // Join both users to the session room
      match.socket.join(sessionId);
      socket.join(sessionId);
      
      // Notify both users
      match.socket.emit('match-found', {
        sessionId: sessionId,
        partnerName: userName,
        duration: duration
      });
      
      socket.emit('match-found', {
        sessionId: sessionId,
        partnerName: match.userName,
        duration: duration
      });
      
      console.log(`✨ Match created: ${sessionId} (${duration}min)`);
    } else {
      // Add to waiting queue
      waitingQueue.push({
        socket: socket,
        socketId: socket.id,
        duration: duration,
        userName: userName,
        timestamp: Date.now()
      });
      
      console.log(`⏳ User ${socket.id} added to queue. Queue size: ${waitingQueue.length}`);
    }
  });

  // Handle joining an existing session (for reconnection)
  socket.on('join-session', ({ sessionId }) => {
    if (sessions.has(sessionId)) {
      socket.join(sessionId);
      const session = sessions.get(sessionId);
      
      // Send message history
      socket.emit('message-history', session.messages);
      
      console.log(`🔄 User ${socket.id} rejoined session ${sessionId}`);
    }
  });

  // Handle chat messages
  socket.on('send-message', ({ sessionId, text }) => {
    if (!sessions.has(sessionId)) {
      console.log(`❌ Session ${sessionId} not found`);
      return;
    }
    
    const session = sessions.get(sessionId);
    const user = session.users.find(u => u.socketId === socket.id);
    
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: socket.id,
      senderName: user ? user.name : 'Unknown',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Store message in session
    session.messages.push(message);
    sessions.set(sessionId, session);
    
    // Broadcast to all users in the session
    io.to(sessionId).emit('receive-message', message);
    
    console.log(`💬 Message in ${sessionId}: ${text.substring(0, 30)}...`);
  });

  // Handle voice chat status
  socket.on('voice-status', ({ sessionId, isActive }) => {
    if (!sessions.has(sessionId)) return;
    
    const session = sessions.get(sessionId);
    session.voiceStatus[socket.id] = isActive;
    sessions.set(sessionId, session);
    
    // Notify partner only
    socket.to(sessionId).emit('partner-voice-status', { 
      isActive,
      partnerId: socket.id 
    });
    
    console.log(`🎤 Voice status in ${sessionId}: ${isActive ? 'ON' : 'OFF'}`);
  });

  // Handle session completion
  socket.on('end-session', ({ sessionId }) => {
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      
      // Notify all users in the session
      io.to(sessionId).emit('session-ended');
      
      // Remove session after 5 minutes (keep for late joiners)
      setTimeout(() => {
        sessions.delete(sessionId);
        console.log(`🗑️  Session ${sessionId} deleted`);
      }, 5 * 60 * 1000);
      
      console.log(`✅ Session ${sessionId} completed`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Remove from waiting queue
    const queueIndex = waitingQueue.findIndex(u => u.socketId === socket.id);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
      console.log(`🗑️  Removed ${socket.id} from queue`);
    }
    
    // Notify partner in active session
    sessions.forEach((session, sessionId) => {
      const userIndex = session.users.findIndex(u => u.socketId === socket.id);
      
      if (userIndex !== -1) {
        const userName = session.users[userIndex].name;
        
        // Notify the partner
        socket.to(sessionId).emit('partner-disconnected', { 
          name: userName 
        });
        
        console.log(`👋 User ${userName} left session ${sessionId}`);
      }
    });
  });

  // Handle cancel match search
  socket.on('cancel-match', () => {
    const queueIndex = waitingQueue.findIndex(u => u.socketId === socket.id);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
      console.log(`🚫 User ${socket.id} cancelled match search`);
    }
  });
});

// Clean up old waiting users (10 minutes timeout)
setInterval(() => {
  const now = Date.now();
  const timeout = 10 * 60 * 1000; // 10 minutes
  
  for (let i = waitingQueue.length - 1; i >= 0; i--) {
    if (now - waitingQueue[i].timestamp > timeout) {
      const user = waitingQueue[i];
      user.socket.emit('match-timeout');
      waitingQueue.splice(i, 1);
      console.log(`⏰ Match timeout for ${user.socketId}`);
    }
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 FocusSync Server Running       ║
║                                        ║
║     Port: ${PORT}                        ║
║     Environment: ${process.env.NODE_ENV || 'development'}          ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
