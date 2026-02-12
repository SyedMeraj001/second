# SUPPORT TICKETING - QUICK START GUIDE

## ✅ SETUP COMPLETE!

The Support Ticketing system is now **FULLY INTEGRATED** and ready to use!

---

## 🚀 HOW TO USE IT NOW

### Step 1: Start the Backend Server

```bash
cd esg-backend
node server.js
```

The server should start on `http://localhost:5000`

### Step 2: Start the Frontend

```bash
cd ..
npm start
```

The app should open at `http://localhost:3000`

### Step 3: Access Support Ticketing

1. **Login** to the platform
2. **Go to Dashboard**
3. **Click "Quick Tools"** (4th section in Quick Actions panel)
4. **Click "24/7 Support"** (last item with green "NEW" badge)

---

## 🎫 CREATING YOUR FIRST TICKET

1. Click **"Create Ticket"** tab
2. Fill in:
   - **Subject**: Brief description (e.g., "Cannot export PDF report")
   - **Description**: Detailed explanation
   - **Priority**: 
     - Critical (15 min response)
     - High (1 hour response)
     - Medium (4 hours response)
     - Low (24 hours response)
   - **Category**: Technical, Account, Data, Integration, Training, Other
3. Click **"Create Support Ticket"**
4. You'll see: "Ticket created: TKT-xxxxx"

---

## 📊 VIEWING YOUR TICKETS

1. Click **"My Tickets"** tab
2. See all your tickets with:
   - Ticket ID
   - Priority badge
   - Status badge
   - Subject and description
   - Creation date
3. Click any ticket to view details and add comments

---

## 💬 ADDING COMMENTS

1. Open a ticket
2. Scroll to "Comments" section
3. Type your message
4. Click **"Send"**

---

## 📈 VIEWING STATISTICS

At the top of the Support Center, you'll see:
- **Total Tickets**: All tickets created
- **Open**: Currently open tickets
- **In Progress**: Being worked on
- **SLA Violations**: Tickets past deadline

---

## 🎯 WHAT'S WORKING NOW

✅ **Create tickets** - Fully functional
✅ **View all tickets** - See your ticket list
✅ **View ticket details** - Click to see full info
✅ **Add comments** - Communicate on tickets
✅ **Track status** - Open, In Progress, Resolved, Closed
✅ **Priority levels** - Critical, High, Medium, Low
✅ **Statistics** - Real-time ticket stats
✅ **In-memory storage** - Tickets saved during session

---

## ⚠️ CURRENT LIMITATIONS

- **Session-based**: Tickets reset when server restarts
- **No email notifications**: Not configured yet
- **No Slack alerts**: Not configured yet
- **No database persistence**: Using in-memory storage

---

## 🔧 TO MAKE IT PERMANENT

To save tickets permanently (survive server restarts):

1. **Run database schema**:
```bash
cd esg-backend
sqlite3 database/database.sqlite < database/support-schema.sql
```

2. **Replace simple routes** with full database version:
   - Use `routes/support.js` instead of `routes/supportSimple.js`
   - Update `server.js` import

3. **Configure email** (optional):
   - Add SMTP settings to `.env`
   - Uncomment email code in `supportTicketingSystem.js`

4. **Configure Slack** (optional):
   - Add webhook URL to `.env`
   - Uncomment Slack code in `supportTicketingSystem.js`

---

## 📞 SUPPORT TEAM SETUP

To set up a real 24/7 support team:

1. **Read the guide**: `24_7_SUPPORT_TEAM_GUIDE.md`
2. **Hire team**: 8-11 people (see guide for roles)
3. **Set up shifts**: Follow-the-Sun model (EMEA/APAC/AMER)
4. **Train team**: 2-week onboarding program
5. **Launch**: Go live with 24/7 coverage

**Estimated Cost**: ~$950K/year for full team

---

## 🎉 YOU'RE READY!

The Support Ticketing system is **LIVE and WORKING**!

Try creating a test ticket now:
1. Dashboard → Quick Tools → 24/7 Support
2. Create Ticket
3. Subject: "Test ticket"
4. Description: "Testing the support system"
5. Priority: Medium
6. Category: Technical
7. Click "Create Support Ticket"

**It works!** 🚀

---

## 📚 MORE DOCUMENTATION

- **Full Integration Guide**: `SUPPORT_TICKETING_INTEGRATION.md`
- **24/7 Team Setup**: `24_7_SUPPORT_TEAM_GUIDE.md`
- **API Documentation**: `esg-backend/routes/supportSimple.js`
- **Frontend Component**: `src/components/SupportTicketing.jsx`

---

## 🐛 TROUBLESHOOTING

**"Failed to create ticket"**
- ✅ FIXED! Backend routes are now connected
- Make sure backend server is running on port 5000

**"Cannot connect to server"**
- Check if backend is running: `node server.js`
- Check console for errors

**"Tickets disappear after restart"**
- Normal! Using in-memory storage
- Run database schema to make permanent

---

**Questions?** Check the documentation files or create a support ticket! 😄
