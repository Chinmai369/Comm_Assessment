# Network IP Setup Guide

## Quick Setup for Mobile Access

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet)
Example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Step 2: Update Client Configuration

1. Copy `.env.example` to `.env` in the `client` folder:
   ```bash
   cd client
   copy .env.example .env
   ```

2. Edit `client/.env` and replace `YOUR_IP_ADDRESS` with your actual IP:
   ```
   REACT_APP_API_URL=http://192.168.1.100:5000/api
   ```

### Step 3: Start the Servers

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend Server:**
```bash
cd client
npm start
```

### Step 4: Access on Mobile

1. Make sure your phone is connected to the **same Wi-Fi network** as your computer
2. Open a browser on your phone
3. Navigate to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

### Troubleshooting

- **Can't connect?** Check Windows Firewall settings and allow ports 3000 and 5000
- **IP changed?** Update the `.env` file and restart the frontend server
- **Still not working?** Make sure both devices are on the same network

### Notes

- The server now listens on `0.0.0.0` which allows network connections
- You need to restart the frontend server after changing `.env` file
- The API URL is now configurable via environment variables

