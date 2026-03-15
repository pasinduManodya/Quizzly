# MongoDB Network Connection Fix

## Problem Identified

**Error:** `ECONNREFUSED` - Your computer cannot connect to MongoDB Atlas servers.

**Root Cause:** DNS resolution failure or network blocking MongoDB connections.

## Diagnostic Results

✅ Internet connection: Working (can reach 8.8.8.8)  
✅ Google DNS can resolve MongoDB hostname  
❌ Local DNS cannot resolve MongoDB hostname  
❌ Cannot connect to MongoDB Atlas cluster

## Immediate Solutions (Try in Order)

### Solution 1: Change DNS to Google DNS (Recommended)

Your local DNS server is failing to resolve MongoDB Atlas hostnames. Switch to Google DNS:

1. **Open Network Settings:**
   - Press `Win + R`, type `ncpa.cpl`, press Enter
   - Right-click your active network adapter → Properties

2. **Configure DNS:**
   - Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
   - Select "Use the following DNS server addresses"
   - **Preferred DNS:** `8.8.8.8`
   - **Alternate DNS:** `8.8.4.4`
   - Click OK

3. **Flush DNS Cache:**
   ```powershell
   ipconfig /flushdns
   ```

4. **Restart your server** and test again

### Solution 2: Check Windows Firewall

1. **Open Windows Defender Firewall:**
   - Press `Win + R`, type `firewall.cpl`, press Enter

2. **Allow Node.js through firewall:**
   - Click "Allow an app or feature through Windows Defender Firewall"
   - Click "Change settings"
   - Find "Node.js" in the list
   - Check both "Private" and "Public" boxes
   - If Node.js isn't listed, click "Allow another app" and browse to Node.js

3. **Create outbound rule for MongoDB:**
   - Click "Advanced settings"
   - Click "Outbound Rules" → "New Rule"
   - Select "Port" → Next
   - Select "TCP", enter port `27017` → Next
   - Select "Allow the connection" → Next
   - Check all profiles → Next
   - Name it "MongoDB Atlas" → Finish

### Solution 3: Disable Antivirus Temporarily

Some antivirus software blocks MongoDB connections:

1. Temporarily disable your antivirus (Windows Defender, Norton, McAfee, etc.)
2. Test MongoDB connection
3. If it works, add Node.js and MongoDB to antivirus exceptions
4. Re-enable antivirus

### Solution 4: Check VPN/Proxy Settings

If you're using a VPN or proxy:

1. **Disable VPN temporarily** and test connection
2. If VPN is required, configure it to allow MongoDB Atlas:
   - Whitelist `*.mongodb.net` domains
   - Allow outbound connections on port 27017

### Solution 5: Verify MongoDB Atlas Configuration

1. **Login to MongoDB Atlas:** https://cloud.mongodb.com/

2. **Check Cluster Status:**
   - Ensure cluster is **RUNNING** (not paused)
   - If paused, click "Resume"

3. **Network Access (IP Whitelist):**
   - Go to "Network Access" in left menu
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (`0.0.0.0/0`)
   - Or add your current IP address
   - Click "Confirm"

4. **Database Access:**
   - Go to "Database Access"
   - Verify user `pasindu` exists
   - Ensure password is `12345`
   - Check permissions: "Atlas admin" or "Read and write to any database"

### Solution 6: Use Alternative Connection String

Try using the standard connection string instead of SRV:

1. **Get standard connection string from MongoDB Atlas:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Driver: Node.js"
   - Copy the connection string (non-SRV version)

2. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb://pasindu:12345@cluster0-shard-00-00.yg0v7az.mongodb.net:27017,cluster0-shard-00-01.yg0v7az.mongodb.net:27017,cluster0-shard-00-02.yg0v7az.mongodb.net:27017/quizzly?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
   ```

## Quick Test Commands

### Test DNS Resolution:
```powershell
nslookup cluster0.yg0v7az.mongodb.net 8.8.8.8
```

### Test MongoDB Connection:
```powershell
cd backend
node test-mongo-connection.js
```

### Flush DNS Cache:
```powershell
ipconfig /flushdns
ipconfig /registerdns
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Network blocking connection | Check firewall, VPN, antivirus |
| `ENOTFOUND` | DNS cannot resolve hostname | Change to Google DNS (8.8.8.8) |
| `ETIMEDOUT` | Connection timeout | Check IP whitelist in MongoDB Atlas |
| `Authentication failed` | Wrong credentials | Verify username/password in Atlas |

## Verification Steps

After applying fixes:

1. ✅ DNS resolves MongoDB hostname
2. ✅ Can ping MongoDB servers
3. ✅ Test script connects successfully
4. ✅ Server starts with "MongoDB connected successfully"
5. ✅ Login works without 503 error

## If Nothing Works

### Temporary Local Development Solution

Use MongoDB locally instead of Atlas:

1. **Install MongoDB Community Server:**
   - Download from: https://www.mongodb.com/try/download/community
   - Install with default settings

2. **Update `.env`:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/quizzly
   ```

3. **Restart server** - should connect immediately

This allows you to develop locally while troubleshooting the Atlas connection.

## Support

If the issue persists:
1. Check Windows Event Viewer for network errors
2. Contact your network administrator if on corporate network
3. Try connecting from a different network (mobile hotspot)
4. Check MongoDB Atlas status page: https://status.mongodb.com/
