# Redis VPS Setup Guide for Casino API Static IP

## Overview
This guide will help you set up Redis on your Hostinger VPS to provide a static IP for the casino API whitelist.

## Step 1: VPS Setup (Hostinger)

1. Purchase a VPS from Hostinger
2. Choose Ubuntu 22.04 LTS
3. Note down your VPS IP address - this will be your static IP to whitelist

## Step 2: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

## Step 3: Install Redis

```bash
# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server -y

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Step 4: Configure Redis for Remote Access

Edit Redis configuration:

```bash
sudo nano /etc/redis/redis.conf
```

Make these changes:

1. **Bind to all interfaces:**
   ```
   # Find this line:
   bind 127.0.0.1 ::1
   
   # Change to:
   bind 0.0.0.0
   ```

2. **Set a strong password:**
   ```
   # Find this line:
   # requirepass foobared
   
   # Change to (use your own strong password):
   requirepass YOUR_STRONG_PASSWORD_HERE
   ```

3. **Increase max memory (optional):**
   ```
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

4. **Save and exit** (Ctrl+X, then Y, then Enter)

## Step 5: Configure Firewall

```bash
# Allow Redis port
sudo ufw allow 6379/tcp

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

## Step 6: Restart Redis

```bash
sudo systemctl restart redis-server

# Check status
sudo systemctl status redis-server
```

## Step 7: Test Redis Connection

From your local machine:

```bash
# Install redis-cli if needed
sudo apt install redis-tools  # Ubuntu/Debian
brew install redis            # macOS

# Test connection
redis-cli -h YOUR_VPS_IP -p 6379 -a YOUR_PASSWORD ping
```

Should return: `PONG`

## Step 8: Configure Supabase Secrets

You've already added these secrets in Supabase:
- `REDIS_HOST`: Your VPS IP address
- `REDIS_PORT`: 6379 (default)
- `REDIS_PASSWORD`: Your Redis password
- `DIAMOND_CASINO_API_URL`: Your casino API URL
- `DIAMOND_CASINO_API_KEY`: Your casino API key

## Step 9: Whitelist Your VPS IP

Contact your casino service provider and give them your VPS IP address to whitelist.

## How It Works

```
User → Supabase Edge Function → Redis (VPS with Static IP) → Cache/Proxy → Casino API
                                      ↑
                                Static IP for whitelist
```

1. **Requests flow through Redis on your VPS**
2. **Your VPS has a static IP that gets whitelisted**
3. **Redis caches responses for faster performance**
4. **All API calls appear to come from your VPS IP**

## Monitoring Redis

### Check Redis memory usage:
```bash
redis-cli -h YOUR_VPS_IP -p 6379 -a YOUR_PASSWORD INFO memory
```

### Monitor real-time commands:
```bash
redis-cli -h YOUR_VPS_IP -p 6379 -a YOUR_PASSWORD MONITOR
```

### Check cache hit rate:
```bash
redis-cli -h YOUR_VPS_IP -p 6379 -a YOUR_PASSWORD INFO stats
```

### Clear cache if needed:
```bash
redis-cli -h YOUR_VPS_IP -p 6379 -a YOUR_PASSWORD FLUSHALL
```

## Security Best Practices

1. ✅ Use a strong Redis password
2. ✅ Only allow necessary ports in firewall
3. ✅ Keep Ubuntu and Redis updated:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
4. ✅ Consider using Redis over TLS for production
5. ✅ Set up automated backups

## Troubleshooting

### Redis not accepting connections:
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Connection timeout:
- Check firewall: `sudo ufw status`
- Check Redis binding: `sudo netstat -tlnp | grep 6379`
- Verify VPS provider firewall settings

### High memory usage:
```bash
# Check memory
redis-cli -h YOUR_VPS_IP -p 6379 -a YOUR_PASSWORD INFO memory

# Clear old keys
redis-cli -h YOUR_VPS_IP -p 6379 -a YOUR_PASSWORD FLUSHDB
```

## Cache Configuration

The edge function automatically caches:
- **Tables list**: 5 minutes
- **Odds**: 1 minute
- **Result history**: 1 minute
- **Images**: 24 hours

You can adjust these TTLs in the edge function code.

## Support

If you encounter issues:
1. Check Edge Function logs in Supabase Dashboard
2. Check VPS Redis logs: `sudo tail -f /var/log/redis/redis-server.log`
3. Test Redis connection manually
4. Verify all secrets are configured correctly

## Cost Estimate

- **Hostinger VPS**: ~$4-10/month (depending on plan)
- **Redis**: Free (open source)
- **Static IP**: Included with VPS
