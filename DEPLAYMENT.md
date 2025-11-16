# QRcify Pro - Deployment Guide

## Development Setup (Current)
Backend and frontend run together on port 3000

## Production Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel):
1. Deploy `frontend/` and `dashboard/` folders
2. Set environment variables:
```
   VITE_API_URL=https://your-backend.railway.app
```

#### Backend (Railway):
1. Deploy `backend/` folder
2. Set environment variables:
```
   NODE_ENV=production
   JWT_SECRET=your_secure_secret
   FRONTEND_URL=https://your-frontend.vercel.app
   BASE_URL=https://your-backend.railway.app
```

### Option 2: Single VPS (DigitalOcean/AWS)

#### Setup:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repo
git clone https://github.com/Yashcodes124/Qr_Generator.git
cd Qr_Generator/QRcify

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

# Start with PM2
pm2 start backend/index.js --name qrcify-backend
pm2 startup
pm2 save
```

#### Nginx Config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/qrcify/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Dashboard
    location /dashboard {
        root /var/www/qrcify/frontend;
        try_files $uri $uri/ /dashboard/dashboard.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "backend/index.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  backend:
    build: ./QRcify
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./database:/app/database
      - ./encrypted:/app/encrypted
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
    restart: unless-stopped
```

## Environment Variables for Production

### Backend (.env):
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=generate_with_openssl_rand_base64_32
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
DB_DIALECT=sqlite
DB_STORAGE=./database/qr_generator.sqlite
MAX_FILE_SIZE=10mb
```

### Frontend (config.js):
```javascript
const config = {
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.yourdomain.com'
    : 'http://localhost:3000'
};
```

## Pre-Deployment Checklist
- [ ] Change all localhost URLs to production URLs
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure file upload limits
- [ ] Set up monitoring (PM2/New Relic)
- [ ] Test all endpoints
- [ ] Set up error logging
- [ ] Configure rate limiting
- [ ] Add security headers