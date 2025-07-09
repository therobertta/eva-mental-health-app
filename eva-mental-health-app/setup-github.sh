#!/bin/bash

# GitHub Repository Setup Script
echo "🚀 Setting up GitHub repository for Eva Mental Health App"

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Eva Mental Health Companion App

- AI-powered therapeutic conversations with multiple frameworks
- Life wheel and feelings assessments
- Goal tracking and progress monitoring
- Crisis detection and safety features
- React frontend with Material-UI
- Express backend with PostgreSQL
- Docker deployment ready"

echo "
✅ Local git setup complete!

📋 Next steps to push to GitHub:

1. Create a new private repository on GitHub:
   - Go to https://github.com/new
   - Name: eva-mental-health-app (or your preferred name)
   - Select 'Private' repository
   - Don't initialize with README (we already have one)
   - Click 'Create repository'

2. After creating the repo, run these commands:
   git remote add origin https://github.com/YOUR_USERNAME/eva-mental-health-app.git
   git branch -M main
   git push -u origin main

3. For private repo access, you may need to:
   - Use a personal access token instead of password
   - Create one at: https://github.com/settings/tokens
   - Select 'repo' scope for private repository access

4. Optional: Add collaborators
   - Go to Settings → Manage access → Invite a collaborator

🔒 Security reminder:
   - The .gitignore file excludes sensitive files like .env
   - Never commit your OpenAI API key or other secrets
   - Review all files before pushing to ensure no sensitive data
"