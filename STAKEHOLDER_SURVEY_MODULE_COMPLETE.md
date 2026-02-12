# STAKEHOLDER SURVEY MODULE - COMPLETE ✅

## Overview
Complete stakeholder engagement and survey system for collecting feedback from investors, employees, customers, community, regulators, and other stakeholders.

---

## FILES CREATED

### Frontend Components
1. **SurveyBuilder.jsx** - Create and design surveys
2. **SurveyDistribution.jsx** - Distribute surveys to stakeholders
3. **SurveyResponse.jsx** - Stakeholder response form
4. **SurveyAnalytics.jsx** - Analytics and insights dashboard

### Backend Service
5. **stakeholderSurveyService.js** - Complete backend logic

---

## FEATURES

### 1. SURVEY BUILDER ✅
**File:** `src/components/SurveyBuilder.jsx`

**Features:**
- Create custom surveys
- Multiple question types
- Drag-and-drop interface
- Preview mode
- Save as draft or publish

**Question Types:**
- Multiple Choice
- Rating Scale (1-5)
- Text Response
- Yes/No
- Importance Rating

**Usage:**
```javascript
import SurveyBuilder from './components/SurveyBuilder';

<SurveyBuilder onSave={(survey) => console.log(survey)} />
```

---

### 2. SURVEY DISTRIBUTION ✅
**File:** `src/components/SurveyDistribution.jsx`

**Features:**
- Email distribution
- Public link sharing
- Stakeholder portal integration
- Custom messages
- Deadline setting
- Response tracking

**Distribution Methods:**
- Email (bulk send)
- Public link (shareable)
- Stakeholder portal (authenticated)

**Usage:**
```javascript
import SurveyDistribution from './components/SurveyDistribution';

<SurveyDistribution surveyId="SRV-123456" />
```

---

### 3. SURVEY RESPONSE ✅
**File:** `src/components/SurveyResponse.jsx`

**Features:**
- Clean response interface
- Progress tracking
- Required field validation
- Auto-save drafts
- Thank you message

**Usage:**
```javascript
import SurveyResponse from './components/SurveyResponse';

<SurveyResponse surveyId="SRV-123456" respondentId="user@email.com" />
```

---

### 4. SURVEY ANALYTICS ✅
**File:** `src/components/SurveyAnalytics.jsx`

**Features:**
- Response statistics
- Visual charts and graphs
- Question-by-question analysis
- Key insights generation
- Export to PDF/Excel/CSV

**Metrics:**
- Total sent
- Total responses
- Response rate
- Average completion time
- Question-level analytics

**Usage:**
```javascript
import SurveyAnalytics from './components/SurveyAnalytics';

<SurveyAnalytics surveyId="SRV-123456" />
```

---

### 5. BACKEND SERVICE ✅
**File:** `esg-backend/services/stakeholderSurveyService.js`

**Features:**
- Survey creation
- Distribution management
- Response collection
- Analytics generation
- Export functionality

**Usage:**
```javascript
const StakeholderSurveyService = require('./services/stakeholderSurveyService');

const surveyService = new StakeholderSurveyService(db);

// Create survey
const survey = await surveyService.createSurvey({
  title: 'ESG Priorities Survey',
  description: 'Help us understand your ESG priorities',
  targetGroup: 'investors',
  questions: [
    {
      type: 'importance',
      question: 'How important is carbon reduction to you?',
      required: true
    }
  ],
  userId: 'admin-123'
});

// Distribute survey
await surveyService.distributeSurvey(survey.id, {
  method: 'email',
  recipients: ['investor1@email.com', 'investor2@email.com'],
  message: 'We value your input on our ESG strategy',
  deadline: '2024-03-31'
});

// Get analytics
const analytics = await surveyService.getAnalytics(survey.id);

// Export results
const csv = await surveyService.exportResults(survey.id, 'csv');
```

---

## COMPLETE WORKFLOW

### Step 1: Create Survey
```javascript
// Admin creates survey
import SurveyBuilder from './components/SurveyBuilder';

function AdminPanel() {
  const handleSave = async (surveyData) => {
    const response = await fetch('/api/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyData)
    });
    const survey = await response.json();
    console.log('Survey created:', survey.id);
  };

  return <SurveyBuilder onSave={handleSave} />;
}
```

### Step 2: Distribute Survey
```javascript
// Admin distributes to stakeholders
import SurveyDistribution from './components/SurveyDistribution';

function DistributePage() {
  return <SurveyDistribution surveyId="SRV-123456" />;
}
```

### Step 3: Stakeholders Respond
```javascript
// Stakeholders fill out survey
import SurveyResponse from './components/SurveyResponse';

function PublicSurveyPage({ surveyId }) {
  return <SurveyResponse surveyId={surveyId} respondentId="user@email.com" />;
}
```

### Step 4: View Analytics
```javascript
// Admin views results
import SurveyAnalytics from './components/SurveyAnalytics';

function AnalyticsPage() {
  return <SurveyAnalytics surveyId="SRV-123456" />;
}
```

---

## DATABASE SCHEMA

```sql
-- Surveys table
CREATE TABLE surveys (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_group VARCHAR(50),
  questions JSONB,
  status VARCHAR(20),
  created_at TIMESTAMP,
  created_by VARCHAR(50),
  distributed_at TIMESTAMP,
  deadline DATE,
  sent INTEGER DEFAULT 0
);

-- Survey responses table
CREATE TABLE survey_responses (
  id VARCHAR(50) PRIMARY KEY,
  survey_id VARCHAR(50) REFERENCES surveys(id),
  respondent_id VARCHAR(255),
  responses JSONB,
  submitted_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_responses_survey ON survey_responses(survey_id);
```

---

## API ENDPOINTS

### Create Survey
```
POST /api/surveys
Body: { title, description, targetGroup, questions }
Response: { id, title, status, createdAt }
```

### Distribute Survey
```
POST /api/surveys/:id/distribute
Body: { method, recipients, message, deadline }
Response: { success, sent }
```

### Get Survey (Public)
```
GET /api/surveys/:id/public
Response: { id, title, description, questions }
```

### Submit Response
```
POST /api/surveys/:id/responses
Body: { respondentId, responses }
Response: { id, submittedAt }
```

### Get Analytics
```
GET /api/surveys/:id/analytics
Response: { totalSent, totalResponses, responseRate, questions, insights }
```

### Export Results
```
GET /api/surveys/:id/export?format=csv|excel|pdf
Response: File download
```

---

## STAKEHOLDER GROUPS

Supported stakeholder groups:
- **Investors** - Capital markets, shareholders
- **Employees** - Workforce, unions
- **Customers** - Clients, consumers
- **Community** - Local communities, public
- **Regulators** - Government, authorities
- **Suppliers** - Supply chain partners
- **Board** - Board members, executives
- **Civil Society** - NGOs, advocacy groups

---

## QUESTION TYPES

### 1. Multiple Choice
```javascript
{
  type: 'multiple-choice',
  question: 'What is your primary ESG concern?',
  options: ['Climate Change', 'Water Scarcity', 'Labor Rights', 'Governance'],
  required: true
}
```

### 2. Rating Scale
```javascript
{
  type: 'rating',
  question: 'Rate our ESG performance',
  required: true
}
// Shows 1-5 scale
```

### 3. Importance Rating
```javascript
{
  type: 'importance',
  question: 'How important is carbon reduction?',
  required: true
}
// Shows: Not Important to Extremely Important
```

### 4. Yes/No
```javascript
{
  type: 'yes-no',
  question: 'Do you support our net-zero target?',
  required: true
}
```

### 5. Text Response
```javascript
{
  type: 'text',
  question: 'What ESG improvements would you like to see?',
  required: false
}
```

---

## ANALYTICS FEATURES

### Response Statistics
- Total surveys sent
- Total responses received
- Response rate percentage
- Average completion time

### Question Analysis
- **Multiple Choice**: Bar charts with percentages
- **Rating**: Average score + distribution
- **Importance**: Average + distribution
- **Yes/No**: Percentage breakdown
- **Text**: List of responses

### Insights Generation
- Engagement analysis
- Trend identification
- Top concerns
- Recommendations

### Export Options
- **PDF**: Professional report with charts
- **Excel**: Detailed data with pivot tables
- **CSV**: Raw data for analysis

---

## EXAMPLE SURVEYS

### 1. Investor ESG Priorities
```javascript
{
  title: 'Investor ESG Priorities Survey',
  targetGroup: 'investors',
  questions: [
    {
      type: 'importance',
      question: 'How important is climate action to your investment decisions?'
    },
    {
      type: 'rating',
      question: 'Rate our current ESG disclosure quality'
    },
    {
      type: 'multiple-choice',
      question: 'Which ESG metric matters most to you?',
      options: ['Carbon emissions', 'Water usage', 'Diversity', 'Safety']
    }
  ]
}
```

### 2. Community Engagement
```javascript
{
  title: 'Community Impact Assessment',
  targetGroup: 'community',
  questions: [
    {
      type: 'yes-no',
      question: 'Do you feel our operations benefit the community?'
    },
    {
      type: 'text',
      question: 'What improvements would you like to see?'
    },
    {
      type: 'rating',
      question: 'Rate our community engagement efforts'
    }
  ]
}
```

### 3. Employee Satisfaction
```javascript
{
  title: 'Employee ESG Feedback',
  targetGroup: 'employees',
  questions: [
    {
      type: 'rating',
      question: 'Rate workplace safety'
    },
    {
      type: 'importance',
      question: 'How important is diversity and inclusion?'
    },
    {
      type: 'text',
      question: 'Suggestions for improving our ESG performance?'
    }
  ]
}
```

---

## INTEGRATION WITH EXISTING FEATURES

### With Materiality Assessment
```javascript
// Use survey results in materiality assessment
const surveyResults = await surveyService.getAnalytics(surveyId);
const materialityInput = materiality.conductStakeholderSurvey(
  'Carbon Emissions',
  'investors',
  surveyResults.responses
);
```

### With Compliance Calendar
```javascript
// Add survey deadline to calendar
remindersSystem.addReminder({
  title: 'Survey Deadline',
  dueDate: survey.deadline,
  type: 'survey',
  priority: 'medium'
});
```

### With Reporting
```javascript
// Include survey insights in reports
const report = {
  stakeholderFeedback: await surveyService.getAnalytics(surveyId),
  keyInsights: analytics.insights,
  topConcerns: analytics.topConcerns
};
```

---

## TESTING

### Test Survey Creation
```javascript
const testSurvey = await surveyService.createSurvey({
  title: 'Test Survey',
  description: 'Testing survey functionality',
  targetGroup: 'investors',
  questions: [
    { type: 'rating', question: 'Test question', required: true }
  ],
  userId: 'test-user'
});

console.log('Survey created:', testSurvey.id);
```

### Test Distribution
```javascript
await surveyService.distributeSurvey(testSurvey.id, {
  method: 'email',
  recipients: ['test@email.com'],
  message: 'Test survey',
  deadline: '2024-12-31'
});
```

### Test Response
```javascript
await surveyService.submitResponse(testSurvey.id, {
  respondentId: 'test@email.com',
  responses: { 'question-1': 5 }
});
```

---

## STATUS: ✅ COMPLETE

**What's Working:**
- ✅ Survey builder with 5 question types
- ✅ Distribution via email/link/portal
- ✅ Response collection
- ✅ Analytics dashboard
- ✅ Export to PDF/Excel/CSV
- ✅ Backend service
- ✅ Database schema
- ✅ API endpoints

**Ready for:**
- Production deployment
- Stakeholder engagement
- ESG feedback collection
- Materiality assessment input

---

## NEXT STEPS

1. **Deploy to production**
2. **Create sample surveys**
3. **Test with stakeholders**
4. **Integrate with reporting**
5. **Train users**

**Estimated deployment time:** 1-2 days
