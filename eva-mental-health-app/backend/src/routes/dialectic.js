const express = require('express');
const { authenticateToken } = require('../utils/auth');
const dialecticService = require('../services/dialecticService');
const beliefModelingService = require('../services/beliefModelingService');
const db = require('../../config/database');

const router = express.Router();

// Start a dialectic conversation
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { focusArea } = req.body;

    if (!focusArea) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Focus area is required'
        }
      });
    }

    // Start dialectic conversation
    const dialectic = await dialecticService.startTherapeuticDialectic(userId, focusArea);

    res.json({
      dialecticId: dialectic.dialecticId,
      question: dialectic.question,
      focusArea: dialectic.focusArea,
      source: dialectic.source
    });

  } catch (error) {
    console.error('Start dialectic error:', error);
    res.status(500).json({
      error: {
        code: 'DIALECTIC_START_FAILED',
        message: 'Failed to start dialectic conversation'
      }
    });
  }
});

// Submit response to dialectic question
router.post('/respond', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { dialecticId, response, focusArea } = req.body;

    if (!response || !focusArea) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Response and focus area are required'
        }
      });
    }

    // Process dialectic response
    const result = await dialecticService.processDialecticResponse(
      userId,
      dialecticId,
      response,
      focusArea
    );

    // Update user's belief profile based on insights
    if (result.analysis.beliefs.length > 0) {
      // This would update the user's profile in a real implementation
      console.log('Updating user beliefs:', result.analysis.beliefs);
    }

    res.json({
      followUp: result.followUp,
      reflection: result.suggestedReflection,
      insights: result.beliefInsights,
      analysis: result.analysis
    });

  } catch (error) {
    console.error('Process dialectic response error:', error);
    res.status(500).json({
      error: {
        code: 'DIALECTIC_RESPONSE_FAILED',
        message: 'Failed to process dialectic response'
      }
    });
  }
});

// Get dialectic suggestions for user
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's current beliefs
    const profileResult = await db.query(
      'SELECT therapeutic_preferences FROM therapeutic_profiles WHERE user_id = $1',
      [userId]
    );

    const currentBeliefs = profileResult.rows[0]?.therapeutic_preferences || {};

    // Get dialectic suggestions
    const suggestions = await dialecticService.getDialecticSuggestions(userId, currentBeliefs);

    res.json({
      suggestions,
      exploredAreas: Object.keys(currentBeliefs)
    });

  } catch (error) {
    console.error('Get dialectic suggestions error:', error);
    res.status(500).json({
      error: {
        code: 'SUGGESTIONS_FETCH_FAILED',
        message: 'Failed to get dialectic suggestions'
      }
    });
  }
});

// Get dialectic history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    // In a full implementation, this would fetch from dialectic_conversations table
    res.json({
      conversations: [],
      totalInsights: 0,
      exploredAreas: []
    });

  } catch (error) {
    console.error('Get dialectic history error:', error);
    res.status(500).json({
      error: {
        code: 'HISTORY_FETCH_FAILED',
        message: 'Failed to get dialectic history'
      }
    });
  }
});

module.exports = router;