#!/bin/bash
# Deployment commands for Linux server

cd /var/www/nm2timesheet

# Pull latest changes
sudo git pull

# Rebuild the application
sudo npm run build

# Restart PM2 process (use the correct process name)
pm2 restart nm2timesheet

# Or if that doesn't work, try:
# pm2 restart all
# Or check the process list first:
# pm2 list

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo "Deployment complete!"

