# 🤖 AI Knowledge-Based Document Assistant

A full-stack RAG (Retrieval-Augmented Generation) application that allows users to upload documents and get AI-powered answers based specifically on their uploaded content.

## 🌟 Features

- **🔐 Authentication**: Secure sign up, sign in, forgot password with JWT
- **📁 Document Upload**: Upload multiple file types (PDF, DOC, DOCX, TXT, Images)
- **🤖 AI Assistant**: Ask questions and get answers based only on your uploaded documents
- **📝 Recent Searches**: View and reuse previous queries
- **🔍 Smart Search**: Elasticsearch-powered document retrieval
- **📊 Real-time Monitoring**: Comprehensive logging and monitoring system

## 🏗️ Project Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Infrastructure │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │◄──►│ • Node.js       │◄──►│ • MongoDB       │
│ • Responsive    │    │ • Express       │    │ • Redis         │
│ • SPA Design    │    │ • JWT Auth      │    │ • RabbitMQ      │
│                 │    │ • File Upload   │    │ • Elasticsearch │
└─────────────────┘    └─────────────────┘    │ • Logstash      │
                                              └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   AI Service    │
                    │                 │
                    │ • Groq API      │
                    │ • Text Analysis │
                    │ • RAG Pipeline  │
                    └─────────────────┘
```

## 🔄 Application Workflow

### User Journey Flow
```
1. User Registration/Login
   ├── Sign Up → Email Verification → Account Created
   └── Sign In → JWT Token → Main Dashboard

2. Document Management
   ├── File Upload → Text Extraction → MongoDB Storage
   └── Elasticsearch Indexing → Search Ready

3. AI Query Process
   ├── User Question → Document Search → Context Retrieval
   └── AI Processing → Answer Generation → Response Display

4. Data Management
   ├── Recent Searches → Query History
   └── Document List → File Management
```

### Technical Data Flow
```
Frontend (SPA) ──HTTP──► Backend API ──Store──► MongoDB
     │                       │                    │
     │                       ├──Cache──► Redis   │
     │                       │                   │
     │                       ├──Queue──► RabbitMQ│
     │                       │                   │
     │                       └──Index──► Elasticsearch
     │                                           │
     └──Response──◄ AI Service ◄──Search────────┘
                      (Groq)
```

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (user data, documents, searches)
- Redis (session management, token blacklisting)
- RabbitMQ (message queuing for logs)
- Elasticsearch (document search and indexing)
- JWT (authentication)
- OpenAI API (LLM for responses)

### Frontend
- HTML, CSS, JavaScript (vanilla)
- Responsive design

### Infrastructure
- Logstash (log processing from RabbitMQ to Elasticsearch)
- Docker Compose (all services)

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Groq API Key** - [Get free API key](https://console.groq.com/)

### 📋 Step-by-Step Setup

#### 1. Clone & Navigate
```bash
git clone <your-repo-url>
cd FINAL
```

#### 2. Start Infrastructure Services
```bash
# Start all backend services (MongoDB, Redis, RabbitMQ, Elasticsearch, Logstash)
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Services Started:**
- 🗄️ **MongoDB** (port 27017) - Database
- 🔄 **Redis** (port 6379) - Session cache
- 🐰 **RabbitMQ** (port 5672, UI: 15672) - Message queue
- 🔍 **Elasticsearch** (port 9200) - Search engine
- 📊 **Logstash** - Log processing

#### 3. Backend Configuration
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

**Edit `.env` file:**
```env
# Required: Add your Groq API key
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional: Email configuration for password reset
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# JWT Secret (auto-generated if not provided)
JWT_SECRET=your_jwt_secret_here
```

#### 4. Start Backend Server
```bash
# Development mode (auto-restart)
npm run dev

# OR Production mode
npm start
```
**Backend runs on:** http://localhost:5010

#### 5. Start Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Start frontend server
npm start
```
**Frontend runs on:** http://localhost:3000

### 🎯 Access Points
- **Main Application:** http://localhost:3000
- **Backend API:** http://localhost:5010/api
- **RabbitMQ Management:** http://localhost:15672 (admin/admin)
- **Elasticsearch:** http://localhost:9200

## 🛑 How to Stop the Project

### Stop All Services
```bash
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)

# Stop Docker services
docker-compose down

# Stop and remove all data (⚠️ This deletes all data)
docker-compose down -v
```

### Restart Services
```bash
# Restart infrastructure
docker-compose restart

# Restart specific service
docker-compose restart mongodb
docker-compose restart elasticsearch
```

## 📖 How to Use

### First Time Setup
1. **🔐 Create Account**: Sign up with username, email, and secure password
2. **✅ Verify Setup**: Check that all services are running (green status indicators)

### Daily Workflow
1. **📝 Sign In**: Log in with your credentials
2. **📁 Upload Documents**: 
   - Click the 📎 icon to select files
   - Supported: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
   - Max size: 10MB per file
3. **❓ Ask Questions**: Type questions about your documents in the search bar
4. **🤖 Get AI Answers**: Receive responses based only on your uploaded content
5. **📚 Browse History**: Click previous queries in the sidebar to reuse them
6. **🗑️ Manage Files**: View and delete documents from the sidebar

### Pro Tips
- Upload related documents together for better context
- Ask specific questions for more accurate answers
- Use the recent searches to quickly repeat common queries
- Check the status indicators to ensure all services are working

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Login
- `POST /api/auth/forgot-password` - Request password reset

### Documents
- `POST /api/documents/upload` - Upload files (max 20/24h)
- `GET /api/documents/list` - List user documents
- `GET /api/documents/upload-status` - Check upload limit

### Search
- `POST /api/search/query` - Ask question
- `GET /api/search/recent` - Get recent searches

## 🏛️ System Architecture

### RAG (Retrieval-Augmented Generation) Pipeline
```
📄 Document Upload
    ↓
📝 Text Extraction (PDF, DOC, etc.)
    ↓
💾 Store in MongoDB + Index in Elasticsearch
    ↓
❓ User Query
    ↓
🔍 Elasticsearch Search (Find relevant documents)
    ↓
📋 Context Preparation (Extract relevant snippets)
    ↓
🤖 AI Processing (Groq LLM generates answer)
    ↓
💬 Response to User
    ↓
📊 Log to RabbitMQ → Logstash → Elasticsearch (Monitoring)
```

### Security Architecture
```
🌐 Frontend ──HTTPS──► 🛡️ JWT Auth ──► 🔐 Protected Routes
                           │
                           ├──► 🔑 Redis (Token Blacklist)
                           ├──► 🔒 bcrypt (Password Hash)
                           └──► ⏰ Session Management
```

## Security Features

- Password hashing (bcrypt)
- JWT token authentication
- Token blacklisting in Redis
- File type validation
- Upload rate limiting (20 files/24h)

## 📊 Monitoring & Debugging

### Service Health Checks
- **Application Status**: Check green/red indicators in the UI
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)
- **Elasticsearch**: http://localhost:9200
- **Backend Health**: http://localhost:5010/health

### Logs & Debugging
```bash
# View Docker service logs
docker-compose logs mongodb
docker-compose logs elasticsearch
docker-compose logs rabbitmq

# View application logs
cd backend && npm run dev  # Shows detailed logs

# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices
```

### Common Issues & Solutions
| Issue | Solution |
|-------|----------|
| Services not starting | Run `docker-compose down && docker-compose up -d` |
| Upload fails | Check file size (<10MB) and type (PDF, DOC, etc.) |
| Search not working | Verify Elasticsearch is running on port 9200 |
| AI not responding | Check Groq API key in `.env` file |

## 🔧 Troubleshooting

### Port Conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "27018:27017"  # Change MongoDB port
  - "9201:9200"    # Change Elasticsearch port
```

### Reset Everything
```bash
# Complete reset (⚠️ Deletes all data)
docker-compose down -v
docker system prune -f
docker-compose up -d
```

## 📝 Important Notes

- **File Types**: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
- **File Size**: Maximum 10MB per file
- **AI Responses**: Based ONLY on your uploaded documents
- **Data Privacy**: All data stored locally, not shared externally
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
