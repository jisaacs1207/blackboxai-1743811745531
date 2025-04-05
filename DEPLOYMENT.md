# Deployment Guide for Wasatch Academy Partners Portal

## Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- A Plesk server with Node.js support
- SSL certificate for your domain

## Pre-Deployment Steps

1. **Environment Setup**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with production values
   nano .env
   ```

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Test Build**
   ```bash
   # Start server to verify everything works
   npm start
   ```

## Plesk Deployment Steps

1. **Domain Setup in Plesk**
   - Log into Plesk control panel
   - Navigate to Domains > your-domain.com
   - Enable Node.js support
   - Set document root to `/client`

2. **Upload Files**
   - Use Git deployment or FTP to upload files
   - Ensure proper file permissions:
     ```bash
     chmod 755 server/
     chmod 644 server/*.js
     chmod 644 client/*
     ```

3. **Environment Configuration**
   - In Plesk, go to Domains > your-domain.com > Node.js
   - Add environment variables from your .env file
   - Set NODE_ENV=production

4. **Application Setup**
   - SSH into your server
   - Navigate to application directory
   - Install PM2 globally:
     ```bash
     npm install -g pm2
     ```
   - Start application:
     ```bash
     pm2 start server/server.js --name "wasatch-partners"
     pm2 save
     ```
   - Configure PM2 startup:
     ```bash
     pm2 startup
     ```

5. **SSL Configuration**
   - Install SSL certificate through Plesk
   - Enable HTTPS in domain settings
   - Update .env CORS_ORIGIN with https URL

6. **Security Checklist**
   - [ ] Strong admin password set
   - [ ] Session secret changed
   - [ ] CORS origin set correctly
   - [ ] SSL enabled
   - [ ] File permissions set correctly
   - [ ] Backup system configured

## Monitoring & Maintenance

1. **Monitor Application**
   ```bash
   pm2 monit
   pm2 logs
   ```

2. **Update Application**
   ```bash
   # Pull latest changes
   git pull origin main

   # Install dependencies
   npm install --production

   # Restart application
   pm2 restart wasatch-partners
   ```

3. **Backup Strategy**
   - Regular database backups
   - File system backups
   - Configuration backups

## Important Notes

1. **Header Logo**
   - Recommended size: 500x100 pixels
   - Format: PNG with transparency
   - Location: Update in client/index.html

2. **Partner Images**
   - Recommended size: 800x600 pixels
   - Aspect ratio: 16:9
   - Format: JPG or PNG
   - Max file size: 2MB

3. **Data Storage**
   - Partner data stored in: server/data/partners.json
   - Automatic backups in: server/data/partners.backup.json
   - Session data in: server/sessions/

## Troubleshooting

1. **Application Won't Start**
   - Check logs: `pm2 logs`
   - Verify environment variables
   - Check file permissions
   - Ensure ports are available

2. **Session Issues**
   - Clear sessions directory
   - Verify cookie settings
   - Check SSL configuration

3. **Image Upload Issues**
   - Verify image dimensions
   - Check file permissions
   - Ensure proper URL format

## Support

For technical support or questions, please contact:
- Email: [your-support-email]
- Phone: [your-support-phone]
