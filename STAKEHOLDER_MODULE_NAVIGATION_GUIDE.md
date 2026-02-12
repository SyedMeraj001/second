# 🎯 HOW TO ACCESS STAKEHOLDER SURVEY MODULE IN YOUR DASHBOARD

## 📍 LOCATION IN YOUR APP

### **Option 1: Add to Main Navigation Menu**

In your main navigation component (e.g., `Sidebar.jsx` or `Navigation.jsx`), add:

```javascript
import { Link } from 'react-router-dom';

// In your navigation menu
<nav>
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/data-collection">Data Collection</Link>
  <Link to="/reporting">Reporting</Link>
  <Link to="/stakeholder-engagement">👥 Stakeholder Engagement</Link>  {/* ADD THIS */}
  <Link to="/compliance">Compliance</Link>
  <Link to="/settings">Settings</Link>
</nav>
```

### **Option 2: Add to Main Dashboard as Card**

In your main `Dashboard.jsx`, add a card:

```javascript
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="dashboard">
      <h1>ESG Platform Dashboard</h1>
      
      <div className="dashboard-cards">
        {/* Existing cards */}
        <div className="card" onClick={() => navigate('/data-collection')}>
          <h3>📊 Data Collection</h3>
          <p>Collect ESG metrics</p>
        </div>
        
        <div className="card" onClick={() => navigate('/reporting')}>
          <h3>📄 Reporting</h3>
          <p>Generate reports</p>
        </div>
        
        {/* ADD THIS NEW CARD */}
        <div className="card" onClick={() => navigate('/stakeholder-engagement')}>
          <h3>👥 Stakeholder Engagement</h3>
          <p>Surveys & materiality assessment</p>
        </div>
        
        <div className="card" onClick={() => navigate('/compliance')}>
          <h3>✅ Compliance</h3>
          <p>Track deadlines</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🛣️ ROUTES TO ADD

In your `App.js` or main routing file:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StakeholderModuleDashboard from './components/StakeholderModuleDashboard';
import SurveyBuilder from './components/SurveyBuilder';
import SurveyDistribution from './components/SurveyDistribution';
import SurveyResponse from './components/SurveyResponse';
import SurveyAnalytics from './components/SurveyAnalytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data-collection" element={<DataCollection />} />
        <Route path="/reporting" element={<Reporting />} />
        
        {/* ADD THESE NEW ROUTES */}
        <Route path="/stakeholder-engagement" element={<StakeholderModuleDashboard />} />
        <Route path="/surveys/create" element={<SurveyBuilder />} />
        <Route path="/surveys/:id/distribute" element={<SurveyDistribution />} />
        <Route path="/surveys/:id/respond" element={<SurveyResponse />} />
        <Route path="/surveys/:id/analytics" element={<SurveyAnalytics />} />
        <Route path="/materiality-assessment" element={<MaterialityAssessment />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📋 USER FLOW

### **ADMIN USER FLOW:**

1. **Login to ESG Platform**
2. **Click "Stakeholder Engagement" in sidebar** → Opens `StakeholderModuleDashboard`
3. **See 4 stats cards:**
   - Total Surveys
   - Active Surveys
   - Total Responses
   - Avg Response Rate
4. **Click "Create New Survey" button** → Opens `SurveyBuilder`
5. **Build survey** → Add questions, select stakeholder groups
6. **Click "Publish"** → Survey saved
7. **Click "Distribute" on survey card** → Opens `SurveyDistribution`
8. **Send via email or generate link** → Stakeholders receive survey
9. **Click "View Analytics" on survey card** → Opens `SurveyAnalytics`
10. **See results, charts, export data**

### **STAKEHOLDER USER FLOW:**

1. **Receive email with survey link**
2. **Click link** → Opens `SurveyResponse` at `/surveys/{id}/respond`
3. **Complete survey** → Answer questions
4. **Click "Submit"** → Response saved
5. **See thank you message**

---

## 🎨 VISUAL LAYOUT

```
┌─────────────────────────────────────────────────────────────┐
│  ESG PLATFORM                                    [User Menu] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────────────────────────────────────┐ │
│  │          │  │                                            │ │
│  │ SIDEBAR  │  │  📊 STAKEHOLDER ENGAGEMENT                │ │
│  │          │  │  [+ Create New Survey]                    │ │
│  │ • Home   │  │                                            │ │
│  │ • Data   │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐ │ │
│  │ • Report │  │  │📋 12   │ │✅ 5    │ │👥 234  │ │📈  │ │ │
│  │ • 👥 Stak│  │  │Surveys │ │Active  │ │Response│ │78% │ │ │
│  │   holder │  │  └────────┘ └────────┘ └────────┘ └────┘ │ │
│  │ • Comply │  │                                            │ │
│  │          │  │  QUICK ACTIONS                            │ │
│  │          │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐ │ │
│  │          │  │  │📝      │ │🎯      │ │👥      │ │📊  │ │ │
│  │          │  │  │Create  │ │Material│ │Manage  │ │View│ │ │
│  │          │  │  │Survey  │ │ity     │ │Groups  │ │Rpt │ │ │
│  │          │  │  └────────┘ └────────┘ └────────┘ └────┘ │ │
│  │          │  │                                            │ │
│  │          │  │  RECENT SURVEYS                           │ │
│  │          │  │  ┌──────────────────────────────────────┐ │ │
│  │          │  │  │ Annual Survey 2024        [Active]   │ │ │
│  │          │  │  │ 📅 Jan 15  👥 45  📊 67%             │ │ │
│  │          │  │  │ [Analytics] [Distribute] [Edit]      │ │ │
│  │          │  │  └──────────────────────────────────────┘ │ │
│  └──────────┘  └──────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 QUICK ACCESS PATHS

| What You Want | Where to Click | URL Path |
|---------------|----------------|----------|
| **Main stakeholder hub** | Sidebar → "Stakeholder Engagement" | `/stakeholder-engagement` |
| **Create new survey** | Dashboard → "Create Survey" button | `/surveys/create` |
| **View survey results** | Survey card → "View Analytics" | `/surveys/{id}/analytics` |
| **Send survey** | Survey card → "Distribute" | `/surveys/{id}/distribute` |
| **Respond to survey** | Email link (stakeholders) | `/surveys/{id}/respond` |
| **Materiality assessment** | Quick Actions → "Materiality Assessment" | `/materiality-assessment` |

---

## 📱 MOBILE ACCESS

The Stakeholder Module Dashboard is responsive and works on mobile:
- Stats cards stack vertically
- Quick action cards adapt to screen size
- Survey cards are touch-friendly
- All buttons are mobile-optimized

---

## 🎯 INTEGRATION EXAMPLE

Here's a complete example of adding it to your existing app:

```javascript
// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StakeholderModuleDashboard from './components/StakeholderModuleDashboard';
import SurveyBuilder from './components/SurveyBuilder';
import SurveyDistribution from './components/SurveyDistribution';
import SurveyResponse from './components/SurveyResponse';
import SurveyAnalytics from './components/SurveyAnalytics';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stakeholder-engagement" element={<StakeholderModuleDashboard />} />
            <Route path="/surveys/create" element={<SurveyBuilder />} />
            <Route path="/surveys/:id/distribute" element={<SurveyDistribution />} />
            <Route path="/surveys/:id/respond" element={<SurveyResponse />} />
            <Route path="/surveys/:id/analytics" element={<SurveyAnalytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

```javascript
// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/">🏠 Dashboard</NavLink>
      <NavLink to="/data-collection">📊 Data Collection</NavLink>
      <NavLink to="/reporting">📄 Reporting</NavLink>
      <NavLink to="/stakeholder-engagement">👥 Stakeholder Engagement</NavLink>
      <NavLink to="/compliance">✅ Compliance</NavLink>
      <NavLink to="/settings">⚙️ Settings</NavLink>
    </nav>
  );
}

export default Sidebar;
```

---

## ✅ CHECKLIST

- [ ] Add "Stakeholder Engagement" link to sidebar/navigation
- [ ] Add routes to App.js for all survey components
- [ ] Import StakeholderModuleDashboard component
- [ ] Test navigation from main dashboard
- [ ] Verify all survey flows work (create → distribute → respond → analytics)
- [ ] Check mobile responsiveness
- [ ] Configure backend API endpoints

---

## 🚀 READY TO USE!

Once you add the navigation link and routes, users can access the Stakeholder Survey Module by:

1. **Clicking "Stakeholder Engagement" in the sidebar**
2. **Or clicking a dashboard card that links to `/stakeholder-engagement`**

The module is now fully integrated into your ESG platform! 🎉
