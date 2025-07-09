const axios = require('axios');

/**
 * Service for integrating with Epistemic Me SDK
 * Handles belief modeling and self-model management
 */
class EpistemicMeService {
  constructor() {
    this.baseUrl = process.env.EPISTEMIC_ME_URL || 'http://localhost:8120';
    this.apiKey = process.env.EPISTEMIC_ME_API_KEY;
    this.isAvailable = false;
    this.checkAvailability();
  }

  /**
   * Check if Epistemic Me service is available
   */
  async checkAvailability() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
        headers: this.getHeaders()
      });
      this.isAvailable = response.status === 200;
      console.log('Epistemic Me SDK available:', this.isAvailable);
    } catch (error) {
      this.isAvailable = false;
      console.log('Epistemic Me SDK not available, using fallback belief detection');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Create or retrieve user's self-model
   */
  async ensureUserSelfModel(userId) {
    if (!this.isAvailable) return null;

    try {
      // Try to retrieve existing self-model
      const response = await axios.get(`${this.baseUrl}/api/self-models/${userId}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Create new self-model if doesn't exist
        return this.createSelfModel(userId);
      }
      console.error('Error retrieving self-model:', error.message);
      return null;
    }
  }

  /**
   * Create a new self-model for user
   */
  async createSelfModel(userId) {
    if (!this.isAvailable) return null;

    try {
      const response = await axios.post(`${this.baseUrl}/api/self-models`, {
        userId,
        philosophies: ['therapeutic_mental_health'],
        metadata: {
          domain: 'mental_health',
          createdAt: new Date().toISOString()
        }
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating self-model:', error.message);
      return null;
    }
  }

  /**
   * Track belief from conversation content
   */
  async trackBeliefFromConversation(userId, content, beliefType = 'STATEMENT') {
    if (!this.isAvailable) return null;

    try {
      const response = await axios.post(`${this.baseUrl}/api/beliefs`, {
        userId,
        content,
        beliefType,
        extrapolateContexts: true,
        metadata: {
          source: 'conversation',
          timestamp: new Date().toISOString()
        }
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking belief:', error.message);
      return null;
    }
  }

  /**
   * Create dialectic interaction for therapeutic conversation
   */
  async createTherapeuticDialectic(userId, question, answer = null) {
    if (!this.isAvailable) return null;

    try {
      const response = await axios.post(`${this.baseUrl}/api/dialectics`, {
        userId,
        dialecticType: 'THERAPEUTIC',
        question,
        answer: answer ? {
          userAnswer: answer,
          createdAtMillisUtc: Date.now()
        } : null
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating dialectic:', error.message);
      return null;
    }
  }

  /**
   * Update dialectic with user's answer
   */
  async updateDialectic(userId, dialecticId, answer) {
    if (!this.isAvailable) return null;

    try {
      const response = await axios.put(`${this.baseUrl}/api/dialectics/${dialecticId}`, {
        userId,
        answer: {
          userAnswer: answer,
          createdAtMillisUtc: Date.now()
        }
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating dialectic:', error.message);
      return null;
    }
  }

  /**
   * Get user's complete belief system
   */
  async getUserBeliefSystem(userId) {
    if (!this.isAvailable) return null;

    try {
      const response = await axios.get(`${this.baseUrl}/api/belief-systems/${userId}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error retrieving belief system:', error.message);
      return null;
    }
  }

  /**
   * Get user's therapeutic preferences based on beliefs
   */
  async getTherapeuticPreferences(userId) {
    if (!this.isAvailable) return null;

    try {
      const beliefSystem = await this.getUserBeliefSystem(userId);
      if (!beliefSystem) return null;

      // Extract therapeutic preferences from belief system
      const preferences = this.extractTherapeuticPreferences(beliefSystem);
      return preferences;
    } catch (error) {
      console.error('Error getting therapeutic preferences:', error.message);
      return null;
    }
  }

  /**
   * Extract therapeutic preferences from belief system
   */
  extractTherapeuticPreferences(beliefSystem) {
    const preferences = {
      primaryModality: 'humanistic', // default
      vulnerabilityComfort: 5,
      changeBeliefs: 'gradual',
      communicationStyle: {
        directness: 5,
        warmth: 7,
        structure: 5,
        pace: 5
      }
    };

    // Analyze beliefs to determine preferences
    if (beliefSystem.beliefs) {
      beliefSystem.beliefs.forEach(belief => {
        // Look for therapeutic approach indicators
        if (belief.content.toLowerCase().includes('practical') || 
            belief.content.toLowerCase().includes('solution')) {
          preferences.primaryModality = 'cbt';
        } else if (belief.content.toLowerCase().includes('growth') || 
                   belief.content.toLowerCase().includes('potential')) {
          preferences.primaryModality = 'humanistic';
        } else if (belief.content.toLowerCase().includes('mindful') || 
                   belief.content.toLowerCase().includes('present')) {
          preferences.primaryModality = 'mindfulness';
        }

        // Look for vulnerability indicators
        if (belief.content.toLowerCase().includes('comfortable sharing') || 
            belief.content.toLowerCase().includes('open')) {
          preferences.vulnerabilityComfort = Math.min(preferences.vulnerabilityComfort + 1, 10);
        }
      });
    }

    return preferences;
  }

  /**
   * Track therapeutic outcome
   */
  async trackTherapeuticOutcome(userId, conversationId, outcome) {
    if (!this.isAvailable) return null;

    try {
      const response = await axios.post(`${this.baseUrl}/api/outcomes`, {
        userId,
        conversationId,
        outcome,
        metadata: {
          domain: 'mental_health',
          timestamp: new Date().toISOString()
        }
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking outcome:', error.message);
      return null;
    }
  }
}

module.exports = new EpistemicMeService();