# Production Fix Guide

## Problem
- Redirect loop (ERR_TOO_MANY_REDIRECTS)
- Static assets 404 errors

## Root Cause
The nginx configuration needs to pass requests correctly to Next.js without modifying the path.

## Solution

### Step 1: Verify Next.js Config
The `next.config.js` should automatically use `/nm2timesheet` in production:
```javascript
basePath: process.env.NEXT_PUBLIC_USE_BASEPATH === 'false' ? '' : (process.env.NODE_ENV === 'production' ? '/nm2timesheet' : '')
```

### Step 2: Use This Nginx Config
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name nm2tech-sas.com;

    ssl_certificate     /etc/letsencrypt/live/nm2tech-sas.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nm2tech-sas.com/privkey.pem;

    # Static assets - pass through as-is
    location /nm2timesheet/_next/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # App - pass through as-is (CRITICAL: no path after localhost:3000)
    location /nm2timesheet {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Everything else to landing page
    location / {
        return 302 https://landing.nm2tech-sas.com$request_uri;
    }
}
```

### Step 3: Commands to Run
```bash
# Update nginx config
sudo vi /etc/nginx/conf.d/nm2tech-sas.com.conf
# Paste the config above

# Test nginx
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check PM2 is running
pm2 list

# Check PM2 logs if issues persist
pm2 logs nm2timesheet --lines 50
```

## Why This Works
- `proxy_pass http://localhost:3000;` (no path) passes the full request path to Next.js
- Next.js receives `/nm2timesheet/login` and handles it with basePath
- No path modification = no redirect loop

