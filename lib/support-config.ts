// Support System Configuration

export const SUPPORT_CONFIG = {
  // WebSocket Signaling Server
  WS_SIGNALING_URL: process.env.NEXT_PUBLIC_WS_SIGNALING_URL || 'ws://localhost:3001',
  WS_SIGNALING_SECURE: process.env.WS_SIGNALING_SECURE === 'true',
  
  // STUN/TURN Servers for WebRTC NAT Traversal
  ICE_SERVERS: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    {
      urls: process.env.NEXT_PUBLIC_TURN_URL || 'turn:turnserver.example.com',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
  ],
  
  // Call Configuration
  CALL_CONFIG: {
    max_duration_seconds: 3600, // 1 hour max call duration
    ring_timeout_seconds: 30,
    call_decline_timeout_seconds: 60,
  },
  
  // Chat Configuration
  CHAT_CONFIG: {
    max_concurrent_chats_per_agent: 5,
    message_max_length: 5000,
    auto_assign_enabled: true,
    queue_timeout_seconds: 300, // 5 minutes before abandoned
  },
  
  // Audio/Video Quality
  MEDIA_CONFIG: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
    },
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  },
  
  // Sensitive Data Masking Patterns
  SENSITIVE_PATTERNS: {
    account_number: /\b\d{10,20}\b/g,
    pin: /\b\d{4,6}\b/g,
    card_number: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  
  // Support Features
  FEATURES: {
    text_chat: true,
    voice_calls: true,
    video_calls: false, // Can be enabled later
    file_sharing: true,
    call_recording: true,
    chat_history: true,
  },
}

export const maskSensitiveData = (text: string): string => {
  let masked = text
  Object.entries(SUPPORT_CONFIG.SENSITIVE_PATTERNS).forEach(([_, pattern]) => {
    masked = masked.replace(pattern, '****')
  })
  return masked
}
