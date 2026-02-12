// Lazy loading singleton
let dbInstance = null;

const getDb = async () => {
  if (!dbInstance) {
    const { default: db } = await import('../database/db.js');
    dbInstance = db;
  }
  return dbInstance;
};

class StakeholderEngagementModule {
  static STAKEHOLDER_TYPES = {
    INVESTORS: 'investors',
    COMMUNITY: 'community',
    EMPLOYEES: 'employees',
    REGULATORS: 'regulators',
    SUPPLIERS: 'suppliers',
    CUSTOMERS: 'customers',
    NGOS: 'ngos'
  };

  static SURVEY_TYPES = {
    MATERIALITY: 'materiality_assessment',
    SATISFACTION: 'satisfaction_survey',
    FEEDBACK: 'general_feedback',
    CONSULTATION: 'consultation',
    IMPACT_ASSESSMENT: 'impact_assessment'
  };

  // Create Stakeholder Survey
  static async createSurvey(companyId, surveyData, createdBy) {
    const db = await getDb();
    const survey = {
      company_id: companyId,
      title: surveyData.title,
      description: surveyData.description,
      survey_type: surveyData.type,
      target_stakeholders: JSON.stringify(surveyData.targetStakeholders),
      questions: JSON.stringify(surveyData.questions),
      start_date: surveyData.startDate,
      end_date: surveyData.endDate,
      status: 'draft',
      created_by: createdBy
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO stakeholder_surveys (company_id, title, description, survey_type, 
        target_stakeholders, questions, start_date, end_date, status, created_by, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        Object.values(survey), function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...survey });
        });
    });
  }

  // Launch Survey
  static async launchSurvey(surveyId, userId) {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      db.run(`UPDATE stakeholder_surveys SET status = 'active', launched_at = CURRENT_TIMESTAMP, 
        launched_by = ? WHERE id = ?`, [userId, surveyId], function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        });
    });
  }

  // Submit Survey Response
  static async submitResponse(surveyId, respondentData, responses) {
    const db = await getDb();
    const responseData = {
      survey_id: surveyId,
      respondent_type: respondentData.type,
      respondent_email: respondentData.email,
      respondent_organization: respondentData.organization,
      responses: JSON.stringify(responses),
      submitted_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO survey_responses (survey_id, respondent_type, respondent_email, 
        respondent_organization, responses, submitted_at) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        Object.values(responseData), function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...responseData });
        });
    });
  }

  // Analyze Survey Results
  static async analyzeSurveyResults(surveyId) {
    const responses = await this.getSurveyResponses(surveyId);
    const survey = await this.getSurvey(surveyId);
    
    if (!survey || !responses.length) {
      return { error: 'No data available for analysis' };
    }

    const questions = JSON.parse(survey.questions);
    const analysis = {
      surveyId,
      totalResponses: responses.length,
      responsesByStakeholder: this.groupResponsesByStakeholder(responses),
      questionAnalysis: this.analyzeQuestions(questions, responses),
      materialityMatrix: survey.survey_type === 'materiality_assessment' ? 
        this.generateMaterialityMatrix(responses) : null,
      recommendations: this.generateRecommendations(responses, survey.survey_type)
    };

    return analysis;
  }

  // Create Engagement Plan
  static async createEngagementPlan(companyId, planData, createdBy) {
    const db = await getDb();
    const plan = {
      company_id: companyId,
      title: planData.title,
      description: planData.description,
      stakeholder_groups: JSON.stringify(planData.stakeholderGroups),
      engagement_methods: JSON.stringify(planData.engagementMethods),
      frequency: planData.frequency,
      objectives: JSON.stringify(planData.objectives),
      success_metrics: JSON.stringify(planData.successMetrics),
      start_date: planData.startDate,
      end_date: planData.endDate,
      status: 'active',
      created_by: createdBy
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO engagement_plans (company_id, title, description, stakeholder_groups, 
        engagement_methods, frequency, objectives, success_metrics, start_date, end_date, 
        status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        Object.values(plan), function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...plan });
        });
    });
  }

  // Log Engagement Activity
  static async logEngagementActivity(planId, activityData, loggedBy) {
    const db = await getDb();
    const activity = {
      plan_id: planId,
      activity_type: activityData.type,
      stakeholder_group: activityData.stakeholderGroup,
      description: activityData.description,
      participants_count: activityData.participantsCount,
      outcomes: JSON.stringify(activityData.outcomes),
      follow_up_required: activityData.followUpRequired || false,
      activity_date: activityData.date,
      logged_by: loggedBy
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO engagement_activities (plan_id, activity_type, stakeholder_group, 
        description, participants_count, outcomes, follow_up_required, activity_date, 
        logged_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        Object.values(activity), function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...activity });
        });
    });
  }

  // Track Stakeholder Feedback
  static async trackFeedback(companyId, feedbackData) {
    const db = await getDb();
    const feedback = {
      company_id: companyId,
      stakeholder_type: feedbackData.stakeholderType,
      feedback_channel: feedbackData.channel,
      subject: feedbackData.subject,
      content: feedbackData.content,
      priority: feedbackData.priority || 'medium',
      status: 'open',
      received_date: feedbackData.receivedDate || new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO stakeholder_feedback (company_id, stakeholder_type, feedback_channel, 
        subject, content, priority, status, received_date, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        Object.values(feedback), function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...feedback });
        });
    });
  }

  // Generate Engagement Dashboard
  static async getEngagementDashboard(companyId) {
    const [surveys, plans, feedback, activities] = await Promise.all([
      this.getCompanySurveys(companyId),
      this.getEngagementPlans(companyId),
      this.getStakeholderFeedback(companyId),
      this.getEngagementActivities(companyId)
    ]);

    return {
      overview: {
        activeSurveys: surveys.filter(s => s.status === 'active').length,
        totalResponses: surveys.reduce((sum, s) => sum + (s.response_count || 0), 0),
        activeEngagementPlans: plans.filter(p => p.status === 'active').length,
        pendingFeedback: feedback.filter(f => f.status === 'open').length
      },
      recentActivities: activities.slice(0, 10),
      stakeholderSentiment: this.analyzeSentiment(feedback),
      engagementMetrics: this.calculateEngagementMetrics(activities, surveys),
      upcomingEngagements: this.getUpcomingEngagements(plans)
    };
  }

  // Helper Methods
  static groupResponsesByStakeholder(responses) {
    return responses.reduce((groups, response) => {
      const type = response.respondent_type;
      if (!groups[type]) groups[type] = 0;
      groups[type]++;
      return groups;
    }, {});
  }

  static analyzeQuestions(questions, responses) {
    return questions.map(question => {
      const answers = responses.map(r => {
        const responseData = JSON.parse(r.responses);
        return responseData[question.id];
      }).filter(Boolean);

      return {
        questionId: question.id,
        questionText: question.text,
        responseCount: answers.length,
        analysis: this.analyzeAnswers(question.type, answers)
      };
    });
  }

  static analyzeAnswers(questionType, answers) {
    switch (questionType) {
      case 'rating':
        const avg = answers.reduce((sum, a) => sum + parseFloat(a), 0) / answers.length;
        return { average: Math.round(avg * 10) / 10, distribution: this.getDistribution(answers) };
      case 'multiple_choice':
        return this.getChoiceDistribution(answers);
      case 'text':
        return { responseCount: answers.length, sampleResponses: answers.slice(0, 3) };
      default:
        return { responseCount: answers.length };
    }
  }

  static generateMaterialityMatrix(responses) {
    const topics = {};
    
    responses.forEach(response => {
      const data = JSON.parse(response.responses);
      Object.entries(data).forEach(([topicId, scores]) => {
        if (!topics[topicId]) topics[topicId] = { impact: [], financial: [] };
        if (scores.impact) topics[topicId].impact.push(parseFloat(scores.impact));
        if (scores.financial) topics[topicId].financial.push(parseFloat(scores.financial));
      });
    });

    return Object.entries(topics).map(([topicId, scores]) => ({
      topicId,
      impactScore: scores.impact.reduce((sum, s) => sum + s, 0) / scores.impact.length,
      financialScore: scores.financial.reduce((sum, s) => sum + s, 0) / scores.financial.length,
      materiality: this.calculateMaterialityLevel(scores)
    }));
  }

  static getSurvey(surveyId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM stakeholder_surveys WHERE id = ?', [surveyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getSurveyResponses(surveyId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM survey_responses WHERE survey_id = ?', [surveyId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static getCompanySurveys(companyId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT s.*, COUNT(r.id) as response_count 
        FROM stakeholder_surveys s 
        LEFT JOIN survey_responses r ON s.id = r.survey_id 
        WHERE s.company_id = ? GROUP BY s.id`, [companyId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });
  }

  static getEngagementPlans(companyId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM engagement_plans WHERE company_id = ?', [companyId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static getStakeholderFeedback(companyId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM stakeholder_feedback WHERE company_id = ? ORDER BY received_date DESC', 
        [companyId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });
  }

  static getEngagementActivities(companyId) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT ea.* FROM engagement_activities ea 
        JOIN engagement_plans ep ON ea.plan_id = ep.id 
        WHERE ep.company_id = ? ORDER BY ea.activity_date DESC`, 
        [companyId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });
  }
}

module.exports = StakeholderEngagementModule;