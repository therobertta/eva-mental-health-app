const express = require('express');
const router = express.Router();
const TherapeuticConversationService = require('../services/therapeuticConversationService');
const BeliefModelingService = require('../services/beliefModelingService');

const therapeuticService = new TherapeuticConversationService();
const beliefService = new BeliefModelingService();

/**
 * POST /api/conversations/message
 * Send a message and get a therapeutic response
 */
router.post('/message', async (req, res) => {
  try {
    const { message, userId, context = {} } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        error: 'Message and userId are required'
      });
    }

    // Get conversation history (implement with your database)
    const conversationHistory = await getConversationHistory(userId);
    
    // Analyze for crisis indicators
    const crisisAnalysis = therapeuticService.analyzeCrisisIndicators(message, conversationHistory);
    
    // If crisis detected, provide immediate safety response
    if (crisisAnalysis.crisis_indicators) {
      const crisisResources = therapeuticService.getCrisisResources();
      return res.json({
        response: `I'm concerned about what you're sharing. ${crisisResources.message}`,
        therapeuticModality: 'Crisis Response',
        suggestedExercises: ['safety_planning', 'grounding_techniques'],
        conversationDepth: 'crisis',
        beliefConfidence: 1.0,
        crisisResources: crisisResources,
        requiresImmediateAttention: true
      });
    }

    // Generate therapeutic response
    const therapeuticResponse = await therapeuticService.generateTherapeuticResponse(
      message,
      userId,
      conversationHistory,
      { ...context, crisis_indicators: crisisAnalysis.crisis_indicators }
    );

    // Save conversation to database (implement with your database)
    await saveConversation(userId, 'user', message);
    await saveConversation(userId, 'assistant', therapeuticResponse.response);

    res.json(therapeuticResponse);
    
  } catch (error) {
    console.error('Error in conversation endpoint:', error);
    res.status(500).json({
      error: 'Failed to generate therapeutic response',
      details: error.message
    });
  }
});

/**
 * GET /api/conversations/history/:userId
 * Get conversation history for a user
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const conversationHistory = await getConversationHistory(userId, parseInt(limit), parseInt(offset));
    
    res.json({
      conversations: conversationHistory,
      total: conversationHistory.length
    });
    
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation history',
      details: error.message
    });
  }
});

/**
 * POST /api/conversations/analyze-beliefs
 * Analyze user's therapeutic beliefs and preferences
 */
router.post('/analyze-beliefs', async (req, res) => {
  try {
    const { userId, conversations = [] } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'UserId is required'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);
    
    // Analyze therapeutic preferences
    const therapeuticPreferences = await beliefService.inferTherapeuticPreferences(
      conversations,
      userProfile
    );

    res.json({
      therapeuticPreferences,
      userProfile,
      analysisTimestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing beliefs:', error);
    res.status(500).json({
      error: 'Failed to analyze therapeutic beliefs',
      details: error.message
    });
  }
});

/**
 * POST /api/conversations/adapt-conversation
 * Adapt a conversation based on therapeutic preferences
 */
router.post('/adapt-conversation', async (req, res) => {
  try {
    const { message, therapeuticPreferences, context = {} } = req.body;
    
    if (!message || !therapeuticPreferences) {
      return res.status(400).json({
        error: 'Message and therapeuticPreferences are required'
      });
    }

    const adaptation = await beliefService.adaptConversation(
      message,
      therapeuticPreferences,
      context
    );

    res.json(adaptation);
    
  } catch (error) {
    console.error('Error adapting conversation:', error);
    res.status(500).json({
      error: 'Failed to adapt conversation',
      details: error.message
    });
  }
});

/**
 * GET /api/conversations/therapeutic-modalities
 * Get available therapeutic modalities
 */
router.get('/therapeutic-modalities', (req, res) => {
  const modalities = Object.keys(therapeuticService.therapeuticModalities).map(key => ({
    id: key,
    ...therapeuticService.therapeuticModalities[key]
  }));

  res.json({
    modalities,
    total: modalities.length
  });
});

/**
 * POST /api/conversations/feedback
 * Collect user feedback on therapeutic responses
 */
router.post('/feedback', async (req, res) => {
  try {
    const { userId, messageId, rating, feedback, therapeuticModality } = req.body;
    
    if (!userId || !messageId || !rating) {
      return res.status(400).json({
        error: 'UserId, messageId, and rating are required'
      });
    }

    // Save feedback to database (implement with your database)
    await saveFeedback(userId, messageId, rating, feedback, therapeuticModality);

    res.json({
      message: 'Feedback saved successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({
      error: 'Failed to save feedback',
      details: error.message
    });
  }
});

// Database helper functions (implement with your database)
async function getConversationHistory(userId, limit = 50, offset = 0) {
  // TODO: Implement database query
  // Example: SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
  return [];
}

async function saveConversation(userId, role, content) {
  // TODO: Implement database insert
  // Example: INSERT INTO conversations (user_id, role, content, created_at) VALUES ($1, $2, $3, NOW())
  console.log(`Saving conversation: ${userId} - ${role} - ${content.substring(0, 50)}...`);
}

async function getUserProfile(userId) {
  // TODO: Implement database query
  // Example: SELECT * FROM user_profiles WHERE user_id = $1
  return {
    id: userId,
    therapeutic_history: [],
    preferences: {},
    goals: []
  };
}

async function saveFeedback(userId, messageId, rating, feedback, therapeuticModality) {
  // TODO: Implement database insert
  // Example: INSERT INTO feedback (user_id, message_id, rating, feedback, therapeutic_modality, created_at) VALUES ($1, $2, $3, $4, $5, NOW())
  console.log(`Saving feedback: ${userId} - ${messageId} - ${rating} - ${therapeuticModality}`);
}

module.exports = router;