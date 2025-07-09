# Eva Mental Health App - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Docker Desktop installed and running
- OpenAI API key (get one at https://platform.openai.com)

### 2. Clone and Setup
```bash
# Clone the repository
cd eva-mental-health-app

# Create environment file
cp backend/.env.example backend/.env
```

### 3. Add Your OpenAI API Key
Edit `backend/.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 4. Start the Application
```bash
# Start all services
docker-compose up

# In a new terminal, run database migrations
docker-compose exec backend npm run migrate

# Optional: Add test data
docker-compose exec backend npm run seed
```

### 5. Access the App
- 🌐 Open http://localhost:3000 in your browser
- 📧 Login with test credentials:
  - Email: `test@eva-app.com`
  - Password: `testpassword`

## 🎯 Try These Features

### 1. Have a Therapeutic Conversation
- Click "Start Conversation" on the dashboard
- Choose a conversation type and therapeutic framework
- Chat with Eva about anything on your mind

### 2. Take a Life Wheel Assessment
- Go to Assessments → Life Wheel
- Rate your satisfaction in 8 life areas
- Select priority areas to focus on
- Get personalized insights

### 3. Track Your Feelings
- Go to Assessments → Feelings Check-in
- Select your primary emotion and intensity
- Log what triggered the feeling
- Receive coping suggestions

### 4. Set Therapeutic Goals
- Navigate to Goals
- Create goals in different life categories
- Add progress notes as you work on them
- Track your journey over time

## 🛑 Stopping the Application
```bash
# Stop all services
docker-compose down

# Remove all data (including database)
docker-compose down -v
```

## 🆘 Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # Database

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Restart just the database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### OpenAI API Errors
- Verify your API key is correct
- Check you have credits in your OpenAI account
- Ensure the key has access to GPT-4

## 📝 Development Mode

For local development without Docker:

### Backend
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm start   # Runs on http://localhost:3000
```

## 🎨 Customization

### Change Therapeutic Approaches
Edit `backend/src/services/conversationService.js` to modify:
- Framework prompts
- Therapeutic techniques
- Response generation logic

### Modify UI Theme
Edit `frontend/src/App.js` to change:
- Color scheme
- Typography
- Component styling

### Add New Features
- Create new API endpoints in `backend/src/routes/`
- Add React components in `frontend/src/components/`
- Extend the database schema in `backend/database/migrations/`

## 🔒 Security Note

This is a demo application. For production use:
- Change all default passwords
- Use environment-specific JWT secrets
- Enable HTTPS
- Implement rate limiting
- Add proper error logging
- Review and enhance crisis detection logic

Happy exploring! 🌟