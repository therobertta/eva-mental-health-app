const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../utils/auth');
const BeliefModelingService = require('../services/beliefModelingService');

const router = express.Router();

const beliefService = new BeliefModelingService();

// Submit life wheel assessment
router.post('/life-wheel', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { scores, priorityAreas } = req.body;
    
    // Validate scores
    const scoreFields = ['career', 'relationships', 'health', 'personalGrowth', 
                        'finances', 'recreation', 'environment', 'contribution'];
    
    for (const field of scoreFields) {
      if (!scores[field] || scores[field] < 1 || scores[field] > 10) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid score for ${field}. Must be between 1 and 10.`
          }
        });
      }
    }
    
    // Validate priority areas
    if (!priorityAreas || !Array.isArray(priorityAreas) || priorityAreas.length > 3) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Priority areas must be an array with maximum 3 items'
        }
      });
    }
    
    // Save assessment
    const assessmentId = uuidv4();
    await db.query(
      `INSERT INTO life_wheel_assessments 
       (id, user_id, career_score, relationships_score, health_score, 
        personal_growth_score, finances_score, recreation_score, 
        environment_score, contribution_score, priority_areas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        assessmentId, userId,
        scores.career, scores.relationships, scores.health,
        scores.personalGrowth, scores.finances, scores.recreation,
        scores.environment, scores.contribution,
        JSON.stringify(priorityAreas)
      ]
    );
    
    // Get user's therapeutic framework for personalized insights
    const profileResult = await db.query(
      'SELECT primary_framework FROM therapeutic_profiles WHERE user_id = $1',
      [userId]
    );
    
    const framework = profileResult.rows[0]?.primary_framework || 'humanistic';
    
    // Generate insights based on scores and framework
    const insights = generateLifeWheelInsights(scores, priorityAreas, framework);
    const recommendations = generateRecommendations(scores, priorityAreas, framework);
    
    res.status(201).json({
      assessmentId,
      insights,
      recommendedFocusAreas: priorityAreas,
      frameworkInterpretation: {
        framework,
        approach: getFrameworkApproach(framework, priorityAreas)
      },
      recommendations
    });
    
  } catch (error) {
    console.error('Life wheel assessment error:', error);
    res.status(500).json({
      error: {
        code: 'ASSESSMENT_FAILED',
        message: 'Failed to save life wheel assessment'
      }
    });
  }
});

// Get life wheel history
router.get('/life-wheel', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;
    
    const result = await db.query(
      `SELECT * FROM life_wheel_assessments 
       WHERE user_id = $1 
       ORDER BY assessment_date DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    const assessments = result.rows.map(row => ({
      id: row.id,
      date: row.assessment_date,
      scores: {
        career: row.career_score,
        relationships: row.relationships_score,
        health: row.health_score,
        personalGrowth: row.personal_growth_score,
        finances: row.finances_score,
        recreation: row.recreation_score,
        environment: row.environment_score,
        contribution: row.contribution_score
      },
      priorityAreas: row.priority_areas,
      averageScore: (
        row.career_score + row.relationships_score + row.health_score +
        row.personal_growth_score + row.finances_score + row.recreation_score +
        row.environment_score + row.contribution_score
      ) / 8
    }));
    
    res.json({ assessments });
    
  } catch (error) {
    console.error('Get life wheel history error:', error);
    res.status(500).json({
      error: {
        code: 'HISTORY_FETCH_FAILED',
        message: 'Failed to fetch life wheel history'
      }
    });
  }
});

// Submit feelings entry
router.post('/feelings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { primaryEmotion, secondaryEmotion, intensity, trigger } = req.body;
    
    // Validate emotions
    const validPrimaryEmotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust'];
    if (!validPrimaryEmotions.includes(primaryEmotion)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid primary emotion'
        }
      });
    }
    
    // Validate intensity
    if (!intensity || intensity < 1 || intensity > 10) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Intensity must be between 1 and 10'
        }
      });
    }
    
    // Save feelings entry
    const entryId = uuidv4();
    await db.query(
      `INSERT INTO feelings_entries 
       (id, user_id, primary_emotion, secondary_emotion, intensity, trigger_description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entryId, userId, primaryEmotion, secondaryEmotion || null, intensity, trigger || null]
    );
    
    // Get user's therapeutic framework
    const profileResult = await db.query(
      'SELECT primary_framework FROM therapeutic_profiles WHERE user_id = $1',
      [userId]
    );
    
    const framework = profileResult.rows[0]?.primary_framework || 'humanistic';
    
    // Generate therapeutic guidance based on emotion and framework
    const guidance = generateEmotionalGuidance(primaryEmotion, intensity, framework);
    const copingStrategies = getCopingStrategies(primaryEmotion, intensity, framework);
    
    // Check for emotional patterns
    const patterns = await detectEmotionalPatterns(userId, primaryEmotion);
    
    res.status(201).json({
      entryId,
      therapeuticGuidance: guidance,
      copingSuggestions: copingStrategies,
      patternInsights: patterns,
      frameworkContext: framework
    });
    
  } catch (error) {
    console.error('Feelings entry error:', error);
    res.status(500).json({
      error: {
        code: 'FEELINGS_ENTRY_FAILED',
        message: 'Failed to save feelings entry'
      }
    });
  }
});

// Get feelings history
router.get('/feelings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, days = 7 } = req.query;
    
    const result = await db.query(
      `SELECT * FROM feelings_entries 
       WHERE user_id = $1 
       AND timestamp > NOW() - INTERVAL '%s days'
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [userId, days, limit]
    );
    
    const entries = result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      primaryEmotion: row.primary_emotion,
      secondaryEmotion: row.secondary_emotion,
      intensity: row.intensity,
      trigger: row.trigger_description,
      copingStrategy: row.coping_strategy_used
    }));
    
    // Calculate emotional summary
    const summary = calculateEmotionalSummary(result.rows);
    
    res.json({ 
      entries,
      summary
    });
    
  } catch (error) {
    console.error('Get feelings history error:', error);
    res.status(500).json({
      error: {
        code: 'FEELINGS_FETCH_FAILED',
        message: 'Failed to fetch feelings history'
      }
    });
  }
});

/**
 * POST /api/assessments/therapeutic-preferences
 * Assess user's therapeutic preferences through conversation analysis
 */
router.post('/therapeutic-preferences', async (req, res) => {
  try {
    const { userId, conversations = [], userProfile = {} } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'UserId is required'
      });
    }

    // Analyze therapeutic preferences
    const preferences = await beliefService.inferTherapeuticPreferences(conversations, userProfile);
    
    // Save assessment results (implement with your database)
    await saveAssessmentResults(userId, 'therapeutic_preferences', preferences);

    res.json({
      assessmentType: 'therapeutic_preferences',
      results: preferences,
      timestamp: new Date().toISOString(),
      confidence: preferences.confidence
    });
    
  } catch (error) {
    console.error('Error in therapeutic preferences assessment:', error);
    res.status(500).json({
      error: 'Failed to assess therapeutic preferences',
      details: error.message
    });
  }
});

/**
 * POST /api/assessments/belief-system
 * Assess user's belief system and philosophical framework
 */
router.post('/belief-system', async (req, res) => {
  try {
    const { userId, conversations = [], assessmentQuestions = [] } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'UserId is required'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);
    
    // Analyze belief system
    const beliefSystem = await beliefService.detectBeliefSystem(conversations, userProfile);
    
    // Process assessment questions if provided
    let questionResults = {};
    if (assessmentQuestions.length > 0) {
      questionResults = await processAssessmentQuestions(assessmentQuestions, beliefSystem);
    }
    
    // Save assessment results
    await saveAssessmentResults(userId, 'belief_system', {
      beliefSystem,
      questionResults
    });

    res.json({
      assessmentType: 'belief_system',
      results: {
        beliefSystem,
        questionResults
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in belief system assessment:', error);
    res.status(500).json({
      error: 'Failed to assess belief system',
      details: error.message
    });
  }
});

/**
 * GET /api/assessments/questions/therapeutic-preferences
 * Get assessment questions for therapeutic preference detection
 */
router.get('/questions/therapeutic-preferences', (req, res) => {
  const questions = [
    {
      id: 'therapeutic_approach',
      question: 'What resonates with you most about different approaches to mental health?',
      type: 'open_ended',
      category: 'philosophy'
    },
    {
      id: 'change_beliefs',
      question: 'How do you believe people grow and change?',
      type: 'multiple_choice',
      options: [
        'Gradually through consistent effort and practice',
        'Through breakthrough moments of insight',
        'By understanding the root causes of problems',
        'Through acceptance and present-moment awareness'
      ],
      category: 'change_beliefs'
    },
    {
      id: 'vulnerability_comfort',
      question: 'How comfortable are you with exploring difficult emotions?',
      type: 'scale',
      scale: {
        min: 1,
        max: 10,
        labels: {
          1: 'Very uncomfortable',
          5: 'Somewhat comfortable',
          10: 'Very comfortable'
        }
      },
      category: 'vulnerability'
    },
    {
      id: 'communication_style',
      question: 'What type of communication style do you prefer from a mental health professional?',
      type: 'multiple_choice',
      options: [
        'Direct and solution-focused',
        'Warm and reflective',
        'Gentle and non-directive',
        'Analytical and insight-oriented'
      ],
      category: 'communication'
    },
    {
      id: 'goal_orientation',
      question: 'What matters most to you in your mental health journey?',
      type: 'open_ended',
      category: 'goals'
    }
  ];

  res.json({
    questions,
    total: questions.length,
    estimatedTime: '5-10 minutes'
  });
});

/**
 * POST /api/assessments/process-answers
 * Process assessment answers and generate therapeutic profile
 */
router.post('/process-answers', async (req, res) => {
  try {
    const { userId, answers = [] } = req.body;
    
    if (!userId || !answers.length) {
      return res.status(400).json({
        error: 'UserId and answers are required'
      });
    }

    // Process answers to infer therapeutic preferences
    const preferences = await processAssessmentAnswers(answers);
    
    // Get user profile
    const userProfile = await getUserProfile(userId);
    
    // Combine with existing conversation analysis
    const conversations = await getConversationHistory(userId);
    const conversationPreferences = await beliefService.inferTherapeuticPreferences(conversations, userProfile);
    
    // Merge preferences from answers and conversations
    const mergedPreferences = mergePreferences(preferences, conversationPreferences);
    
    // Save comprehensive profile
    await saveTherapeuticProfile(userId, mergedPreferences);

    res.json({
      therapeuticProfile: mergedPreferences,
      confidence: mergedPreferences.confidence,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing assessment answers:', error);
    res.status(500).json({
      error: 'Failed to process assessment answers',
      details: error.message
    });
  }
});

/**
 * GET /api/assessments/profile/:userId
 * Get user's therapeutic profile
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await getTherapeuticProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Therapeutic profile not found'
      });
    }

    res.json({
      profile,
      lastUpdated: profile.updated_at || profile.created_at
    });
    
  } catch (error) {
    console.error('Error getting therapeutic profile:', error);
    res.status(500).json({
      error: 'Failed to retrieve therapeutic profile',
      details: error.message
    });
  }
});

/**
 * POST /api/assessments/update-profile
 * Update user's therapeutic profile
 */
router.post('/update-profile', async (req, res) => {
  try {
    const { userId, updates = {} } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'UserId is required'
      });
    }

    // Get current profile
    const currentProfile = await getTherapeuticProfile(userId);
    
    // Merge updates
    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Save updated profile
    await saveTherapeuticProfile(userId, updatedProfile);

    res.json({
      message: 'Therapeutic profile updated successfully',
      profile: updatedProfile,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating therapeutic profile:', error);
    res.status(500).json({
      error: 'Failed to update therapeutic profile',
      details: error.message
    });
  }
});

// Helper functions
function generateLifeWheelInsights(scores, priorityAreas, framework) {
  const insights = [];
  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 8;
  
  // Overall balance insight
  if (avgScore < 5) {
    insights.push('Your overall life satisfaction scores indicate you may be experiencing significant challenges across multiple areas.');
  } else if (avgScore > 7) {
    insights.push('Your life wheel shows strong satisfaction across most areas, which is a great foundation for continued growth.');
  }
  
  // Priority area insights
  priorityAreas.forEach(area => {
    const score = scores[area];
    if (score < 4) {
      insights.push(`Your ${area} score suggests this is an area where focused attention could lead to significant improvements.`);
    }
  });
  
  // Framework-specific insights
  if (framework === 'cognitive_behavioral') {
    insights.push('Consider how your thoughts about these life areas might be influencing your satisfaction levels.');
  } else if (framework === 'humanistic') {
    insights.push('These scores reflect your current experience. Trust your inner wisdom about which areas need attention.');
  }
  
  return insights;
}

function generateRecommendations(scores, priorityAreas, framework) {
  const recommendations = [];
  
  priorityAreas.forEach(area => {
    const score = scores[area];
    
    switch(area) {
      case 'career':
        if (score < 5) {
          recommendations.push('Consider exploring what meaningful work looks like for you');
        }
        break;
      case 'relationships':
        if (score < 5) {
          recommendations.push('Focus on deepening one important relationship this week');
        }
        break;
      case 'health':
        if (score < 5) {
          recommendations.push('Start with one small health habit you can maintain');
        }
        break;
      case 'recreation':
        if (score < 5) {
          recommendations.push('Schedule time for an activity that brings you joy');
        }
        break;
    }
  });
  
  return recommendations;
}

function getFrameworkApproach(framework, priorityAreas) {
  const approaches = {
    cognitive_behavioral: 'We\'ll work on identifying and changing thought patterns that may be limiting your satisfaction in these areas.',
    humanistic: 'We\'ll explore what authentic fulfillment looks like for you in these areas of your life.',
    mindfulness: 'We\'ll practice accepting where you are while mindfully working toward positive changes.',
    psychodynamic: 'We\'ll explore how past experiences might be influencing your current satisfaction in these areas.'
  };
  
  return approaches[framework] || approaches.humanistic;
}

function generateEmotionalGuidance(emotion, intensity, framework) {
  const guidance = {
    cognitive_behavioral: {
      sadness: 'Let\'s explore the thoughts contributing to your sadness. What story is your mind telling you?',
      anger: 'Anger often masks other emotions. What thoughts are fueling this anger?',
      fear: 'Fear can be examined. What specific thoughts are creating this fear?',
      joy: 'Wonderful! What thoughts and actions led to this positive emotion?'
    },
    humanistic: {
      sadness: 'It\'s okay to feel sad. What does this sadness need you to know?',
      anger: 'Your anger is valid. What boundary or value is being crossed?',
      fear: 'Fear is trying to protect you. What does safety look like for you right now?',
      joy: 'How beautiful! Let yourself fully experience this joy.'
    },
    mindfulness: {
      sadness: 'Notice where sadness lives in your body. Can you breathe with it?',
      anger: 'Observe the anger without becoming it. What happens when you just watch?',
      fear: 'Fear is here. Can you stay present with it without running away?',
      joy: 'Savor this moment of joy. Notice all its qualities.'
    }
  };
  
  const frameworkGuidance = guidance[framework] || guidance.humanistic;
  return frameworkGuidance[emotion] || 'Thank you for sharing how you\'re feeling.';
}

function getCopingStrategies(emotion, intensity, framework) {
  if (intensity >= 8) {
    // High intensity coping strategies
    return [
      'Take slow, deep breaths for 2 minutes',
      'Use grounding techniques (5-4-3-2-1 senses)',
      'Reach out to a supportive person',
      'Consider a brief walk or movement'
    ];
  }
  
  // Framework-specific strategies
  const strategies = {
    cognitive_behavioral: [
      'Write down your thoughts and examine them',
      'Challenge negative thinking patterns',
      'Engage in a pleasant activity'
    ],
    humanistic: [
      'Practice self-compassion',
      'Journal about your feelings',
      'Connect with your values'
    ],
    mindfulness: [
      'Try a 5-minute meditation',
      'Practice mindful observation',
      'Do a body scan'
    ]
  };
  
  return strategies[framework] || strategies.humanistic;
}

async function detectEmotionalPatterns(userId, currentEmotion) {
  try {
    // Get recent emotional entries
    const result = await db.query(
      `SELECT primary_emotion, COUNT(*) as count 
       FROM feelings_entries 
       WHERE user_id = $1 
       AND timestamp > NOW() - INTERVAL '7 days'
       GROUP BY primary_emotion
       ORDER BY count DESC`,
      [userId]
    );
    
    const patterns = [];
    const emotionCounts = {};
    let totalEntries = 0;
    
    result.rows.forEach(row => {
      emotionCounts[row.primary_emotion] = parseInt(row.count);
      totalEntries += parseInt(row.count);
    });
    
    // Identify dominant emotions
    const dominantEmotion = result.rows[0]?.primary_emotion;
    if (dominantEmotion && emotionCounts[dominantEmotion] > totalEntries * 0.5) {
      patterns.push(`${dominantEmotion} has been your dominant emotion this week`);
    }
    
    // Check for recurring patterns
    if (emotionCounts[currentEmotion] >= 3) {
      patterns.push(`You've experienced ${currentEmotion} multiple times this week`);
    }
    
    return patterns;
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return [];
  }
}

function calculateEmotionalSummary(entries) {
  const summary = {
    averageIntensity: 0,
    emotionFrequency: {},
    highIntensityCount: 0
  };
  
  if (entries.length === 0) return summary;
  
  let totalIntensity = 0;
  
  entries.forEach(entry => {
    totalIntensity += entry.intensity;
    
    if (!summary.emotionFrequency[entry.primary_emotion]) {
      summary.emotionFrequency[entry.primary_emotion] = 0;
    }
    summary.emotionFrequency[entry.primary_emotion]++;
    
    if (entry.intensity >= 8) {
      summary.highIntensityCount++;
    }
  });
  
  summary.averageIntensity = Math.round(totalIntensity / entries.length);
  
  return summary;
}

async function processAssessmentQuestions(questions, beliefSystem) {
  const results = {};
  
  for (const question of questions) {
    // Analyze how the question relates to the detected belief system
    results[question.id] = {
      question: question.question,
      detectedBeliefs: beliefSystem,
      relevance: calculateQuestionRelevance(question, beliefSystem)
    };
  }
  
  return results;
}

function calculateQuestionRelevance(question, beliefSystem) {
  // Calculate how relevant this question is based on current belief system
  let relevance = 0.5; // Base relevance
  
  if (question.category === 'change_beliefs' && beliefSystem.change_beliefs) {
    relevance += 0.3;
  }
  
  if (question.category === 'vulnerability' && beliefSystem.vulnerability_comfort) {
    relevance += 0.3;
  }
  
  if (question.category === 'philosophy' && beliefSystem.therapeutic_philosophy) {
    relevance += 0.3;
  }
  
  return Math.min(relevance, 1.0);
}

async function processAssessmentAnswers(answers) {
  const preferences = {
    therapeutic_philosophy: {
      primary: 'humanistic',
      secondary: 'mindfulness',
      confidence: 0.5
    },
    communication_style: {
      directness: 'moderate',
      warmth: 'high',
      structure: 'flexible',
      pace: 'gradual'
    },
    vulnerability_comfort: {
      level: 'moderate',
      trust_building: 'gradual',
      confidence: 0.5
    }
  };
  
  // Process each answer to update preferences
  for (const answer of answers) {
    switch (answer.questionId) {
      case 'therapeutic_approach':
        preferences.therapeutic_philosophy = analyzeTherapeuticApproachAnswer(answer.value);
        break;
      case 'change_beliefs':
        preferences.change_beliefs = analyzeChangeBeliefsAnswer(answer.value);
        break;
      case 'vulnerability_comfort':
        preferences.vulnerability_comfort = analyzeVulnerabilityAnswer(answer.value);
        break;
      case 'communication_style':
        preferences.communication_style = analyzeCommunicationAnswer(answer.value);
        break;
    }
  }
  
  return preferences;
}

function analyzeTherapeuticApproachAnswer(answer) {
  const answerLower = answer.toLowerCase();
  
  if (answerLower.includes('cbt') || answerLower.includes('cognitive') || answerLower.includes('behavioral')) {
    return { primary: 'cbt', secondary: 'humanistic', confidence: 0.8 };
  } else if (answerLower.includes('humanistic') || answerLower.includes('growth') || answerLower.includes('potential')) {
    return { primary: 'humanistic', secondary: 'mindfulness', confidence: 0.8 };
  } else if (answerLower.includes('mindfulness') || answerLower.includes('acceptance') || answerLower.includes('present')) {
    return { primary: 'mindfulness', secondary: 'humanistic', confidence: 0.8 };
  } else if (answerLower.includes('psychodynamic') || answerLower.includes('insight') || answerLower.includes('patterns')) {
    return { primary: 'psychodynamic', secondary: 'humanistic', confidence: 0.8 };
  }
  
  return { primary: 'humanistic', secondary: 'mindfulness', confidence: 0.5 };
}

function analyzeChangeBeliefsAnswer(answer) {
  const answerLower = answer.toLowerCase();
  
  if (answerLower.includes('gradual') || answerLower.includes('consistent') || answerLower.includes('practice')) {
    return { gradual_vs_breakthrough: 'gradual', internal_vs_external: 'internal', confidence: 0.8 };
  } else if (answerLower.includes('breakthrough') || answerLower.includes('insight') || answerLower.includes('moment')) {
    return { gradual_vs_breakthrough: 'breakthrough', internal_vs_external: 'internal', confidence: 0.8 };
  } else if (answerLower.includes('root') || answerLower.includes('cause') || answerLower.includes('understanding')) {
    return { gradual_vs_breakthrough: 'gradual', internal_vs_external: 'external', confidence: 0.8 };
  } else if (answerLower.includes('acceptance') || answerLower.includes('present') || answerLower.includes('awareness')) {
    return { gradual_vs_breakthrough: 'gradual', internal_vs_external: 'internal', confidence: 0.8 };
  }
  
  return { gradual_vs_breakthrough: 'gradual', internal_vs_external: 'internal', confidence: 0.5 };
}

function analyzeVulnerabilityAnswer(answer) {
  const level = parseInt(answer);
  
  if (level <= 3) {
    return { level: 'low', trust_building: 'very_gradual', confidence: 0.8 };
  } else if (level <= 6) {
    return { level: 'moderate', trust_building: 'gradual', confidence: 0.8 };
  } else {
    return { level: 'high', trust_building: 'moderate', confidence: 0.8 };
  }
}

function analyzeCommunicationAnswer(answer) {
  const answerLower = answer.toLowerCase();
  
  if (answerLower.includes('direct') || answerLower.includes('solution')) {
    return { directness: 'high', warmth: 'moderate', structure: 'high', pace: 'moderate' };
  } else if (answerLower.includes('warm') || answerLower.includes('reflective')) {
    return { directness: 'low', warmth: 'very_high', structure: 'low', pace: 'gradual' };
  } else if (answerLower.includes('gentle') || answerLower.includes('non-directive')) {
    return { directness: 'low', warmth: 'high', structure: 'low', pace: 'slow' };
  } else if (answerLower.includes('analytical') || answerLower.includes('insight')) {
    return { directness: 'moderate', warmth: 'high', structure: 'moderate', pace: 'gradual' };
  }
  
  return { directness: 'moderate', warmth: 'high', structure: 'flexible', pace: 'gradual' };
}

function mergePreferences(answerPreferences, conversationPreferences) {
  // Merge preferences from answers and conversations with weighted confidence
  const merged = { ...conversationPreferences };
  
  // If we have high-confidence answers, use them to adjust conversation-based preferences
  if (answerPreferences.therapeutic_philosophy?.confidence > 0.7) {
    merged.therapeuticPreferences.primary = answerPreferences.therapeutic_philosophy.primary;
    merged.therapeuticPreferences.secondary = answerPreferences.therapeutic_philosophy.secondary;
    merged.confidence = Math.max(merged.confidence, answerPreferences.therapeutic_philosophy.confidence);
  }
  
  if (answerPreferences.communication_style) {
    merged.therapeuticPreferences.communication_style = {
      ...merged.therapeuticPreferences.communication_style,
      ...answerPreferences.communication_style
    };
  }
  
  if (answerPreferences.vulnerability_comfort?.confidence > 0.7) {
    merged.therapeuticPreferences.conversation_depth = beliefService.mapVulnerabilityToDepth(
      answerPreferences.vulnerability_comfort.level
    );
  }
  
  return merged;
}

// Database helper functions (implement with your database)
async function saveAssessmentResults(userId, assessmentType, results) {
  // TODO: Implement database insert
  console.log(`Saving assessment results: ${userId} - ${assessmentType}`);
}

async function getConversationHistory(userId) {
  // TODO: Implement database query
  return [];
}

async function getUserProfile(userId) {
  // TODO: Implement database query
  return {
    id: userId,
    therapeutic_history: [],
    preferences: {},
    goals: []
  };
}

async function saveTherapeuticProfile(userId, profile) {
  // TODO: Implement database insert/update
  console.log(`Saving therapeutic profile: ${userId}`);
}

async function getTherapeuticProfile(userId) {
  // TODO: Implement database query
  return null;
}

module.exports = router;