# 🛠️ Technology Setup Guide

Complete installation guide for all technologies used in the AI Knowledge-Based Document Assistant project.

## 📋 Technology Stack Overview

| Category | Technology | Purpose | Installation Required |
|----------|------------|---------|---------------------|
| **Runtime** | Node.js v18+ | Backend JavaScript runtime | ✅ Yes |
| **Containerization** | Docker & Docker Compose | Service orchestration | ✅ Yes |
| **Database** | MongoDB | Document & user data storage | 🐳 Docker |
| **Cache** | Redis | Session management | 🐳 Docker |
| **Message Queue** | RabbitMQ | Log processing queue | 🐳 Docker |
| **Search Engine** | Elasticsearch | Document indexing & search | 🐳 Docker |
| **Log Processing** | Logstash | Log aggregation | 🐳 Docker |
| **AI Service** | Groq API | Language model processing | 🔑 API Key |
| **Frontend** | HTML/CSS/JavaScript | User interface | 📦 Included |

## 🖥️ Operating System Specific Installation

### Windows Installation

#### 1. Install Node.js
```powershell
# Option 1: Download from official website
# Visit: https://nodejs.org/
# Download LTS version (v18 or higher)
# Run installer and follow setup wizard

# Option 2: Using Chocolatey (if installed)
choco install nodejs

# Option 3: Using Winget
winget install OpenJS.NodeJS

# Verify installation
node --version
npm --version
```

#### 2. Install Docker Desktop
```powershell
# Download Docker Desktop for Windows
# Visit: https://docs.docker.com/desktop/install/windows-install/
# Requirements: Windows 10/11 with WSL2

# After installation, verify:
docker --version
docker-compose --version
```

#### 3. Install Git (if not already installed)
```powershell
# Download from: https://git-scm.com/download/win
# Or using package manager:
winget install Git.Git
```

### macOS Installation

#### 1. Install Node.js
```bash
# Option 1: Download from official website
# Visit: https://nodejs.org/

# Option 2: Using Homebrew (recommended)
brew install node

# Option 3: Using MacPorts
sudo port install nodejs18

# Verify installation
node --version
npm --version
```

#### 2. Install Docker Desktop
```bash
# Download Docker Desktop for Mac
# Visit: https://docs.docker.com/desktop/install/mac-install/

# Or using Homebrew
brew install --cask docker

# Verify installation
docker --version
docker-compose --version
```

### Linux (Ubuntu/Debian) Installation

#### 1. Install Node.js
```bash
# Option 1: Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2: Using snap
sudo snap install node --classic

# Option 3: Using package manager (older version)
sudo apt update
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

#### 2. Install Docker & Docker Compose
```bash
# Install Docker
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install docker-ce

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### Linux (CentOS/RHEL/Fedora) Installation

#### 1. Install Node.js
```bash
# For CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# For Fedora
sudo dnf install nodejs npm

# Verify installation
node --version
npm --version
```

#### 2. Install Docker & Docker Compose
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🔑 API Keys & External Services

### Groq API Setup
1. **Create Account**: Visit [console.groq.com](https://console.groq.com/)
2. **Get API Key**: 
   - Sign up/Login
   - Navigate to API Keys section
   - Create new API key
   - Copy the key (starts with `gsk_`)
3. **Add to Project**: 
   ```bash
   # In backend/.env file
   GROQ_API_KEY=gsk_your_api_key_here
   ```

### Email Service Setup (Optional)
For password reset functionality:
```bash
# Gmail App Password setup:
# 1. Enable 2-factor authentication on Gmail
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Add to .env file:
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

## 📦 Project Dependencies

### Backend Dependencies
```json
{
  "dependencies": {
    "@elastic/elasticsearch": "^8.11.0",  // Elasticsearch client
    "amqplib": "^0.10.3",                // RabbitMQ client
    "axios": "^1.13.2",                  // HTTP client
    "bcryptjs": "^2.4.3",               // Password hashing
    "cors": "^2.8.5",                   // Cross-origin requests
    "dotenv": "^16.3.1",                // Environment variables
    "express": "^4.18.2",               // Web framework
    "groq-sdk": "^0.37.0",              // Groq AI client
    "jsonwebtoken": "^9.0.2",           // JWT authentication
    "mammoth": "^1.6.0",                // Word document parser
    "mongoose": "^8.0.0",               // MongoDB ODM
    "multer": "^1.4.5-lts.1",           // File upload handling
    "nodemailer": "^6.9.7",             // Email sending
    "pdf-parse": "^1.1.1",              // PDF text extraction
    "redis": "^4.6.0"                   // Redis client
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "http-server": "^14.1.1",           // Static file server
    "marked": "^latest"                 // Markdown parser (CDN)
  }
}
```

## 🐳 Docker Services Configuration

### Services Overview
```yaml
# docker-compose.yml services:
services:
  mongodb:      # Database - Port 27017
  redis:        # Cache - Port 6379  
  rabbitmq:     # Message Queue - Port 5672, UI: 15672
  elasticsearch: # Search Engine - Port 9200
  logstash:     # Log Processing - Port 5044
```

### Resource Requirements
| Service | RAM | CPU | Disk |
|---------|-----|-----|------|
| MongoDB | 512MB | 0.5 | 1GB+ |
| Redis | 128MB | 0.1 | 100MB |
| RabbitMQ | 256MB | 0.2 | 200MB |
| Elasticsearch | 1GB | 0.5 | 2GB+ |
| Logstash | 512MB | 0.3 | 500MB |
| **Total** | **~2.5GB** | **1.6 CPU** | **4GB+** |

## ✅ Installation Verification

### Check All Prerequisites
```bash
# Node.js
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher

# Docker
docker --version          # Should show version info
docker-compose --version  # Should show version info

# Test Docker
docker run hello-world    # Should download and run successfully

# Check available ports
netstat -an | grep :27017  # Should be empty (MongoDB port)
netstat -an | grep :6379   # Should be empty (Redis port)
netstat -an | grep :9200   # Should be empty (Elasticsearch port)
```

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **CPU**: 2+ cores recommended
- **Disk**: 10GB+ free space
- **Network**: Internet connection for Docker images and API calls

## 🚨 Common Installation Issues

### Node.js Issues
```bash
# Permission errors on Linux/Mac
sudo chown -R $(whoami) ~/.npm

# Version conflicts
nvm install 18        # Use Node Version Manager
nvm use 18

# Windows path issues
# Add Node.js to PATH environment variable
```

### Docker Issues
```bash
# Docker daemon not running
sudo systemctl start docker    # Linux
# Start Docker Desktop app     # Windows/Mac

# Permission denied (Linux)
sudo usermod -aG docker $USER
newgrp docker

# Port conflicts
docker-compose down    # Stop conflicting services
```

### Network Issues
```bash
# Firewall blocking ports
sudo ufw allow 27017   # MongoDB
sudo ufw allow 6379    # Redis
sudo ufw allow 9200    # Elasticsearch

# DNS resolution issues
echo "127.0.0.1 localhost" >> /etc/hosts
```

## 🔄 Alternative Installation Methods

### Using Package Managers

#### Windows (Chocolatey)
```powershell
# Install Chocolatey first: https://chocolatey.org/install
choco install nodejs docker-desktop git
```

#### macOS (Homebrew)
```bash
# Install Homebrew first: https://brew.sh/
brew install node docker git
brew install --cask docker
```

#### Linux (Snap)
```bash
sudo snap install node --classic
sudo snap install docker
```

### Cloud Development Options
- **GitHub Codespaces**: Pre-configured development environment
- **GitPod**: Browser-based IDE with Docker support
- **Repl.it**: Online Node.js environment
- **CodeSandbox**: Frontend development environment

## 📚 Additional Resources

### Documentation Links
- [Node.js Official Docs](https://nodejs.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Elasticsearch Guide](https://www.elastic.co/guide/)
- [Groq API Documentation](https://console.groq.com/docs)

### Learning Resources
- [Node.js Tutorial](https://nodejs.dev/learn)
- [Docker Tutorial](https://docker-curriculum.com/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [MongoDB University](https://university.mongodb.com/)

### Community Support
- [Node.js Community](https://nodejs.org/en/get-involved/)
- [Docker Community](https://www.docker.com/community/)
- [Stack Overflow](https://stackoverflow.com/) - For technical questions
- [GitHub Issues](https://github.com/) - For project-specific issues

---

**Need Help?** If you encounter any issues during installation, check the troubleshooting section or create an issue in the project repository.