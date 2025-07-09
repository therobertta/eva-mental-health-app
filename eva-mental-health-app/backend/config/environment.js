require('dotenv').config();

module.exports = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Frontend URL for CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // OpenAI Configuration
  openaiApiKey: process.env.OPENAI_API_KEY,
  
  // Epistemic Me SDK Configuration
  epistemicMeUrl: process.env.EPISTEMIC_ME_URL || 'http://localhost:8120',
  
  // Database Configuration (PostgreSQL)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'eva_mental_health',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'eva-mental-health-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Security Configuration
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Therapeutic Configuration
  therapeutic: {
    defaultModality: 'humanistic',
    maxConversationHistory: 50,
    crisisKeywords: [
      'suicide', 'kill myself', 'want to die', 'end it all', 'no reason to live',
      'better off dead', 'hurt myself', 'self-harm', 'cutting', 'overdose'
    ],
    crisisResources: {
      nationalSuicidePrevention: '988',
      crisisTextLine: 'Text HOME to 741741',
      emergency: '911'
    }
  }
}; 