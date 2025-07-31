# 🔧 Nginx Configuration Documentation

This document explains the Nginx configuration for the B2B Business Listings application and addresses common configuration issues.

## 📋 **Current Configuration Status**

✅ **All Nginx configurations are valid and follow best practices**
✅ **No invalid `expires must-revalidate` directives found**
✅ **Proper cache headers implemented for different file types**
✅ **Security headers configured**
✅ **API proxy configuration included**

## 🚨 **Issue Resolution: `expires must-revalidate`**

### **Problem**
The original issue was with invalid Nginx syntax like:
```nginx
expires 1h must-revalidate;  # ❌ Invalid syntax
```

### **Solution**
Replace invalid `expires` directives with proper syntax:
```nginx
expires 1h;  # ✅ Valid expires directive
add_header Cache-Control "public, max-age=3600, must-revalidate";  # ✅ Proper cache control
```

### **Duration Conversion Table**
| Duration | Seconds | Use Case |
|----------|---------|----------|
| `1s` | 1 | Immediate |
| `1m` | 60 | Short-term |
| `1h` | 3600 | Medium-term |
| `1d` | 86400 | Daily |
| `1w` | 604800 | Weekly |
| `1y` | 31536000 | Long-term |

## 🔧 **Current Nginx Configuration**

### **File: `nginx.conf`**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache HTML files for a shorter time
        expires 1h;
        add_header Cache-Control "public, max-age=3600, must-revalidate";
    }

    # Cache static assets with different strategies
    location ~* \.(js|css)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location ~* \.(png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, must-revalidate";
    }

    location ~* \.(woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Don't cache API responses
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Security: Deny access to backup files
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

## 📊 **Caching Strategy**

### **File Type Caching**

| File Type | Duration | Cache Control | Strategy |
|-----------|----------|---------------|----------|
| HTML | 1 hour | `must-revalidate` | Short cache for SPA updates |
| JS/CSS | 1 year | `immutable` | Long cache for static assets |
| Images | 30 days | `must-revalidate` | Medium cache for images |
| Fonts | 1 year | `immutable` | Long cache for fonts |
| API | No cache | `no-cache, no-store` | Never cache API responses |

### **Cache Control Headers**

- **`public`**: Cacheable by browsers and CDNs
- **`max-age=<seconds>`**: How long to cache
- **`immutable`**: File will never change (for versioned assets)
- **`must-revalidate`**: Check with server before using cached version
- **`no-cache`**: Always check with server
- **`no-store`**: Never store in cache

## 🔒 **Security Features**

### **Security Headers**
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: XSS protection
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **Content-Security-Policy**: Resource loading restrictions

### **Access Control**
- **Hidden files**: Denied access to `.` files
- **Backup files**: Denied access to `~` files
- **Health endpoint**: Minimal logging

## 🚀 **Performance Optimizations**

### **Gzip Compression**
- Enabled for text-based files
- Minimum size: 1024 bytes
- Vary header for proper caching

### **Static Asset Caching**
- Long-term caching for immutable assets
- Version-based cache invalidation
- CDN-friendly headers

### **API Proxy**
- Proper headers for backend communication
- No caching for dynamic content
- WebSocket support

## 🛠️ **Configuration Validation**

### **Automated Testing**
Use the provided script to validate configuration:

```bash
./fix-nginx-config.sh
```

### **Manual Testing**
```bash
# Test Nginx syntax
nginx -t

# Test configuration file
nginx -t -c nginx.conf

# Reload configuration
nginx -s reload
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Invalid Expires Directive**
```nginx
# ❌ Wrong
expires 1h must-revalidate;

# ✅ Correct
expires 1h;
add_header Cache-Control "public, max-age=3600, must-revalidate";
```

#### **2. Missing Semicolons**
```nginx
# ❌ Wrong
expires 1h

# ✅ Correct
expires 1h;
```

#### **3. Incorrect Cache Headers**
```nginx
# ❌ Wrong
add_header Cache-Control "public, max-age=3600, must-revalidate"

# ✅ Correct
add_header Cache-Control "public, max-age=3600, must-revalidate";
```

### **Debug Commands**
```bash
# Check Nginx status
nginx -t

# View error logs
tail -f /var/log/nginx/error.log

# Test specific location
curl -I http://localhost/health

# Check cache headers
curl -I http://localhost/assets/main.js
```

## 📝 **Deployment Notes**

### **Docker Deployment**
The Nginx configuration is copied to the Docker container:
```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### **Coolify Deployment**
- Configuration is included in the Docker image
- No additional configuration needed
- Health check endpoint available at `/health`

### **Environment Variables**
No environment-specific configuration needed in Nginx. All settings are static and optimized for production.

## 🔄 **Maintenance**

### **Regular Tasks**
1. **Monitor logs** for errors
2. **Update security headers** as needed
3. **Review cache strategies** based on usage
4. **Test configuration** after changes

### **Performance Monitoring**
- Monitor cache hit rates
- Check compression ratios
- Review response times
- Monitor error rates

---

## 📚 **Additional Resources**

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx Cache Control](https://nginx.org/en/docs/http/ngx_http_headers_module.html)
- [Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Cache Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

**✅ Configuration Status: Ready for Production** 