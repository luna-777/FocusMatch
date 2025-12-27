import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Clock, Users, CheckCircle, UserCheck, Zap, ListTodo, Trash2, Plus, Mic, MicOff, MessageCircle, Send, Check } from 'lucide-react';

// Socket.IO connection - Update this URL for production
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [screen, setScreen] = useState('welcome');
  const [sessionLength, setSessionLength] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [checkInNote, setCheckInNote] = useState('');
  const timerRef = useRef(null);
  
  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // To-do list state
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [showTodoPanel, setShowTodoPanel] = useState(true);
  
  // Voice chat state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [partnerVoiceActive, setPartnerVoiceActive] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    // Listen for match found
    newSocket.on('match-found', ({ sessionId, partnerName, duration }) => {
      console.log('🎉 Match found!', { sessionId, partnerName });
      setSessionId(sessionId);
      setPartnerName(partnerName);
      setSessionLength(duration);
      setTimeRemaining(duration * 60);
      setScreen('session');
      setIsActive(true);
      setChatMessages([]);
    });

    // Listen for chat messages
    newSocket.on('receive-message', (message) => {
      setChatMessages(prev => [...prev, {
        ...message,
        sender: message.senderId === newSocket.id ? 'me' : 'partner'
      }]);
    });

    // Listen for partner voice status
    newSocket.on('partner-voice-status', ({ isActive }) => {
      setPartnerVoiceActive(isActive);
    });

    // Listen for partner disconnect
    newSocket.on('partner-disconnected', ({ name }) => {
      alert(`${name} has disconnected. Session ending.`);
      handleCheckIn();
    });

    // Listen for match timeout
    newSocket.on('match-timeout', () => {
      alert('No match found after 10 minutes. Please try again.');
      setScreen('welcome');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load todos from storage
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const stored = await window.storage?.get('todos', false);
        if (stored && stored.value) {
          setTodos(JSON.parse(stored.value));
        }
      } catch (e) {
        console.log('Could not load todos');
      }
    };
    loadTodos();
  }, []);

  // Save todos to storage
  const saveTodos = async (updatedTodos) => {
    try {
      await window.storage?.set('todos', JSON.stringify(updatedTodos), false);
    } catch (e) {
      console.log('Could not save todos');
    }
  };

  // Add todo
  const addTodo = () => {
    if (newTodo.trim()) {
      const updated = [...todos, { id: Date.now(), text: newTodo, completed: false }];
      setTodos(updated);
      saveTodos(updated);
      setNewTodo('');
    }
  };

  // Toggle todo completion
  const toggleTodo = (id) => {
    const updated = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updated);
    saveTodos(updated);
  };

  // Delete todo
  const deleteTodo = (id) => {
    const updated = todos.filter(todo => todo.id !== id);
    setTodos(updated);
    saveTodos(updated);
  };

  // Find match
  const findMatch = (duration) => {
    if (!socket || !isConnected) {
      alert('Not connected to server. Please refresh the page.');
      return;
    }
    
    setScreen('matching');
    setSessionLength(duration);
    
    socket.emit('find-match', {
      duration: duration,
      userName: 'Focused User'
    });
  };

  // Send chat message
  const sendMessage = () => {
    if (newMessage.trim() && socket && sessionId) {
      socket.emit('send-message', {
        sessionId: sessionId,
        text: newMessage
      });
      setNewMessage('');
    }
  };

  // Toggle voice chat
  const toggleVoice = () => {
    const newStatus = !isVoiceActive;
    setIsVoiceActive(newStatus);
    
    if (socket && sessionId) {
      socket.emit('voice-status', {
        sessionId: sessionId,
        isActive: newStatus
      });
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            setScreen('checkin');
            if (socket && sessionId) {
              socket.emit('end-session', { sessionId });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeRemaining, socket, sessionId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = async () => {
    if (checkInNote.trim()) {
      try {
        const checkIns = await window.storage?.get('checkins', false);
        const history = checkIns ? JSON.parse(checkIns.value) : [];
        history.unshift({
          date: new Date().toISOString(),
          duration: sessionLength,
          partner: partnerName,
          note: checkInNote
        });
        await window.storage?.set('checkins', JSON.stringify(history.slice(0, 10)), false);
      } catch (e) {
        console.log('Could not save check-in');
      }
    }
    
    // Reset
    setScreen('welcome');
    setSessionLength(null);
    setTimeRemaining(null);
    setPartnerName('');
    setCheckInNote('');
    setSessionId(null);
    setChatMessages([]);
    setIsVoiceActive(false);
    setPartnerVoiceActive(false);
  };

  const progress = sessionLength ? ((sessionLength * 60 - timeRemaining) / (sessionLength * 60)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 text-gray-900 flex items-center justify-center p-4">
      {/* Connection indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}></div>
          <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {screen === 'welcome' && (
        <div className="max-w-2xl w-full animate-fadeIn">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-6xl font-bold mb-4 mono tracking-tight text-gray-900">
              FOCUS<span className="text-blue-600">SYNC</span>
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Anonymous accountability partners.<br />Synchronized work sessions.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900">How it works</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mono font-bold text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">Choose your session length</h3>
                  <p className="text-gray-600 text-sm">Pick 25 or 50 minutes of focused work</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mono font-bold text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">Get matched instantly</h3>
                  <p className="text-gray-600 text-sm">Connect with a real person ready for the same session</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mono font-bold text-white">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">Work together</h3>
                  <p className="text-gray-600 text-sm">Chat, share voice status, and stay accountable</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mono font-bold text-white">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-900">Check in afterward</h3>
                  <p className="text-gray-600 text-sm">Brief reflection to close the session</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => findMatch(25)}
              disabled={!isConnected}
              className="group relative bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 disabled:cursor-not-allowed"
            >
              <div className="text-5xl mono font-bold mb-2">25</div>
              <div className="text-sm uppercase tracking-wider text-blue-100">minutes</div>
              <div className="text-xs text-blue-200 mt-2">Pomodoro Sprint</div>
            </button>
            
            <button
              onClick={() => findMatch(50)}
              disabled={!isConnected}
              className="group relative bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 disabled:cursor-not-allowed"
            >
              <div className="text-5xl mono font-bold mb-2">50</div>
              <div className="text-sm uppercase tracking-wider text-purple-100">minutes</div>
              <div className="text-xs text-purple-200 mt-2">Deep Work</div>
            </button>
          </div>
        </div>
      )}

      {screen === 'matching' && (
        <div className="max-w-md w-full text-center animate-fadeIn">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6 animate-spin-slow">
              <Zap className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold mb-4 mono text-gray-900">Finding your partner...</h2>
            <p className="text-gray-600">
              Matching you with someone ready for a {sessionLength}-minute session
            </p>
          </div>
          
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          
          <button
            onClick={() => {
              socket?.emit('cancel-match');
              setScreen('welcome');
            }}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Cancel search
          </button>
        </div>
      )}

      {screen === 'session' && (
        <div className="max-w-7xl w-full animate-fadeIn">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 bg-green-100 px-6 py-3 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-semibold">Session Active</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Timer and Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Partner Status Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">You</div>
                      <div className="font-semibold text-gray-900">Staying Focused</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Working</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center relative">
                      <Users className="w-5 h-5 text-white" />
                      {partnerVoiceActive && (
                        <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Partner</div>
                      <div className="font-semibold text-gray-900">{partnerName}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Working</span>
                  </div>
                </div>
              </div>

              {/* Main Timer */}
              <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-xl text-center">
                <div className="mb-4">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-8xl mono font-bold mb-4 tracking-tight text-gray-900">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-gray-600 text-lg">
                    {Math.floor(progress)}% complete
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Voice Chat Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={toggleVoice}
                    className={`relative p-4 rounded-full transition-all duration-300 ${
                      isVoiceActive 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {isVoiceActive ? (
                      <>
                        <Mic className="w-6 h-6" />
                        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                      </>
                    ) : (
                      <MicOff className="w-6 h-6" />
                    )}
                  </button>
                  <div className="text-sm text-gray-600">
                    {isVoiceActive ? 'Voice chat active' : 'Click to enable voice chat'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Todo List and Chat */}
            <div className="space-y-6">
              {/* Todo List */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                <button
                  onClick={() => setShowTodoPanel(!showTodoPanel)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ListTodo className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">To-Do List</span>
                  </div>
                  <span className="text-sm text-gray-600">{todos.filter(t => !t.completed).length} active</span>
                </button>
                
                {showTodoPanel && (
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                        placeholder="Add a task..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                      <button
                        onClick={addTodo}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {todos.map(todo => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                        >
                          <button
                            onClick={() => toggleTodo(todo.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              todo.completed 
                                ? 'bg-green-600 border-green-600' 
                                : 'border-gray-300 hover:border-blue-600'
                            }`}
                          >
                            {todo.completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {todo.text}
                          </span>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {todos.length === 0 && (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No tasks yet. Add one to get started!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col" style={{height: '400px'}}>
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">Chat</span>
                  </div>
                  {chatMessages.length > 0 && (
                    <span className="text-sm text-gray-600">{chatMessages.length} messages</span>
                  )}
                </button>
                
                {showChat && (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs ${msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} rounded-2xl px-4 py-2`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-500'}`}>
                              {msg.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                      
                      {chatMessages.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          Say hi to {partnerName}! 👋
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        />
                        <button
                          onClick={sendMessage}
                          className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'checkin' && (
        <div className="max-w-lg w-full animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold mb-3 mono text-gray-900">Session Complete!</h2>
            <p className="text-gray-600">
              You and {partnerName} just completed {sessionLength} minutes of focused work.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-6">
            <label className="block text-sm font-semibold mb-3 text-gray-700">
              How did it go? (Optional)
            </label>
            <textarea
              value={checkInNote}
              onChange={(e) => setCheckInNote(e.target.value)}
              placeholder="Completed 3 tasks, felt productive..."
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
            />
          </div>

          <button
            onClick={handleCheckIn}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl py-4 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            Finish & Return Home
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
