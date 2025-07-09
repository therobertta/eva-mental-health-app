# Eva Mental Health App

Eva is an AI-powered mental health companion that uses advanced belief modeling to provide personalized therapeutic support. Unlike generic mental health apps, Eva adapts its therapeutic approach based on your unique philosophical framework and preferences.

## 🌟 Key Features

### **Belief-Aware Personalization**
- **Epistemic Me SDK Integration**: Uses advanced belief modeling to understand your therapeutic preferences
- **Therapeutic Modality Matching**: Routes conversations to CBT, Humanistic, Mindfulness, Psychodynamic, or Existential approaches
- **Communication Style Adaptation**: Adjusts directness, warmth, structure, and pace based on your comfort level
- **Real-time Preference Learning**: Continuously refines understanding through conversation analysis

### **Therapeutic Modalities**
- **Cognitive Behavioral Therapy (CBT)**: Structured, solution-focused approach
- **Humanistic Therapy**: Growth-oriented, non-directive support
- **Mindfulness & Acceptance**: Present-moment awareness and acceptance
- **Psychodynamic Therapy**: Insight-oriented pattern exploration
- **Existential Therapy**: Meaning and purpose-focused support

### **Safety & Crisis Support**
- **Crisis Detection**: Monitors for crisis indicators and provides immediate safety resources
- **Human Escalation**: Clear pathways to professional help when needed
- **Crisis Resources**: Direct access to suicide prevention and crisis support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- OpenAI API key
- Epistemic Me SDK (optional, falls back to basic detection)

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp config/environment.js .env
   # Edit .env with your configuration
   ```

3. **Set up database**:
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Epistemic Me SDK Configuration
EPISTEMIC_ME_URL=http://localhost:8120

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eva_mental_health
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

### Epistemic Me SDK Integration

Eva integrates with the Epistemic Me SDK for advanced belief modeling:

1. **Install Epistemic Me SDK** (optional):
   ```bash
   # Follow Epistemic Me installation instructions
   # https://github.com/Epistemic-Me/Self-Management-Agent
   ```

2. **Configure SDK URL** in your `.env` file:
   ```env
   EPISTEMIC_ME_URL=http://localhost:8120
   ```

3. **Fallback Mode**: If Epistemic Me is unavailable, Eva uses built-in belief detection algorithms.

## 📊 API Endpoints

### Conversations
- `POST /api/conversations/message` - Send a message and get therapeutic response
- `GET /api/conversations/history/:userId` - Get conversation history
- `POST /api/conversations/analyze-beliefs` - Analyze therapeutic beliefs
- `POST /api/conversations/adapt-conversation` - Adapt conversation based on preferences
- `GET /api/conversations/therapeutic-modalities` - Get available modalities
- `POST /api/conversations/feedback` - Submit feedback on responses

### Assessments
- `POST /api/assessments/therapeutic-preferences` - Assess therapeutic preferences
- `POST /api/assessments/belief-system` - Assess belief system
- `GET /api/assessments/questions/therapeutic-preferences` - Get assessment questions
- `POST /api/assessments/process-answers` - Process assessment answers
- `GET /api/assessments/profile/:userId` - Get therapeutic profile
- `POST /api/assessments/update-profile` - Update therapeutic profile

## 🧠 How Belief Modeling Works

### 1. **Conversation Analysis**
Eva analyzes your messages for:
- Therapeutic approach indicators (CBT, Humanistic, etc.)
- Vulnerability comfort levels
- Communication style preferences
- Change belief systems (gradual vs breakthrough)

### 2. **Belief System Detection**
Using Epistemic Me SDK or fallback algorithms:
- **Change Beliefs**: How you think people grow and change
- **Vulnerability Comfort**: Your comfort with emotional exploration
- **Therapeutic Philosophy**: Your preferred therapeutic approach
- **Self-Efficacy**: Your confidence in managing mental health

### 3. **Therapeutic Adaptation**
Based on detected beliefs:
- **Modality Selection**: Routes to appropriate therapeutic approach
- **Communication Style**: Adjusts directness, warmth, structure, pace
- **Exercise Selection**: Recommends relevant therapeutic activities
- **Conversation Depth**: Adapts to your vulnerability comfort level

## 🎯 Therapeutic Modalities

### **Cognitive Behavioral Therapy (CBT)**
- **Approach**: Structured, solution-focused
- **Communication**: Direct, warm, structured
- **Exercises**: Thought records, behavioral experiments, cognitive restructuring
- **Best For**: Users who prefer practical strategies and clear goals

### **Humanistic Therapy**
- **Approach**: Growth-oriented, non-directive
- **Communication**: Very warm, reflective, non-judgmental
- **Exercises**: Values clarification, self-compassion practices, authenticity exploration
- **Best For**: Users who value personal growth and self-discovery

### **Mindfulness & Acceptance Therapy**
- **Approach**: Present-moment awareness and acceptance
- **Communication**: Gentle, slow-paced, contemplative
- **Exercises**: Meditation, body scans, mindful awareness
- **Best For**: Users who prefer acceptance over change

### **Psychodynamic Therapy**
- **Approach**: Insight-oriented pattern exploration
- **Communication**: Warm, analytical, interpretive
- **Exercises**: Pattern recognition, relationship exploration, insight journaling
- **Best For**: Users who want to understand underlying patterns

### **Existential Therapy**
- **Approach**: Meaning and purpose-focused
- **Communication**: Authentic, direct about life's challenges
- **Exercises**: Meaning exploration, values clarification, authentic choice work
- **Best For**: Users grappling with fundamental life questions

## 🔒 Safety & Ethics

### **Crisis Detection**
- Monitors for crisis indicators in real-time
- Provides immediate safety resources
- Clear escalation pathways to human professionals

### **Professional Boundaries**
- Explicit non-clinical positioning
- Clear disclaimers about not replacing therapy
- Encourages professional help when appropriate

### **Privacy & Security**
- Local belief model processing
- Encrypted data transmission
- User data ownership and portability

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**:
   ```bash
   NODE_ENV=production
   # Configure production database
   # Set up SSL certificates
   # Configure logging and monitoring
   ```

2. **Database Setup**:
   ```bash
   npm run migrate:prod
   ```

3. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

4. **Deploy with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Crisis Support**: If you're in crisis, please contact:
  - National Suicide Prevention Lifeline: 988
  - Crisis Text Line: Text HOME to 741741
  - Emergency: 911

- **Technical Support**: Open an issue on GitHub

## 🙏 Acknowledgments

- **Epistemic Me**: For the belief modeling SDK and reference implementation
- **OpenAI**: For the GPT-4 integration
- **Material-UI**: For the beautiful UI components
- **Mental Health Community**: For ongoing feedback and guidance

---

**Remember**: Eva is designed to support your mental health journey, not replace professional therapy. Always seek professional help when needed.