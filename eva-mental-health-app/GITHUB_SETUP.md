# GitHub Setup Instructions for Eva Mental Health App

## 🚀 Push to Private GitHub Repository

### 1. Create Private Repository on GitHub

1. Go to [https://github.com/new](https://github.com/new)
2. Repository settings:
   - **Name**: `eva-mental-health-app`
   - **Visibility**: **Private** (important for security)
   - **DO NOT** initialize with README, .gitignore, or license
3. Click **Create repository**

### 2. Add GitHub Remote and Push

After creating the repository, run these commands:

```bash
# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/eva-mental-health-app.git

# Rename branch to main
git branch -M main

# Push all commits
git push -u origin main
```

### 3. Authentication

When prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (PAT)

#### Creating a Personal Access Token:
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Settings:
   - **Note**: `eva-app-access`
   - **Expiration**: 90 days (or your preference)
   - **Scopes**: Select `repo` (full control of private repositories)
4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again)

### 4. Alternative: SSH Authentication (Recommended)

For easier future pushes, set up SSH:

```bash
# Check if you have SSH keys
ls -la ~/.ssh

# If no keys exist, generate one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add SSH key to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Copy the output

# Add to GitHub:
# Go to Settings → SSH and GPG keys → New SSH key
# Paste your public key

# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/eva-mental-health-app.git

# Test connection
ssh -T git@github.com
```

## 📋 Repository Settings

After pushing, configure your repository:

### 1. Add Repository Description
In your GitHub repo, click the gear icon next to "About" and add:
```
AI-powered mental health companion with Epistemic Me belief modeling integration
```

### 2. Add Topics
Click the gear icon and add topics:
- `mental-health`
- `ai`
- `belief-modeling`
- `therapeutic-chat`
- `epistemic-me`

### 3. Configure Branch Protection (Optional)
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews before merging
   - Dismiss stale pull request approvals
   - Include administrators

### 4. Add Collaborators
1. Go to Settings → Manage access
2. Click "Invite a collaborator"
3. Add team members or Epistemic Me developers

## 🔒 Security Checklist

Before pushing, verify:

- [ ] No `.env` files are committed (only `.env.example`)
- [ ] No API keys in code
- [ ] No sensitive user data
- [ ] Repository is set to PRIVATE
- [ ] `.gitignore` is properly configured

## 📝 After Pushing

### 1. Update Epistemic Me Integration

If you want to integrate with the official Epistemic Me repositories:

```bash
# Add Epistemic Me SDK as submodule (optional)
git submodule add https://github.com/Epistemic-Me/Self-Management-Agent epistemic-me-sdk
git commit -m "Add Epistemic Me SDK as submodule"
git push
```

### 2. Create Initial Issues

Create GitHub issues for tracking:

1. **Integration Testing**
   - Title: "Test Epistemic Me SDK integration"
   - Labels: `enhancement`, `testing`

2. **Documentation**
   - Title: "Create developer setup guide"
   - Labels: `documentation`

3. **Security Review**
   - Title: "Security audit for API endpoints"
   - Labels: `security`, `high-priority`

### 3. Set Up GitHub Actions (Optional)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run tests
      env:
        DB_HOST: localhost
        DB_USER: postgres
        DB_PASSWORD: postgres
      run: |
        cd backend
        npm test
```

## 🎯 Next Steps

1. **Clone on Another Machine**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/eva-mental-health-app.git
   cd eva-mental-health-app
   ```

2. **Keep Repository Updated**:
   ```bash
   git pull origin main
   ```

3. **Create Feature Branches**:
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

## 🆘 Troubleshooting

### "Repository not found" Error
- Ensure you're using the correct username
- Verify the repository is created
- Check you're authenticated properly

### "Permission denied" Error
- Regenerate your Personal Access Token
- Ensure token has `repo` scope
- Try SSH authentication instead

### Large File Issues
- Use Git LFS for large files:
  ```bash
  git lfs track "*.psd"
  git add .gitattributes
  ```

Happy coding! 🚀