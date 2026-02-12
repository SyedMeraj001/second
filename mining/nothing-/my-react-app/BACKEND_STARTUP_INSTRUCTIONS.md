# 🚀 Backend Startup Instructions

## The backend server is not running, causing the connection errors.

### **Quick Fix - Start Backend Server:**

#### **Method 1: Double-click the batch file**
```
start-backend-simple.bat
```

#### **Method 2: Manual startup**
```bash
# Open new terminal/command prompt
cd esg-backend
npm install
npm start
```

#### **Method 3: VS Code terminal**
```bash
# In VS Code terminal
cd esg-backend
node server.js
```

### **Expected Output:**
```
Database initialized successfully
ESG Backend server running on port 5000
```

### **Test Backend is Running:**
Open in browser: http://localhost:5000/health

Should show: `{"status":"OK","timestamp":"..."}`

### **Current Status:**
- ✅ Frontend: Running on port 3000
- ❌ Backend: Not running (needs to be started)
- ✅ Fallback: Mock KPIs working when backend offline

### **After Starting Backend:**
1. Refresh the frontend page
2. KPI errors will disappear
3. Real-time database KPIs will work
4. DataEntry will save to database

### **If Backend Won't Start:**
The system will work with mock data as fallback. All functions are available, just without database persistence.