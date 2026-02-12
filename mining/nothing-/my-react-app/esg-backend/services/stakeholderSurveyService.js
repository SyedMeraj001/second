// Stakeholder Survey Service
class StakeholderSurveyService {
  constructor(db) {
    this.db = db;
  }

  async createSurvey(surveyData) {
    const survey = {
      id: `SRV-${Date.now()}`,
      title: surveyData.title,
      description: surveyData.description,
      targetGroup: surveyData.targetGroup,
      questions: surveyData.questions,
      status: 'draft',
      createdAt: new Date(),
      createdBy: surveyData.userId
    };

    await this.db.query(
      `INSERT INTO surveys (id, title, description, target_group, questions, status, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [survey.id, survey.title, survey.description, survey.targetGroup, 
       JSON.stringify(survey.questions), survey.status, survey.createdAt, survey.createdBy]
    );

    return survey;
  }

  async distributeSurvey(surveyId, distribution) {
    const { method, recipients, message, deadline } = distribution;

    if (method === 'email') {
      for (const email of recipients) {
        await this.sendSurveyEmail(surveyId, email, message);
      }
    }

    await this.db.query(
      `UPDATE surveys SET status = 'active', distributed_at = $1, deadline = $2 WHERE id = $3`,
      [new Date(), deadline, surveyId]
    );

    return { success: true, sent: recipients.length };
  }

  async sendSurveyEmail(surveyId, email, message) {
    const link = `${process.env.APP_URL}/survey/${surveyId}`;
    
    // Email sending logic
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Stakeholder Survey - Your Input Needed',
        body: `
          ${message}
          
          Please complete the survey by clicking the link below:
          ${link}
          
          Thank you for your participation.
        `
      })
    });
  }

  async submitResponse(surveyId, responseData) {
    const response = {
      id: `RSP-${Date.now()}`,
      surveyId,
      respondentId: responseData.respondentId,
      responses: responseData.responses,
      submittedAt: new Date()
    };

    await this.db.query(
      `INSERT INTO survey_responses (id, survey_id, respondent_id, responses, submitted_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [response.id, response.surveyId, response.respondentId, 
       JSON.stringify(response.responses), response.submittedAt]
    );

    return response;
  }

  async getAnalytics(surveyId) {
    const survey = await this.getSurvey(surveyId);
    const responses = await this.getResponses(surveyId);

    const analytics = {
      title: survey.title,
      totalSent: survey.sent || 0,
      totalResponses: responses.length,
      responseRate: survey.sent ? ((responses.length / survey.sent) * 100).toFixed(1) : 0,
      avgCompletionTime: this.calculateAvgTime(responses),
      questions: this.analyzeQuestions(survey.questions, responses),
      insights: this.generateInsights(survey, responses),
      topConcerns: this.identifyTopConcerns(responses)
    };

    return analytics;
  }

  analyzeQuestions(questions, responses) {
    return questions.map(question => {
      const questionResponses = responses.map(r => r.responses[question.id]).filter(Boolean);

      if (question.type === 'multiple-choice') {
        const counts = {};
        questionResponses.forEach(response => {
          counts[response] = (counts[response] || 0) + 1;
        });

        return {
          ...question,
          results: Object.entries(counts).map(([option, count]) => ({
            option,
            count,
            percentage: ((count / questionResponses.length) * 100).toFixed(1)
          }))
        };
      }

      if (question.type === 'rating' || question.type === 'importance') {
        const sum = questionResponses.reduce((a, b) => a + parseInt(b), 0);
        const average = sum / questionResponses.length;
        
        const distribution = {};
        [1, 2, 3, 4, 5].forEach(rating => {
          const count = questionResponses.filter(r => parseInt(r) === rating).length;
          distribution[rating] = ((count / questionResponses.length) * 100).toFixed(1);
        });

        return {
          ...question,
          average,
          distribution
        };
      }

      if (question.type === 'yes-no') {
        const yesCount = questionResponses.filter(r => r === 'yes').length;
        const noCount = questionResponses.filter(r => r === 'no').length;

        return {
          ...question,
          yesCount,
          noCount,
          yes: ((yesCount / questionResponses.length) * 100).toFixed(1),
          no: ((noCount / questionResponses.length) * 100).toFixed(1)
        };
      }

      if (question.type === 'text') {
        return {
          ...question,
          responses: questionResponses
        };
      }

      return question;
    });
  }

  generateInsights(survey, responses) {
    const insights = [];
    
    if (responses.length > 0) {
      const responseRate = (responses.length / (survey.sent || 1)) * 100;
      if (responseRate > 70) {
        insights.push('High engagement rate indicates strong stakeholder interest');
      } else if (responseRate < 30) {
        insights.push('Low response rate - consider follow-up communications');
      }
    }

    return insights;
  }

  identifyTopConcerns(responses) {
    // Analyze text responses for common themes
    const concerns = [];
    // Implementation would use NLP or keyword analysis
    return concerns;
  }

  calculateAvgTime(responses) {
    // Calculate average completion time
    return 5; // placeholder
  }

  async getSurvey(surveyId) {
    const result = await this.db.query('SELECT * FROM surveys WHERE id = $1', [surveyId]);
    return result.rows[0];
  }

  async getResponses(surveyId) {
    const result = await this.db.query(
      'SELECT * FROM survey_responses WHERE survey_id = $1',
      [surveyId]
    );
    return result.rows.map(row => ({
      ...row,
      responses: JSON.parse(row.responses)
    }));
  }

  async exportResults(surveyId, format) {
    const analytics = await this.getAnalytics(surveyId);
    
    if (format === 'csv') {
      return this.exportToCSV(analytics);
    } else if (format === 'excel') {
      return this.exportToExcel(analytics);
    } else if (format === 'pdf') {
      return this.exportToPDF(analytics);
    }
  }

  exportToCSV(analytics) {
    // CSV export logic
    let csv = 'Question,Response,Count,Percentage\n';
    analytics.questions.forEach(q => {
      if (q.results) {
        q.results.forEach(r => {
          csv += `"${q.question}","${r.option}",${r.count},${r.percentage}%\n`;
        });
      }
    });
    return csv;
  }

  exportToExcel(analytics) {
    // Excel export logic
    return analytics;
  }

  exportToPDF(analytics) {
    // PDF export logic
    return analytics;
  }
}

module.exports = StakeholderSurveyService;
